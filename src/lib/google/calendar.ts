import { google } from 'googleapis';
import { createClient } from '@/lib/supabase/server';
import type { Schedule, Worker } from '@/types/database';

export class GoogleCalendarService {
  private static getOAuth2Client() {
    return new google.auth.OAuth2(
      process.env.GOOGLE_CALENDAR_CLIENT_ID,
      process.env.GOOGLE_CALENDAR_CLIENT_SECRET,
      `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`
    );
  }

  static async syncSchedule(
    schedule: Schedule & { worker?: Pick<Worker, 'id' | 'first_name' | 'last_name' | 'color' | 'position'> },
    worker: Pick<Worker, 'id' | 'first_name' | 'last_name' | 'color' | 'position'>,
    eventAction: 'create' | 'update' | 'delete'
  ) {
    try {
      const supabase = await createClient();

      // Get worker's connected Google account
      const { data: connection } = await supabase
        .from('connected_accounts')
        .select('*')
        .eq('worker_id', worker.id)
        .eq('provider', 'google')
        .single();

      if (!connection) return null;

      const oauth2Client = this.getOAuth2Client();
      oauth2Client.setCredentials({
        access_token: connection.access_token,
        refresh_token: connection.refresh_token,
        expiry_date: connection.expires_at,
      });

      // Handle token refresh
      oauth2Client.on('tokens', async (tokens) => {
        const updates: Record<string, unknown> = {};
        if (tokens.access_token) updates.access_token = tokens.access_token;
        if (tokens.expiry_date) updates.expires_at = tokens.expiry_date;
        if (tokens.refresh_token) updates.refresh_token = tokens.refresh_token;

        await supabase
          .from('connected_accounts')
          .update(updates)
          .eq('id', connection.id);
      });

      const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

      if (eventAction === 'delete' && schedule.google_event_id) {
        await calendar.events.delete({
          calendarId: 'primary',
          eventId: schedule.google_event_id,
        });
        return { google_event_id: null };
      }

      const eventBody = {
        summary: `Shift: ${worker.position || 'Work'} — ${worker.first_name} ${worker.last_name}`,
        description: schedule.notes || `Scheduled shift for ${worker.first_name} ${worker.last_name}`,
        start: {
          dateTime: `${schedule.date}T${schedule.start_time}:00`,
          timeZone: 'America/New_York',
        },
        end: {
          dateTime: `${schedule.date}T${schedule.end_time}:00`,
          timeZone: 'America/New_York',
        },
        reminders: {
          useDefault: false,
          overrides: [{ method: 'popup', minutes: 30 }],
        },
        colorId: '9', // Blueberry
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
      return null;
    }
  }
}
