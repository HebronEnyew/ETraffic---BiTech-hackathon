import express from 'express';
import pool from '../db/connection';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Get nearby alerts (within radius) - public endpoint
router.get('/', async (req, res, next) => {
  try {
    const { latitude, longitude, radius = 5000 } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Latitude and longitude required' });
    }

    const lat = parseFloat(latitude as string);
    const lng = parseFloat(longitude as string);
    const radiusMeters = parseInt(radius as string);

    // Get alerts within radius (including incident-based alerts)
    const [alerts] = await pool.query(
      `SELECT a.*,
       (
         6371000 * acos(
           cos(radians(?)) * cos(radians(a.latitude)) *
           cos(radians(a.longitude) - radians(?)) +
           sin(radians(?)) * sin(radians(a.latitude))
         )
       ) AS distance
       FROM alerts a
       WHERE (
         6371000 * acos(
           cos(radians(?)) * cos(radians(a.latitude)) *
           cos(radians(a.longitude) - radians(?)) +
           sin(radians(?)) * sin(radians(a.latitude))
         )
       ) < ?
       AND a.is_read = FALSE
       ORDER BY distance ASC
       LIMIT 50`,
      [lat, lng, lat, lat, lng, lat, radiusMeters]
    ) as any[];

    // Also get nearby active incidents as alerts if they're not already in alerts table
    const [incidents] = await pool.query(
      `SELECT i.id, i.incident_type, i.description, i.latitude, i.longitude, i.severity, i.location_description,
       (
         6371000 * acos(
           cos(radians(?)) * cos(radians(i.latitude)) *
           cos(radians(i.longitude) - radians(?)) +
           sin(radians(?)) * sin(radians(i.latitude))
         )
       ) AS distance
       FROM incidents i
       WHERE i.status = 'active'
         AND (
           6371000 * acos(
             cos(radians(?)) * cos(radians(i.latitude)) *
             cos(radians(i.longitude) - radians(?)) +
             sin(radians(?)) * sin(radians(i.latitude))
           )
         ) < ?
       ORDER BY distance ASC
       LIMIT 20`,
      [lat, lng, lat, lat, lng, lat, radiusMeters]
    ) as any[];

    // Combine alerts and incidents
    const combinedAlerts = [
      ...alerts.map((alert: any) => ({
        id: alert.id,
        alertType: alert.alert_type,
        title: alert.title || `${alert.alert_type.replace(/_/g, ' ')} Alert`,
        message: alert.message,
        latitude: parseFloat(alert.latitude),
        longitude: parseFloat(alert.longitude),
        distance: Math.round(alert.distance),
        severity: alert.severity,
        isRead: alert.is_read,
        createdAt: alert.created_at,
        incidentId: alert.incident_id,
      })),
      ...incidents.map((incident: any) => ({
        id: `incident-${incident.id}`,
        alertType: 'incident',
        title: `${incident.incident_type.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())} Nearby`,
        message: incident.description || `${incident.incident_type.replace(/_/g, ' ')} reported`,
        latitude: parseFloat(incident.latitude),
        longitude: parseFloat(incident.longitude),
        distance: Math.round(incident.distance),
        severity: incident.severity || 'medium',
        isRead: false,
        createdAt: new Date().toISOString(),
        incidentId: incident.id,
        locationDescription: incident.location_description,
      })),
    ].sort((a, b) => a.distance - b.distance).slice(0, 50);

    res.json(combinedAlerts);
  } catch (err) {
    next(err);
  }
});

// Mark alert as read
router.put('/:id/read', authenticate, async (req: AuthRequest, res, next) => {
  try {
    await pool.query(
      'UPDATE alerts SET is_read = TRUE, read_at = NOW() WHERE id = ? AND user_id = ?',
      [req.params.id, req.user!.id]
    );

    res.json({ message: 'Alert marked as read' });
  } catch (err) {
    next(err);
  }
});

export default router;

