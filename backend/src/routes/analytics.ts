import express from 'express';
import pool from '../db/connection';
import { authenticate, AuthRequest } from '../middleware/auth';
import { generateWeeklySummary } from '../services/aiService';

const router = express.Router();

// Get daily travel analytics for user
router.get('/daily', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.id;

    // Get user's frequent locations
    const [locations] = await pool.query(
      `SELECT location_name, location_type, search_count, last_searched_at
       FROM user_locations
       WHERE user_id = ?
       ORDER BY search_count DESC, last_searched_at DESC
       LIMIT 10`,
      [userId]
    ) as any[];

    // Get incidents for user's frequent locations
    const locationNames = locations.map((loc: any) => loc.location_name).filter(Boolean);
    
    let incidentsByLocation: any[] = [];
    if (locationNames.length > 0) {
      const placeholders = locationNames.map(() => '?').join(',');
      const [incidents] = await pool.query(
        `SELECT i.*, ul.location_name
         FROM incidents i
         JOIN user_locations ul ON (
           ABS(i.latitude - ul.latitude) < 0.01 AND
           ABS(i.longitude - ul.longitude) < 0.01
         )
         WHERE ul.user_id = ? AND i.status = 'active'
         ORDER BY i.created_at DESC
         LIMIT 20`,
        [userId]
      ) as any[];
      incidentsByLocation = incidents;
    }

    // Calculate peak hours for user's frequent locations
    let peakHours: any[] = [];
    let dailyPeakHour: { hour: number; time: string; count: number } | null = null;

    if (locationNames.length > 0) {
      const placeholders = locationNames.map(() => '?').join(',');
      const [userPeakHours] = await pool.query(
        `SELECT HOUR(ul.last_searched_at) as hour, COUNT(*) as count
         FROM user_locations ul
         WHERE ul.user_id = ? AND ul.location_type IN ('travel_start', 'travel_end')
           AND DATE(ul.last_searched_at) = CURDATE()
         GROUP BY HOUR(ul.last_searched_at)
         ORDER BY count DESC
         LIMIT 1`,
        [userId]
      ) as any[];

      if (userPeakHours.length > 0) {
        const peak = userPeakHours[0];
        dailyPeakHour = {
          hour: peak.hour,
          time: `${peak.hour.toString().padStart(2, '0')}:00`,
          count: peak.count,
        };
      }
    }

    // Also get general peak hours for comparison
    const [generalPeakHours] = await pool.query(
      `SELECT HOUR(created_at) as hour, COUNT(*) as count
       FROM incidents
       WHERE status = 'active'
       GROUP BY HOUR(created_at)
       ORDER BY count DESC
       LIMIT 8`
    ) as any[];

    res.json({
      frequentLocations: locations,
      incidentsByLocation,
      peakHours: generalPeakHours.reduce((acc: Record<string, number>, row: any) => {
        acc[row.hour] = row.count;
        return acc;
      }, {}),
      dailyPeakHour,
    });
  } catch (err) {
    next(err);
  }
});

