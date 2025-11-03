import express from 'express';
import pool from '../db/connection';
import { authenticate, requireVerified, AuthRequest } from '../middleware/auth';
import { reportRateLimiter } from '../middleware/rateLimiter';
import { uploadReportPhotos } from '../middleware/upload';
import { validateGPSLocation } from '../services/gpsValidation';
import { calculateSimilarity, calculateCredibilityBoost } from '../services/textSimilarity';
import path from 'path';
import Joi from 'joi';

const router = express.Router();

const reportSchema = Joi.object({
  incidentType: Joi.string().valid('major_accident', 'heavy_congestion', 'road_construction').required(),
  latitude: Joi.number().required(),
  longitude: Joi.number().required(),
  reportedLatitude: Joi.number().required(),
  reportedLongitude: Joi.number().required(),
  locationDescription: Joi.string().required(),
  route: Joi.string().required(),
  numberOfVehicles: Joi.number().integer().optional(),
  description: Joi.string().min(10).required(),
});

/**
 * POST /api/reports
 * Create incident report with multiple photos
 * Authenticated users can report (verification not required)
 */
router.post('/', authenticate, reportRateLimiter, uploadReportPhotos.array('photos', 5), async (req: AuthRequest, res, next) => {
  try {
    const { error, value } = reportSchema.validate({
      incidentType: req.body.incidentType,
      latitude: parseFloat(req.body.latitude),
      longitude: parseFloat(req.body.longitude),
      reportedLatitude: parseFloat(req.body.reportedLatitude || req.body.latitude),
      reportedLongitude: parseFloat(req.body.reportedLongitude || req.body.longitude),
      locationDescription: req.body.locationDescription,
      route: req.body.route,
      numberOfVehicles: req.body.numberOfVehicles ? parseInt(req.body.numberOfVehicles) : undefined,
      description: req.body.description,
    });

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
      route,
      numberOfVehicles,
      description,
    } = value;

    // GPS Validation
    const gpsValidation = validateGPSLocation(
      { latitude: reportedLatitude, longitude: reportedLongitude },
      { latitude, longitude }
    );

    if (!gpsValidation.isValid && process.env.GPS_VALIDATION_ENABLED === 'true') {
      await pool.query(
        'UPDATE users SET gps_warnings = gps_warnings + 1 WHERE id = ?',
        [userId]
      );

      const [users] = await pool.query(
        'SELECT gps_warnings FROM users WHERE id = ?',
        [userId]
      ) as any[];

      const warnings = users[0]?.gps_warnings || 0;

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

    // Check for similar reports
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

    // Get user to check if trusted
    const [users] = await pool.query(
      'SELECT is_trusted FROM users WHERE id = ?',
      [userId]
    ) as any[];
    const isTrusted = users[0]?.is_trusted || false;

    // Create incident
    const [result] = await pool.query(
      `INSERT INTO incidents 
       (user_id, incident_type, latitude, longitude, location_description,
        reported_latitude, reported_longitude, gps_distance_meters,
        number_of_vehicles, description, severity, credibility_score, 
        similar_reports_count, is_verified, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
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
        isTrusted, // Auto-verified if trusted user
      ]
    ) as any[];

    const incidentId = result.insertId;

    // Award 1 coin for each report submission (all users get 1 coin per report)
    const coinsAwarded = 1;
    
    // Update user's coin balance
    await pool.query(
      'UPDATE users SET coins_balance = coins_balance + ? WHERE id = ?',
      [coinsAwarded, userId]
    );

    // Log coin transaction for tracking
    try {
      await pool.query(
        `INSERT INTO coin_transactions 
         (user_id, transaction_type, amount, incident_id, description, status)
         VALUES (?, 'earned', ?, ?, ?, 'completed')`,
        [
          userId,
          coinsAwarded,
          incidentId,
          `Coins earned for incident report #${incidentId}`,
        ]
      );
    } catch (txError) {
      // If coin_transactions table doesn't exist, just log the error but don't fail
      console.warn('Could not log coin transaction:', txError);
    }

    // Handle photo uploads
    const photoPaths: string[] = [];

    if (req.files && Array.isArray(req.files)) {
      // Process each photo
      for (const file of req.files) {
        const relativePath = path.relative(path.join(__dirname, '../../uploads'), file.path);
        
        // Save photo record
        await pool.query(
          `INSERT INTO incident_photos (incident_id, photo_path, file_size)
           VALUES (?, ?, ?)`,
          [incidentId, relativePath, file.size]
        );

        photoPaths.push(relativePath);
      }

      // Update photo count
      await pool.query(
        'UPDATE users SET photo_count = photo_count + ? WHERE id = ?',
        [req.files.length, userId]
      );
    }

    // Update incident with coins awarded
    await pool.query(
      'UPDATE incidents SET coins_awarded = ? WHERE id = ?',
      [coinsAwarded, incidentId]
    );

    // Get updated coin balance for response
    const [updatedUser] = await pool.query(
      'SELECT coins_balance FROM users WHERE id = ?',
      [userId]
    ) as any[];

    res.status(201).json({
      id: incidentId,
      message: 'Incident reported successfully',
      coinsAwarded: coinsAwarded,
      newCoinBalance: updatedUser[0]?.coins_balance || 0,
      photoPaths,
      credibilityScore,
      similarReportsCount,
      isVerified: isTrusted,
    });
  } catch (err) {
    next(err);
  }
});

export default router;

