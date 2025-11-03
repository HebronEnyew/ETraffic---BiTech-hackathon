import express from 'express';
import pool from '../db/connection';
import { authenticate, AuthRequest } from '../middleware/auth';
import { getGoogleCalendarEvents, getCalendarClient } from '../services/googleCalendar';

const router = express.Router();

/**
 * GET /api/calendar/google-events
 * Fetch Google Calendar events for Ethiopian holidays and traffic events
 */
router.get('/google-events', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { startDate, endDate, calendarId } = req.query;
    
    // Default to current month if no dates provided
    const start = startDate 
      ? new Date(startDate as string) 
      : new Date();
    const end = endDate 
      ? new Date(endDate as string) 
      : new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from start

    // Get Google Calendar events
    const calendarIdToUse = (calendarId as string) || process.env.GOOGLE_CALENDAR_ID || 'primary';
    const googleEvents = await getGoogleCalendarEvents(calendarIdToUse, start, end);

    // If no Google Calendar client initialized, return mock data as fallback
    if (googleEvents.length === 0 && !getCalendarClient()) {
      const mockEvents = [
        {
          id: 'mock_event_1',
          summary: 'Meskel Festival',
          description: 'Ethiopian Orthodox celebration - Expect traffic around Meskel Square\nAffected Roads: Meskel Square, Adwa Avenue, Ras Abebe Aregay Street',
          start: start.toISOString(),
          end: end.toISOString(),
          location: 'Meskel Square, Addis Ababa',
          colorId: '11',
          affectedRoads: ['Meskel Square', 'Adwa Avenue', 'Ras Abebe Aregay Street'],
          trafficImpact: 'high',
          isHoliday: true,
        },
      ];

      res.json({
        events: mockEvents,
        message: 'Mock Google Calendar events (Google Calendar API not configured)',
      });
      return;
    }

    res.json({
      events: googleEvents,
      count: googleEvents.length,
      message: 'Google Calendar events fetched successfully',
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/calendar/events-with-closures
 * Get events from database and Google Calendar with road closure information
 */
router.get('/events-with-closures', async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Fetch events from database
    const start = startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const end = endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const [events] = await pool.query(
      `SELECT 
        e.*,
        GROUP_CONCAT(DISTINCT rc.road_name) as affected_roads
       FROM events e
       LEFT JOIN road_closures rc ON e.id = rc.event_id
       WHERE e.event_date BETWEEN ? AND ?
       GROUP BY e.id
       ORDER BY e.event_date ASC`,
      [start, end]
    ) as any[];

    // Format database events
    const dbEvents = events.map((event: any) => ({
      id: `db_${event.id}`,
      name: event.event_name,
      summary: event.event_name,
      description: event.description,
      date: event.event_date,
      start: event.event_date,
      end: event.event_date,
      type: event.event_type,
      affectedRoads: event.affected_roads ? event.affected_roads.split(',') : [],
      trafficImpact: event.traffic_impact || 'medium',
      isHoliday: event.is_holiday || false,
      source: 'database',
    }));

    // Fetch Google Calendar events
    const startDateObj = new Date(start);
    const endDateObj = new Date(end);
    const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';
    const googleEvents = await getGoogleCalendarEvents(calendarId, startDateObj, endDateObj);

    // Format Google Calendar events
    const formattedGoogleEvents = googleEvents.map((event: any) => ({
      id: `google_${event.id}`,
      name: event.summary,
      summary: event.summary,
      description: event.description,
      date: event.start ? new Date(event.start).toISOString().split('T')[0] : null,
      start: event.start,
      end: event.end,
      type: event.isHoliday ? 'holiday' : 'event',
      affectedRoads: event.affectedRoads || [],
      trafficImpact: event.trafficImpact || 'medium',
      isHoliday: event.isHoliday || false,
      location: event.location || '',
      source: 'google',
    }));

    // Combine and sort events
    const allEvents = [...dbEvents, ...formattedGoogleEvents].sort((a, b) => {
      const dateA = new Date(a.start || a.date || 0).getTime();
      const dateB = new Date(b.start || b.date || 0).getTime();
      return dateA - dateB;
    });

    res.json({
      events: allEvents,
      count: allEvents.length,
      dbCount: dbEvents.length,
      googleCount: formattedGoogleEvents.length,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