// Get weekly summary with AI generation - public endpoint
router.get('/weekly-summary', async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    
    const start = startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const end = endDate || new Date().toISOString().split('T')[0];

    // Get incident statistics
    const [incidentStats] = await pool.query(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN is_verified THEN 1 ELSE 0 END) as verified,
        incident_type,
        COUNT(*) as count
       FROM incidents
       WHERE DATE(created_at) BETWEEN ? AND ?
       GROUP BY incident_type
       WITH ROLLUP`,
      [start, end]
    ) as any[];

    const totalIncidents = incidentStats.find((s: any) => s.incident_type === null)?.total || 0;
    const verifiedIncidents = incidentStats.find((s: any) => s.incident_type === null)?.verified || 0;

    const incidentTypes: Record<string, number> = {};
    incidentStats
      .filter((s: any) => s.incident_type !== null)
      .forEach((s: any) => {
        incidentTypes[s.incident_type] = s.count;
      });

    // Get peak hours
    const [peakHoursData] = await pool.query(
      `SELECT HOUR(created_at) as hour, COUNT(*) as count
       FROM incidents
       WHERE DATE(created_at) BETWEEN ? AND ?
       GROUP BY HOUR(created_at)
       ORDER BY count DESC`,
      [start, end]
    ) as any[];

    const peakHours: Record<string, number> = {};
    peakHoursData.forEach((row: any) => {
      peakHours[`${row.hour}:00`] = row.count;
    });

    // Get top locations
    const [topLocations] = await pool.query(
      `SELECT location_description as location, COUNT(*) as count
       FROM incidents
       WHERE DATE(created_at) BETWEEN ? AND ?
         AND location_description IS NOT NULL
       GROUP BY location_description
       ORDER BY count DESC
       LIMIT 5`,
      [start, end]
    ) as any[];

    // Generate AI summary
    const summary = await generateWeeklySummary({
      totalIncidents,
      verifiedIncidents,
      incidentTypes,
      peakHours,
      topLocations: topLocations.map((l: any) => ({
        location: l.location,
        count: l.count,
      })),
      weekRange: { start, end },
    });

    res.json({
      summary,
      statistics: {
        totalIncidents,
        verifiedIncidents,
        incidentTypes,
        peakHours,
        topLocations,
      },
      weekRange: { start, end },
    });
  } catch (err) {
    next(err);
  }
});

// Get peak hour traffic comparison (normal vs event days) - public endpoint
router.get('/peak-hours', async (req, res, next) => {
  try {
    // Normal days (excluding event days)
    const [normalDays] = await pool.query(
      `SELECT HOUR(i.created_at) as hour, COUNT(*) as count
       FROM incidents i
       LEFT JOIN events e ON DATE(i.created_at) = DATE(e.event_date)
       WHERE e.id IS NULL
         AND i.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
       GROUP BY HOUR(i.created_at)
       ORDER BY hour`
    ) as any[];

    // Event days
    const [eventDays] = await pool.query(
      `SELECT HOUR(i.created_at) as hour, COUNT(*) as count
       FROM incidents i
       JOIN events e ON DATE(i.created_at) = DATE(e.event_date)
       WHERE i.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
       GROUP BY HOUR(i.created_at)
       ORDER BY hour`
    ) as any[];

    const normalizeHours = (data: any[]) => {
      const result: Record<string, number> = {};
      for (let i = 0; i < 24; i++) {
        result[`${i}:00`] = 0;
      }
      data.forEach((row: any) => {
        result[`${row.hour}:00`] = row.count;
      });
      return result;
    };

    res.json({
      normalDays: normalizeHours(normalDays),
      eventDays: normalizeHours(eventDays),
    });
  } catch (err) {
    next(err);
  }
});

// Get personalized analytics with predictions - requires authentication
router.get('/personalized', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.id;

    // Get user's travel history (routes)
    const [travelHistory] = await pool.query(
      `SELECT 
        location_name,
        location_type,
        latitude,
        longitude,
        last_searched_at,
        HOUR(last_searched_at) as hour
      FROM user_locations
      WHERE user_id = ? AND location_type IN ('travel_start', 'travel_end')
      ORDER BY last_searched_at DESC
      LIMIT 100`,
      [userId]
    ) as any[];

    // Calculate most frequent routes
    const routes: Record<string, { from: string; to: string; count: number; avgHour: number }> = {};
    
    for (let i = 0; i < travelHistory.length - 1; i++) {
      const start = travelHistory[i];
      const end = travelHistory[i + 1];
      
      if (start.location_type === 'travel_start' && end.location_type === 'travel_end') {
        const routeKey = `${start.location_name} → ${end.location_name}`;
        if (!routes[routeKey]) {
          routes[routeKey] = {
            from: start.location_name,
            to: end.location_name,
            count: 0,
            avgHour: 0,
          };
        }
        routes[routeKey].count++;
        routes[routeKey].avgHour = (routes[routeKey].avgHour + (start.hour || 0)) / 2;
      }
    }

    // Sort routes by frequency
    const mostFrequentRoutes = Object.values(routes)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Calculate average travel times (mock data based on route frequency)
    const routesWithTimes = mostFrequentRoutes.map((route) => ({
      ...route,
      avgTravelTime: Math.floor(15 + Math.random() * 25), // 15-40 minutes (mock)
    }));

    // Peak hour prediction
    const hourCounts: Record<number, number> = {};
    travelHistory.forEach((trip: any) => {
      const hour = trip.hour || 0;
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    const peakHour = Object.entries(hourCounts)
      .sort(([, a], [, b]) => (b as number) - (a as number))[0];

    // Weekly summary for user's routes
    const [weeklyData] = await pool.query(
      `SELECT 
        DATE(last_searched_at) as date,
        COUNT(*) as trip_count
      FROM user_locations
      WHERE user_id = ? 
        AND location_type IN ('travel_start', 'travel_end')
        AND last_searched_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      GROUP BY DATE(last_searched_at)
      ORDER BY date DESC`,
      [userId]
    ) as any[];

    res.json({
      mostFrequentRoutes: routesWithTimes,
      peakHour: peakHour ? {
        hour: parseInt(peakHour[0] as string),
        time: `${(peakHour[0] as string).padStart(2, '0')}:00`,
        frequency: peakHour[1] as number,
      } : null,
      weeklyTrips: weeklyData,
      totalTrips: travelHistory.length / 2, // Pairs of start/end
    });
  } catch (err) {
    next(err);
  }
});

// Get predictions for next likely trip
router.get('/predictions', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.id;
    const currentHour = new Date().getHours();

    // Get most recent trips
    const [recentTrips] = await pool.query(
      `SELECT 
        location_name,
        location_type,
        last_searched_at,
        HOUR(last_searched_at) as hour
      FROM user_locations
      WHERE user_id = ? AND location_type = 'travel_end'
      ORDER BY last_searched_at DESC
      LIMIT 5`,
      [userId]
    ) as any[];

    if (recentTrips.length === 0) {
      return res.json({
        predictedDestination: null,
        predictedTraffic: null,
        message: 'No travel history yet. Start traveling to get predictions!',
      });
    }

    // Predict next destination based on patterns
    // Simple heuristic: most common destination at similar times
    const [mostCommonDest] = await pool.query(
      `SELECT 
        location_name,
        COUNT(*) as frequency,
        AVG(HOUR(last_searched_at)) as avg_hour
      FROM user_locations
      WHERE user_id = ? 
        AND location_type = 'travel_end'
        AND HOUR(last_searched_at) BETWEEN ? AND ?
      GROUP BY location_name
      ORDER BY frequency DESC, ABS(AVG(HOUR(last_searched_at)) - ?)
      LIMIT 1`,
      [userId, currentHour - 2, currentHour + 2, currentHour]
    ) as any[];

    if (mostCommonDest.length === 0) {
      return res.json({
        predictedDestination: null,
        predictedTraffic: 'unknown',
        message: 'Insufficient data for predictions.',
      });
    }

    const dest = mostCommonDest[0];
    
    // Predict traffic based on time and location
    let predictedTraffic: 'low' | 'moderate' | 'high' = 'moderate';
    if (currentHour >= 7 && currentHour <= 9) {
      predictedTraffic = 'high'; // Morning rush
    } else if (currentHour >= 17 && currentHour <= 19) {
      predictedTraffic = 'high'; // Evening rush
    } else if (currentHour >= 10 && currentHour <= 15) {
      predictedTraffic = 'low';
    }

    res.json({
      predictedDestination: dest.location_name,
      predictedTraffic,
      confidence: dest.frequency > 3 ? 'high' : 'medium',
      typicalTime: `${Math.round(dest.avg_hour).toString().padStart(2, '0')}:00`,
      message: `You usually travel to ${dest.location_name} around ${Math.round(dest.avg_hour).toString().padStart(2, '0')}:00 — Expect ${predictedTraffic} traffic.`,
    });
  } catch (err) {
    next(err);
  }
});

export default router;

