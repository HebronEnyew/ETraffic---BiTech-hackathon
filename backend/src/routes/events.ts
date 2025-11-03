import express from 'express';
import pool from '../db/connection';

const router = express.Router();

// Get all events
router.get('/', async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    let query = `
      SELECT 
        e.*,
        GROUP_CONCAT(DISTINCT rc.road_name) as affected_roads
      FROM events e
      LEFT JOIN road_closures rc ON e.id = rc.event_id
    `;
    const params: any[] = [];

    if (startDate && endDate) {
      query += ' WHERE e.event_date BETWEEN ? AND ?';
      params.push(startDate, endDate);
    }

    query += ' GROUP BY e.id ORDER BY e.event_date ASC';

    const [events] = await pool.query(query, params) as any[];

    res.json(events.map((event: any) => ({
      id: event.id,
      eventType: event.event_type,
      nameEn: event.name_en,
      nameAm: event.name_am,
      descriptionEn: event.description_en,
      descriptionAm: event.description_am,
      eventDate: event.event_date,
      ethiopianDate: event.ethiopian_date,
      startTime: event.start_time,
      endTime: event.end_time,
      isRecurring: event.is_recurring,
      recurrencePattern: event.recurrence_pattern,
      affectedArea: event.affected_area,
      affectedRoads: event.affected_roads ? event.affected_roads.split(',') : [],
      createdAt: event.created_at,
    })));
  } catch (err) {
    next(err);
  }
});

// Get events for specific date
router.get('/:date', async (req, res, next) => {
  try {
    const { date } = req.params;

    // Get events for date
    const [events] = await pool.query(
      `SELECT e.*
       FROM events e
       WHERE e.event_date = ?`,
      [date]
    ) as any[];

    // Get road closures for events
    const eventIds = events.map((e: any) => e.id);
    let roadClosures: any[] = [];

    if (eventIds.length > 0) {
      const placeholders = eventIds.map(() => '?').join(',');
      const [closures] = await pool.query(
        `SELECT * FROM road_closures
         WHERE event_id IN (${placeholders})
         AND closure_start <= ?
         AND closure_end >= ?`,
        [...eventIds, `${date} 23:59:59`, `${date} 00:00:00`]
      ) as any[];
      roadClosures = closures;
    }

    res.json({
      events: events.map((event: any) => ({
        id: event.id,
        eventType: event.event_type,
        nameEn: event.name_en,
        nameAm: event.name_am,
        descriptionEn: event.description_en,
        descriptionAm: event.description_am,
        eventDate: event.event_date,
        ethiopianDate: event.ethiopian_date,
        affectedArea: event.affected_area,
      })),
      roadClosures: roadClosures.map((closure: any) => ({
        id: closure.id,
        eventId: closure.event_id,
        roadName: closure.road_name,
        startLatitude: parseFloat(closure.start_latitude),
        startLongitude: parseFloat(closure.start_longitude),
        endLatitude: parseFloat(closure.end_latitude),
        endLongitude: parseFloat(closure.end_longitude),
        closureStart: closure.closure_start,
        closureEnd: closure.closure_end,
        alternateRouteDescription: closure.alternate_route_description,
        severity: closure.severity,
      })),
    });
  } catch (err) {
    next(err);
  }
});

export default router;

