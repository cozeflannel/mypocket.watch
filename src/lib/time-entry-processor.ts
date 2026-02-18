import { createClient as createAdminClient } from '@supabase/supabase-js';
import type { Worker, TimeEntry } from '@/types/database';
import { v4 as uuidv4 } from 'uuid';
import { addMinutes } from 'date-fns';

function getSupabaseAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export type TimeCommand = 'clock_in' | 'clock_out' | 'lunch' | 'help';

export interface ProcessResult {
  success: boolean;
  message: string;
  warning?: string;
}

export function parseCommand(text: string): TimeCommand | null {
  const cleaned = text.trim().toUpperCase();
  
  // Clock In Patterns
  if (
    /^1$/.test(cleaned) ||
    /^(CLOCK\s*IN|IN|START|HERE|ARRIVED|ON\s*SITE|BEGIN)$/.test(cleaned)
  ) return 'clock_in';

  // Clock Out Patterns
  if (
    /^2$/.test(cleaned) ||
    /^(CLOCK\s*OUT|OUT|STOP|LEAVE|DONE|FINISHED|END)$/.test(cleaned)
  ) return 'clock_out';

  // Lunch Patterns
  if (
    /^3$/.test(cleaned) ||
    /^(LUNCH|BREAK|FOOD|EATING|MEAL)$/.test(cleaned)
  ) return 'lunch';

  // Help
  if (/^(HELP|\?|INFO)$/.test(cleaned)) return 'help';

  return null;
}

// ... (getHelpText and getWorkerBy... functions remain same, omitting for brevity in this replace) ...
// Wait, I need to include them or I overwrite the file. I will include them.

export function getHelpText(workerName: string): string {
  return `Hi ${workerName}! Here's how to track your time:\n\n` +
    `📲 Clock In: Text "1", "In", "Here"\n` +
    `📲 Clock Out: Text "2", "Out", "Done"\n` +
    `📲 Lunch Break: Text "3", "Lunch"\n` +
    `📲 Help: Text "HELP"\n\n` +
    `That's it! I'll confirm each entry.`;
}

export async function getWorkerByPhone(phone: string): Promise<Worker | null> {
  const supabase = getSupabaseAdmin();
  const normalizedPhone = phone.replace(/\s+/g, '').replace(/^whatsapp:/, '');
  
  const { data } = await supabase
    .from('workers')
    .select('*')
    .or(`phone.eq.${normalizedPhone},whatsapp_id.eq.${normalizedPhone}`)
    .eq('is_active', true)
    .single();

  return data as Worker | null;
}

export async function getWorkerByTelegramId(telegramId: string): Promise<Worker | null> {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from('workers')
    .select('*')
    .eq('telegram_id', telegramId)
    .eq('is_active', true)
    .single();

  return data as Worker | null;
}

export async function getWorkerByMessengerId(messengerId: string): Promise<Worker | null> {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from('workers')
    .select('*')
    .eq('messenger_id', messengerId)
    .eq('is_active', true)
    .single();

  return data as Worker | null;
}

async function getTodayEntry(workerId: string, companyId: string): Promise<TimeEntry | null> {
  const supabase = getSupabaseAdmin();
  const today = new Date().toISOString().split('T')[0];
  
  const { data } = await supabase
    .from('time_entries')
    .select('*')
    .eq('worker_id', workerId)
    .eq('company_id', companyId)
    .gte('clock_in', `${today}T00:00:00Z`)
    .lt('clock_in', `${today}T23:59:59Z`)
    .is('is_correction', false)
    .order('clock_in', { ascending: false })
    .limit(1)
    .single();

  return data as TimeEntry | null;
}

