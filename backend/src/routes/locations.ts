import express from 'express';
import pool from '../db/connection';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = express.Router();

/**
 * Track user location (travel start, travel end, or search)
 * Used for analytics and personalization
 */
router.post('/track', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { latitude, longitude, locationName, locationType = 'search' } = req.body;
    const userId = req.user!.id;

    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Latitude and longitude required' });
    }

    // Check if location already exists for this user
    const [existing] = await pool.query(
      `SELECT id, search_count FROM user_locations
       WHERE user_id = ? AND location_name = ? AND location_type = ?
       LIMIT 1`,
      [userId, locationName, locationType]
    ) as any[];

    if (existing.length > 0) {
      // Update existing location (increment search count)
      await pool.query(
        `UPDATE user_locations
         SET search_count = search_count + 1,
             last_searched_at = CURRENT_TIMESTAMP,
             latitude = ?,
             longitude = ?
         WHERE id = ?`,
        [latitude, longitude, existing[0].id]
      );
      res.json({ message: 'Location updated', locationId: existing[0].id });
    } else {
      // Create new location entry
      const [result] = await pool.query(
        `INSERT INTO user_locations 
         (user_id, latitude, longitude, location_name, location_type, search_count)
         VALUES (?, ?, ?, ?, ?, 1)`,
        [userId, latitude, longitude, locationName, locationType]
      ) as any[];
      res.json({ message: 'Location tracked', locationId: result.insertId });
    }
  } catch (err) {
    next(err);
  }
});

/**
 * Get user's location history
 */
router.get('/history', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.id;

    const [locations] = await pool.query(
      `SELECT location_name, location_type, search_count, last_searched_at, latitude, longitude
       FROM user_locations
       WHERE user_id = ?
       ORDER BY last_searched_at DESC
       LIMIT 50`,
      [userId]
    ) as any[];

    res.json(locations);
  } catch (err) {
    next(err);
  }
});

/**
 * Get user's search history with traffic incidents, speed, hour
 */
router.get('/search-history', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.id;

    // Get user's location searches with calculated travel data
    const [searches] = await pool.query(
      `SELECT 
        ul1.id as search_id,
        ul1.location_name as from_location,
        ul1.latitude as from_lat,
        ul1.longitude as from_lng,
        ul2.location_name as to_location,
        ul2.latitude as to_lat,
        ul2.longitude as to_lng,
        ul1.last_searched_at as search_time,
        HOUR(ul1.last_searched_at) as search_hour,
        -- Calculate distance (km) and estimated speed (km/h)
        (
          6371 * acos(
            cos(radians(ul1.latitude)) * cos(radians(ul2.latitude)) *
            cos(radians(ul2.longitude) - radians(ul1.longitude)) +
            sin(radians(ul1.latitude)) * sin(radians(ul2.latitude))
          )
        ) as distance_km,
        -- Mock average speed based on hour (rush hour = slower)
        CASE 
          WHEN HOUR(ul1.last_searched_at) BETWEEN 7 AND 9 THEN 25 -- Morning rush
          WHEN HOUR(ul1.last_searched_at) BETWEEN 17 AND 19 THEN 20 -- Evening rush
          ELSE 35 -- Normal hours
        END as avg_speed_kmh,
        TIMESTAMPDIFF(MINUTE, ul1.last_searched_at, ul2.last_searched_at) as travel_time_minutes
      FROM user_locations ul1
      LEFT JOIN user_locations ul2 ON 
        ul2.user_id = ul1.user_id 
        AND ul2.location_type = 'travel_end'
        AND ul2.last_searched_at > ul1.last_searched_at
        AND ul2.last_searched_at <= DATE_ADD(ul1.last_searched_at, INTERVAL 2 HOUR)
      WHERE ul1.user_id = ?
        AND ul1.location_type IN ('travel_start', 'search')
      ORDER BY ul1.last_searched_at DESC
      LIMIT 30`,
      [userId]
    ) as any[];

    // Get incidents for each route
    const searchHistory = await Promise.all(
      searches.map(async (search: any) => {
        if (!search.to_location) return null;

        // Find incidents along the route (within reasonable distance)
        const [incidents] = await pool.query(
          `SELECT 
            i.id, i.incident_type, i.description, i.severity,
            i.latitude, i.longitude, i.created_at,
            (
              6371 * acos(
                cos(radians(?)) * cos(radians(i.latitude)) *
                cos(radians(i.longitude) - radians(?)) +
                sin(radians(?)) * sin(radians(i.latitude))
              )
            ) as distance_km
          FROM incidents i
          WHERE i.status = 'active'
            AND (
              -- Check if incident is between from and to locations
              (6371 * acos(
                cos(radians(?)) * cos(radians(i.latitude)) *
                cos(radians(i.longitude) - radians(?)) +
                sin(radians(?)) * sin(radians(i.latitude))
              )) < 2
              OR
              (6371 * acos(
                cos(radians(?)) * cos(radians(i.latitude)) *
                cos(radians(i.longitude) - radians(?)) +
                sin(radians(?)) * sin(radians(i.latitude))
              )) < 2
            )
          ORDER BY distance_km ASC
          LIMIT 5`,
          [
            search.from_lat, search.from_lng, search.from_lat,
            search.from_lat, search.from_lng, search.from_lat,
            search.to_lat, search.to_lng, search.to_lat
          ]
        ) as any[];

        return {
          ...search,
          incidents: incidents || [],
          estimated_travel_time: search.travel_time_minutes || Math.round((search.distance_km || 5) / (search.avg_speed_kmh || 30) * 60),
        };
      })
    );

    res.json(searchHistory.filter(Boolean));
  } catch (err) {
    next(err);
  }
});

