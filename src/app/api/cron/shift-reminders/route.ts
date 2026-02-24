import { NextRequest, NextResponse } from 'next/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { sendTelegram, sendSMS, getTelegramKeyboard, logMessage } from '@/lib/messaging';

function getSupabaseAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(request: NextRequest) {
  // Auth: Check for cron secret if set
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get('x-cron-secret');
    if (authHeader !== cronSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const supabase = getSupabaseAdmin();
  const now = new Date();
  const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

  // Get today's date in UTC
  const today = now.toISOString().split('T')[0];

  // Find schedules starting within the next 5 minutes
  const { data: schedules, error: scheduleError } = await supabase
    .from('schedules')
    .select('*, worker:workers(*)')
    .eq('date', today)
    .gte('start_time', now.toISOString())
    .lte('start_time', fiveMinutesFromNow.toISOString());

  if (scheduleError) {
    console.error('Error fetching schedules:', scheduleError);
    return NextResponse.json({ error: scheduleError.message }, { status: 500 });
  }

  if (!schedules || schedules.length === 0) {
    return NextResponse.json({ message: 'No upcoming shifts', count: 0 });
  }

  let remindersSent = 0;

  for (const schedule of schedules) {
    if (!schedule.worker) continue;

    const worker = schedule.worker;

    // Check if we already sent a reminder today for this worker
    const { data: existingLog } = await supabase
      .from('message_logs')
      .select('id')
      .eq('worker_id', worker.id)
      .eq('message_type', 'shift_reminder')
      .gte('created_at', `${today}T00:00:00Z`)
      .single();

    if (existingLog) {
      // Already reminded this worker today
      continue;
    }

    // Format start time for display
    const startTime = new Date(schedule.start_time).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    const message = `⏰ Hey ${worker.first_name}! Your shift starts at ${startTime}. Clock in when you're ready — tap Clock In below.`;

    try {
      let success = false;
      let platform: 'telegram' | 'sms' = 'telegram';

      // Send via worker's preferred channel
      const preferred = worker.preferred_communication || 'telegram';

      if ((preferred === 'telegram' || preferred === 'sms') && worker.telegram_id) {
        // Try Telegram first
        success = await sendTelegram(worker.telegram_id, message, getTelegramKeyboard());
        platform = 'telegram';
      }

      // Fallback to SMS if Telegram fails or no Telegram ID
      if (!success && worker.phone) {
        const smsMessage = message + " Reply '1' to clock in.";
        await sendSMS(worker.phone, smsMessage);
        success = true;
        platform = 'sms';
      }

      if (success) {
        // Log the message
        await logMessage({
          companyId: worker.company_id,
          workerId: worker.id,
          direction: 'outbound',
          platform,
          messageType: 'shift_reminder',
          toAddress: platform === 'telegram' ? worker.telegram_id : worker.phone,
          fromAddress: platform === 'telegram' ? 'MyPocketWatchbot' : process.env.TWILIO_PHONE_NUMBER || '',
          body: message,
          status: 'sent',
        });

        remindersSent++;
      }
    } catch (error) {
      console.error(`Failed to send reminder to worker ${worker.id}:`, error);
    }
  }

  return NextResponse.json({
    message: 'Shift reminders processed',
    count: remindersSent,
    schedules: schedules.length,
  });
}