export async function processTimeCommand(
  worker: Worker,
  command: TimeCommand,
  source: 'sms' | 'whatsapp' | 'telegram' | 'messenger',
  bypassGeofence = false
): Promise<ProcessResult> {
  if (command === 'help') {
    return { success: true, message: getHelpText(worker.first_name) };
  }

  const supabase = getSupabaseAdmin();
  const now = new Date().toISOString();
  const todayEntry = await getTodayEntry(worker.id, worker.company_id);

  switch (command) {
    case 'clock_in': {
      if (todayEntry && !todayEntry.clock_out) {
        return {
          success: false,
          message: `Hey ${worker.first_name}, you're already clocked in! Text "2" to clock out or "3" for lunch break.`,
        };
      }

      // Check Geofence Requirement
      if (!bypassGeofence) {
        const { data: company } = await supabase
          .from('companies')
          .select('job_site_lat, job_site_lng')
          .eq('id', worker.company_id)
          .single();

        if (company?.job_site_lat && company?.job_site_lng) {
          // Generate Verification Link
          const token = uuidv4();
          await supabase.from('location_verifications').insert({
            token,
            worker_id: worker.id,
            company_id: worker.company_id,
            platform: source,
            message_source: 'command_trigger', // Simplified, could pass actual source
            status: 'pending',
            expires_at: addMinutes(new Date(), 10).toISOString(),
          });

          const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify/${token}`;
          return {
            success: true,
            message: `📍 Location Check Required.\n\nPlease tap this link to verify you are on site:\n${verifyUrl}\n\nOnce verified, you will be clocked in automatically.`,
          };
        }
      }

      const { error } = await supabase.from('time_entries').insert({
        company_id: worker.company_id,
        worker_id: worker.id,
        clock_in: now,
        source,
        entry_type: 'regular',
      });

      if (error) {
        return { success: false, message: 'Sorry, something went wrong. Please try again.' };
      }

      const time = new Date().toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
      return {
        success: true,
        message: `🟢 Clocked in at ${time}! Have a great shift, ${worker.first_name}!`,
      };
    }

    case 'clock_out': {
      if (!todayEntry || todayEntry.clock_out) {
        return {
          success: false,
          message: `Hey ${worker.first_name}, you haven't clocked in today. Text "1" to clock in.`,
        };
      }

      // Logic for lunch return on clock out?
      // Simplified: If lunch_out exists but no lunch_in, we close lunch first? 
      // Or we just end the shift. Let's assume standard behavior:
      
      const { error } = await supabase
        .from('time_entries')
        .update({ clock_out: now })
        .eq('id', todayEntry.id);

      if (error) {
        return { success: false, message: 'Sorry, something went wrong. Please try again.' };
      }

      // Calculate total duration roughly for the message
      const clockIn = new Date(todayEntry.clock_in);
      const clockOut = new Date(now);
      const diffMs = clockOut.getTime() - clockIn.getTime();
      const hours = Math.floor(diffMs / 3600000);
      const mins = Math.round((diffMs % 3600000) / 60000);

      const time = clockOut.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });

      return {
        success: true,
        message: `🔴 Clocked out at ${time}. Total today: ${hours}h ${mins}m. Nice work, ${worker.first_name}!`,
      };
    }

    case 'lunch': {
      if (!todayEntry || todayEntry.clock_out) {
        return {
          success: false,
          message: `Hey ${worker.first_name}, you need to clock in first. Text "1" to clock in.`,
        };
      }

      if (todayEntry.lunch_out && !todayEntry.lunch_in) {
        // Returning from lunch
        await supabase
          .from('time_entries')
          .update({ lunch_in: now })
          .eq('id', todayEntry.id);

        const lunchMins = Math.round((new Date(now).getTime() - new Date(todayEntry.lunch_out).getTime()) / 60000);

        return {
          success: true,
          message: `🍽️ Welcome back, ${worker.first_name}! Lunch break: ${lunchMins} minutes.`,
        };
      }

      if (todayEntry.lunch_out && todayEntry.lunch_in) {
        return {
          success: false,
          message: `You've already taken your lunch break today, ${worker.first_name}.`,
        };
      }

      // Starting lunch
      await supabase
        .from('time_entries')
        .update({ lunch_out: now })
        .eq('id', todayEntry.id);

      return {
        success: true,
        message: `🍽️ Lunch break started! Text "3" (or "Lunch") again when you're back, ${worker.first_name}.`,
      };
    }

    default:
      return { success: false, message: 'Unknown command. Text "HELP" for instructions.' };
  }
}
