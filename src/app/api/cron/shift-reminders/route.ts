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
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get('x-cron-secret');
    if (authHeader !== cronSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const supabase = getSupabaseAdmin();
  const now = new Date();
  const today = now.toISOString().split('T')[0];

  // Build HH:MM time strings for the current window (now → now+5min)
  const pad = (n: number) => String(n).padStart(2, '0');
  const nowHHMM = `${pad(now.getUTCHours())}:${pad(now.getUTCMinutes())}`;
  const future = new Date(now.getTime() + 5 * 60 * 1000);
  const futureHHMM = `${pad(future.getUTCHours())}:${pad(future.getUTCMinutes())}`;

  const { data: schedules, error: scheduleError } = await supabase
    .from('schedules')
    .select('*, worker:workers(*)')
    .eq('date', today)
    .gte('start_time', nowHHMM)
    .lte('start_time', futureHHMM);

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

    // Skip if already reminded today for this schedule
    const { data: existingLog } = await supabase
      .from('message_logs')
      .select('id')
      .eq('worker_id', worker.id)
      .eq('message_type', 'shift_reminder')
      .gte('created_at', `${today}T00:00:00Z`)
      .maybeSingle();

    if (existingLog) continue;

    // Format start time for display (start_time is "HH:MM")
    const [hours, minutes] = schedule.start_time.split(':').map(Number);
    const displayDate = new Date();
    displayDate.setUTCHours(hours, minutes, 0, 0);
    const startTimeDisplay = displayDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    const message = `⏰ Hey ${worker.first_name}! Your shift starts at ${startTimeDisplay}. Clock in when you're ready.`;

    try {
      let platform: 'telegram' | 'sms' = 'telegram';
      let sent = false;

      if (worker.telegram_id) {
        sent = await sendTelegram(worker.telegram_id, message, getTelegramKeyboard());
        platform = 'telegram';
      }

      if (!sent && worker.phone && process.env.TWILIO_ACCOUNT_SID) {
        await sendSMS(worker.phone, message + " Reply '1' to clock in.");
        sent = true;
        platform = 'sms';
      }

      if (sent) {
        await logMessage({
          companyId: worker.company_id,
          workerId: worker.id,
          direction: 'outbound',
          platform,
          messageType: 'shift_reminder',
          toAddress: platform === 'telegram' ? (worker.telegram_id ?? '') : (worker.phone ?? ''),
          fromAddress: 'bot',
          body: message,
          status: 'sent',
        });
        remindersSent++;
      }
    } catch (err) {
      console.error(`Failed to send reminder to worker ${worker.id}:`, err);
    }
  }

  return NextResponse.json({ message: 'Done', remindersSent, schedulesChecked: schedules.length });
}
