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
        summary: `[PocketWatch] Shift: ${worker.position || 'Work'}`,
        description: (schedule.notes || '') + '\n\n[PocketWatch]',
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

  static async getEventsFromGoogleCalendar(workerId: string, timeRange: { start: string; end: string }) {
    const supabase = createClient();

    // 1. Get tokens
    const { data: connection } = await supabase
      .from('connected_accounts')
      .select('*')
      .eq('worker_id', workerId)
      .eq('provider', 'google')
      .single();

    if (!connection) {
      // It's possible the worker hasn't connected Google Calendar yet
      return [];
    }

    // 2. Set credentials (and refresh if needed)
    this.oauth2Client.setCredentials({
      access_token: connection.access_token,
      refresh_token: connection.refresh_token,
      expiry_date: connection.expires_at,
    });

    const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

    try {
      const response = await calendar.events.list({
        calendarId: 'primary',
        timeMin: timeRange.start, // ISO string
        timeMax: timeRange.end,   // ISO string
        singleEvents: true,
        orderBy: 'startTime',
      });

      return response.data.items || [];
    } catch (error) {
      console.error('Error fetching Google Calendar events:', error);
      return [];
    }
  }

  static async syncGoogleEventsToPocketWatch(companyId: string, workerId: string, timeRange: { start: string; end: string }) {
    const events = await this.getEventsFromGoogleCalendar(workerId, timeRange);
    if (!events || !events.length) return { added: 0, updated: 0, failed: 0 };

    const supabase = createClient();
    let added = 0;
    let updated = 0;
    let failed = 0;

    for (const event of events) {
      if (!event.start?.dateTime || !event.end?.dateTime) continue;

      // Skip events created by PocketWatch to avoid loops
      if (event.description?.includes('[PocketWatch]') || event.summary?.includes('[PocketWatch]')) {
        continue;
      }

      const startDate = event.start.dateTime.split('T')[0];
      const startTime = event.start.dateTime.split('T')[1].substring(0, 5);
      const endTime = event.end.dateTime.split('T')[1].substring(0, 5);

      // Check if this event already exists in our DB (by google_event_id)
      const { data: existingSchedule } = await supabase
        .from('schedules')
        .select('id')
        .eq('google_event_id', event.id)
        .single();

      try {
        if (existingSchedule) {
          // Update existing schedule
          await supabase
            .from('schedules')
            .update({
              start_time: startTime,
              end_time: endTime,
              notes: event.description || event.summary || '',
            })
            .eq('google_event_id', event.id);
          updated++;
        } else {
          // Insert new schedule
          await supabase
            .from('schedules')
            .insert({
              company_id: companyId,
              worker_id: workerId,
              date: startDate,
              start_time: startTime,
              end_time: endTime,
              notes: `[Google Calendar] ${event.summary || ''}\n${event.description || ''}`.trim(),
              google_event_id: event.id,
            });
          added++;
        }
      } catch (err) {
        console.error('Failed to sync event:', err);
        failed++;
      }
    }

    return { added, updated, failed };
  }
}