/**
 * Get predictions based on search history
 */
router.get('/predictions', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.id;
    const currentHour = new Date().getHours();
    const currentDay = new Date().getDay(); // 0 = Sunday, 6 = Saturday

    // Get user's most frequent routes and times
    const [routes] = await pool.query(
      `SELECT 
        ul1.location_name as from_location,
        ul2.location_name as to_location,
        COUNT(*) as frequency,
        AVG(HOUR(ul1.last_searched_at)) as avg_hour,
        AVG(TIMESTAMPDIFF(MINUTE, ul1.last_searched_at, ul2.last_searched_at)) as avg_duration,
        (
          6371 * acos(
            cos(radians(ul1.latitude)) * cos(radians(ul2.latitude)) *
            cos(radians(ul2.longitude) - radians(ul1.longitude)) +
            sin(radians(ul1.latitude)) * sin(radians(ul2.latitude))
          )
        ) as distance_km
      FROM user_locations ul1
      INNER JOIN user_locations ul2 ON 
        ul2.user_id = ul1.user_id 
        AND ul2.location_type = 'travel_end'
        AND ul2.last_searched_at > ul1.last_searched_at
        AND ul2.last_searched_at <= DATE_ADD(ul1.last_searched_at, INTERVAL 2 HOUR)
      WHERE ul1.user_id = ?
        AND ul1.location_type = 'travel_start'
        AND DAYOFWEEK(ul1.last_searched_at) = ?
      GROUP BY ul1.location_name, ul2.location_name, ul1.latitude, ul1.longitude, ul2.latitude, ul2.longitude
      HAVING frequency >= 2
      ORDER BY frequency DESC, avg_hour DESC
      LIMIT 5`,
      [userId, currentDay + 1]
    ) as any[];

    if (routes.length === 0) {
      return res.json({
        prediction: null,
        message: 'Not enough travel history to make predictions. Keep using the app to build your profile!',
      });
    }

    // Find the route most likely to be taken now
    const bestMatch = routes.find((r: any) => {
      const hourDiff = Math.abs(r.avg_hour - currentHour);
      return hourDiff <= 2;
    }) || routes[0];

    // Predict traffic based on hour and route frequency
    let predictedTraffic = 'moderate';
    const hour = Math.round(bestMatch.avg_hour);
    
    if ((hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19)) {
      predictedTraffic = 'heavy';
    } else if (hour >= 10 && hour <= 16) {
      predictedTraffic = 'moderate';
    } else {
      predictedTraffic = 'light';
    }

    // Adjust based on route frequency (more frequent = more traffic expected)
    if (bestMatch.frequency > 5) {
      predictedTraffic = predictedTraffic === 'light' ? 'moderate' : 
                         predictedTraffic === 'moderate' ? 'heavy' : 'heavy';
    }

    // Calculate predicted speed
    const baseSpeed = predictedTraffic === 'heavy' ? 20 : 
                     predictedTraffic === 'moderate' ? 30 : 40;
    const predictedSpeed = Math.round(baseSpeed * (1 - (bestMatch.distance_km / 20)));

    // Get current incidents for this route
    const [incidents] = await pool.query(
      `SELECT COUNT(*) as count, MAX(severity) as max_severity
       FROM incidents i
       WHERE i.status = 'active'
         AND i.created_at >= DATE_SUB(NOW(), INTERVAL 2 HOUR)`,
      []
    ) as any[];

    const incidentImpact = (incidents[0]?.count || 0) > 0 ? 'Delays possible' : 'Clear route';

    res.json({
      prediction: {
        from_location: bestMatch.from_location,
        to_location: bestMatch.to_location,
        predicted_time: `${hour.toString().padStart(2, '0')}:00`,
        predicted_traffic: predictedTraffic,
        predicted_speed: predictedSpeed,
        estimated_duration: Math.round(bestMatch.avg_duration || (bestMatch.distance_km / predictedSpeed * 60)),
        confidence: bestMatch.frequency > 3 ? 'high' : 'medium',
        incident_alert: incidentImpact,
      },
      message: `Based on your history, you usually travel from ${bestMatch.from_location} to ${bestMatch.to_location} around ${hour.toString().padStart(2, '0')}:00. Expect ${predictedTraffic} traffic.`,
    });
  } catch (err) {
    next(err);
  }
});

export default router;

