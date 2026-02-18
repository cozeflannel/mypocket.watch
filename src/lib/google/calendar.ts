import { google } from 'googleapis';
import { createClient } from '@/lib/supabase/client';
import { Schedule, Worker } from '@/types/database';

export class GoogleCalendarService {
  private static readonly oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CALENDAR_CLIENT_ID,
    process.env.GOOGLE_CALENDAR_CLIENT_SECRET,
    `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`
  );

  static async syncSchedule(schedule: Schedule, worker: Worker, eventAction: 'create' | 'update' | 'delete') {
    const supabase = createClient();
    
    // 1. Get tokens
    const { data: connection } = await supabase
      .from('connected_accounts')
      .select('*')
      .eq('worker_id', worker.id)
      .eq('provider', 'google')
      .single();

    if (!connection) return null;

    // 2. Set credentials (and refresh if needed)
    this.oauth2Client.setCredentials({
      access_token: connection.access_token,
      refresh_token: connection.refresh_token,
      expiry_date: connection.expires_at,
    });

    const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

    // 3. Execute Action
    try {
      if (eventAction === 'delete' && schedule.google_event_id) {
        await calendar.events.delete({
          calendarId: 'primary',
          eventId: schedule.google_event_id,
        });
        return { google_event_id: null };
      }

      const eventBody = {
        summary: `Shift: ${worker.position || 'Work'}`,
        description: schedule.notes || '',
        start: {
          dateTime: `${schedule.date}T${schedule.start_time}:00`,
          timeZone: connection.timezone || 'UTC', // Default to UTC if not set
        },
        end: {
          dateTime: `${schedule.date}T${schedule.end_time}:00`,
          timeZone: connection.timezone || 'UTC',
        },
        reminders: {
          useDefault: false,
          overrides: [{ method: 'popup', minutes: 30 }],
        },
      };

      let result;
      if (eventAction === 'create') {
        result = await calendar.events.insert({
          calendarId: 'primary',
          requestBody: eventBody,
        });
      } else if (eventAction === 'update' && schedule.google_event_id) {
        result = await calendar.events.update({
          calendarId: 'primary',
          eventId: schedule.google_event_id,
          requestBody: eventBody,
        });
      }

      return { google_event_id: result?.data.id };
    } catch (error) {
      console.error('Google Calendar Sync Error:', error);
      // Don't throw - we don't want to break the app flow if Google is down
      return null;
    }
  }
}
