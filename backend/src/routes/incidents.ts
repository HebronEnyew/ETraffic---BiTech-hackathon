import express from 'express';
import pool from '../db/connection';
import { authenticate, requireVerified, AuthRequest } from '../middleware/auth';
import { reportRateLimiter } from '../middleware/rateLimiter';
import { validateGPSLocation } from '../services/gpsValidation';
import { calculateSimilarity, calculateCredibilityBoost } from '../services/textSimilarity';
import { awardCoinsForReport } from '../services/coinService';
import Joi from 'joi';

const router = express.Router();

const reportSchema = Joi.object({
  incidentType: Joi.string().valid('major_accident', 'heavy_congestion', 'road_construction').required(),
  latitude: Joi.number().required(),
  longitude: Joi.number().required(),
  reportedLatitude: Joi.number().required(),
  reportedLongitude: Joi.number().required(),
  locationDescription: Joi.string().optional(),
  numberOfVehicles: Joi.number().integer().optional(),
  description: Joi.string().min(10).required(),
});

// Get active incidents
router.get('/', async (req, res, next) => {
  try {
    const { type, verified, limit = 50 } = req.query;

    let query = `
      SELECT 
        i.*,
        u.email as reporter_email,
        u.is_verified as reporter_verified
      FROM incidents i
      JOIN users u ON i.user_id = u.id
      WHERE i.status = 'active'
    `;
    const params: any[] = [];

    if (type) {
      query += ' AND i.incident_type = ?';
      params.push(type);
    }

    if (verified !== undefined) {
      query += ' AND i.is_verified = ?';
      params.push(verified === 'true');
    }

    query += ' ORDER BY i.created_at DESC LIMIT ?';
    params.push(parseInt(limit as string));

    const [incidents] = await pool.query(query, params) as any[];

    res.json(incidents.map((inc: any) => ({
      id: inc.id,
      incidentType: inc.incident_type,
      latitude: parseFloat(inc.latitude),
      longitude: parseFloat(inc.longitude),
      locationDescription: inc.location_description,
      numberOfVehicles: inc.number_of_vehicles,
      description: inc.description,
      severity: inc.severity,
      isVerified: inc.is_verified,
      credibilityScore: parseFloat(inc.credibility_score),
      similarReportsCount: inc.similar_reports_count,
      coinsAwarded: inc.coins_awarded,
      status: inc.status,
      createdAt: inc.created_at,
      reporterEmail: inc.reporter_email,
      reporterVerified: inc.reporter_verified,
    })));
  } catch (err) {
    next(err);
  }
});

// Get incident by ID
router.get('/:id', async (req, res, next) => {
  try {
    const [incidents] = await pool.query(
      `SELECT i.*, u.email as reporter_email
       FROM incidents i
       JOIN users u ON i.user_id = u.id
       WHERE i.id = ?`,
      [req.params.id]
    ) as any[];

    if (incidents.length === 0) {
      return res.status(404).json({ error: 'Incident not found' });
    }

    const inc = incidents[0];
    res.json({
      id: inc.id,
      incidentType: inc.incident_type,
      latitude: parseFloat(inc.latitude),
      longitude: parseFloat(inc.longitude),
      locationDescription: inc.location_description,
      numberOfVehicles: inc.number_of_vehicles,
      description: inc.description,
      severity: inc.severity,
      isVerified: inc.is_verified,
      credibilityScore: parseFloat(inc.credibility_score),
      similarReportsCount: inc.similar_reports_count,
      coinsAwarded: inc.coins_awarded,
      status: inc.status,
      createdAt: inc.created_at,
      reporterEmail: inc.reporter_email,
    });
  } catch (err) {
    next(err);
  }
});

// Report incident (verified users only)
router.post('/', authenticate, requireVerified, reportRateLimiter, async (req: AuthRequest, res, next) => {
  try {
    const { error, value } = reportSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const userId = req.user!.id;
    const {
      incidentType,
      latitude,
      longitude,
      reportedLatitude,
      reportedLongitude,
      locationDescription,
      numberOfVehicles,
      description,
    } = value;

    // GPS Validation
    const gpsValidation = validateGPSLocation(
      { latitude: reportedLatitude, longitude: reportedLongitude },
      { latitude, longitude }
    );

    if (!gpsValidation.isValid && process.env.GPS_VALIDATION_ENABLED === 'true') {
      // Increment warning count
      await pool.query(
        'UPDATE users SET gps_warnings = gps_warnings + 1 WHERE id = ?',
        [userId]
      );

      const [users] = await pool.query(
        'SELECT gps_warnings FROM users WHERE id = ?',
        [userId]
      ) as any[];

      const warnings = users[0]?.gps_warnings || 0;

      // Ban user after 3 warnings
      if (warnings >= 3) {
        await pool.query(
          'UPDATE users SET is_banned = TRUE, ban_reason = ? WHERE id = ?',
          ['Multiple GPS location mismatches', userId]
        );
        return res.status(403).json({
          error: 'Account banned due to multiple GPS location mismatches',
        });
      }

      if (gpsValidation.warning) {
        return res.status(400).json({
          error: 'Reported location does not match GPS location',
          warning: true,
          distanceMeters: gpsValidation.distanceMeters,
        });
      }
    }

    // Determine severity
    let severity: 'minor' | 'medium' | 'major' = 'medium';
    if (incidentType === 'major_accident') severity = 'major';
    else if (incidentType === 'road_construction') severity = 'minor';

    // Check for similar reports in the area (within 500m)
    const [similarReports] = await pool.query(
      `SELECT id, description 
       FROM incidents 
       WHERE status = 'active'
       AND (
         6371000 * acos(
           cos(radians(?)) * cos(radians(latitude)) *
           cos(radians(longitude) - radians(?)) +
           sin(radians(?)) * sin(radians(latitude))
         )
       ) < 500
       AND id != ?`,
      [latitude, longitude, latitude, 0]
    ) as any[];

    let credibilityScore = 0.5;
    let similarReportsCount = 0;

    if (similarReports.length > 0) {
      const similarity = await calculateSimilarity(
        description,
        similarReports
      );
      similarReportsCount = similarity.similarCount;
      credibilityScore = 0.5 + calculateCredibilityBoost(similarity);
    }

    // Create incident
    const [result] = await pool.query(
      `INSERT INTO incidents 
       (user_id, incident_type, latitude, longitude, location_description,
        reported_latitude, reported_longitude, gps_distance_meters,
        number_of_vehicles, description, severity, credibility_score, similar_reports_count)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        incidentType,
        latitude,
        longitude,
        locationDescription || null,
        reportedLatitude,
        reportedLongitude,
        gpsValidation.distanceMeters,
        numberOfVehicles || null,
        description,
        severity,
        credibilityScore,
        similarReportsCount,
      ]
    ) as any[];

    const incidentId = result.insertId;

    // Award coins
    const coinsAwarded = await awardCoinsForReport(userId, incidentId, false);
    await pool.query(
      'UPDATE incidents SET coins_awarded = ? WHERE id = ?',
      [coinsAwarded, incidentId]
    );

    res.status(201).json({
      id: incidentId,
      message: 'Incident reported successfully',
      coinsAwarded,
      credibilityScore,
      similarReportsCount,
    });
  } catch (err) {
    next(err);
  }
});

export default router;

