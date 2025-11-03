import { google } from 'googleapis';
import path from 'path';
import fs from 'fs';

let calendarClient: any = null;

/**
 * Initialize Google Calendar client with service account credentials
 */
export function initializeGoogleCalendar() {
  try {
    // Path to your Google API credentials JSON file
    const credentialsPath = process.env.GOOGLE_CREDENTIALS_PATH || path.join(__dirname, '../../credentials/google-credentials.json');
    
    // Check if credentials file exists
    if (!fs.existsSync(credentialsPath)) {
      console.warn(`⚠️  Google credentials file not found at: ${credentialsPath}`);
      console.warn('Google Calendar integration will use mock data.');
      return null;
    }

    // Read and parse credentials
    const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));

    // Authenticate using service account
    const auth = new google.auth.GoogleAuth({
      credentials: credentials,
      scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
    });

    // Create Calendar API client
    calendarClient = google.calendar({ version: 'v3', auth });

    console.log('✅ Google Calendar API initialized successfully');
    return calendarClient;
  } catch (error: any) {
    console.error('❌ Error initializing Google Calendar API:', error.message);
    console.warn('Google Calendar integration will use mock data.');
    return null;
  }
}

/**
 * Get Google Calendar events within a date range
 */
export async function getGoogleCalendarEvents(
  calendarId: string,
  startDate: Date,
  endDate: Date
): Promise<any[]> {
  if (!calendarClient) {
    // Return empty array if client not initialized
    return [];
  }

  try {
    const response = await calendarClient.events.list({
      calendarId: calendarId || 'primary',
      timeMin: startDate.toISOString(),
      timeMax: endDate.toISOString(),
      maxResults: 100,
      singleEvents: true,
      orderBy: 'startTime',
    });

    const events = response.data.items || [];

    // Transform Google Calendar events to our format
    return events.map((event: any) => {
      // Extract affected roads from event description or location
      const affectedRoads: string[] = [];
      
      // Check description for road names (common patterns)
      if (event.description) {
        const roadMatches = event.description.match(/road[s]?|street[s]?|avenue[s]?|square|boulevard[s]?/gi);
        if (roadMatches) {
          // Extract road names from description
          const lines = event.description.split('\n');
          lines.forEach((line: string) => {
            if (line.toLowerCase().includes('road') || 
                line.toLowerCase().includes('street') ||
                line.toLowerCase().includes('avenue') ||
                line.toLowerCase().includes('square')) {
              const roadName = line.trim();
              if (roadName && !affectedRoads.includes(roadName)) {
                affectedRoads.push(roadName);
              }
            }
          });
        }
      }

      // Check location field
      if (event.location) {
        const locationParts = event.location.split(',').map((p: string) => p.trim());
        locationParts.forEach((part: string) => {
          if (part && !affectedRoads.includes(part)) {
            affectedRoads.push(part);
          }
        });
      }

      // Determine traffic impact from event summary/description
      let trafficImpact = 'medium';
      const summary = (event.summary || '').toLowerCase();
      const description = (event.description || '').toLowerCase();
      
      if (summary.includes('holiday') || summary.includes('festival') || 
          summary.includes('event') || summary.includes('celebration')) {
        trafficImpact = 'high';
      }
      if (description.includes('traffic') || description.includes('closure') || 
          description.includes('jam')) {
        trafficImpact = 'high';
      }

      return {
        id: event.id,
        summary: event.summary || 'Untitled Event',
        description: event.description || '',
        start: event.start?.dateTime || event.start?.date || null,
        end: event.end?.dateTime || event.end?.date || null,
        location: event.location || '',
        colorId: event.colorId || '11',
        affectedRoads: affectedRoads.length > 0 ? affectedRoads : [],
        trafficImpact: trafficImpact,
        isHoliday: summary.includes('holiday') || summary.includes('festival'),
      };
    });
  } catch (error: any) {
    console.error('Error fetching Google Calendar events:', error.message);
    return [];
  }
}

/**
 * Get the initialized calendar client (or null if not initialized)
 */
export function getCalendarClient() {
  return calendarClient;
}

// Initialize on module load
initializeGoogleCalendar();

