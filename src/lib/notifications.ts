import { createClient as createAdminClient } from '@supabase/supabase-js';

function getSupabaseAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function createNotification(params: {
  companyId: string;
  type: 'no_show' | 'missing_punch' | 'overtime_alert' | 'schedule_change' | 'payroll_ready' | 'general';
  title: string;
  message: string;
  workerId?: string | null;
  adminUserId?: string | null;
  relatedDate?: string | null;
}) {
  const supabase = getSupabaseAdmin();
  await supabase.from('notifications').insert({
    company_id: params.companyId,
    type: params.type,
    title: params.title,
    message: params.message,
    worker_id: params.workerId || null,
    admin_user_id: params.adminUserId || null,
    related_date: params.relatedDate || null,
  });
}

export async function detectNoShows(companyId: string, date: string) {
  const supabase = getSupabaseAdmin();
  
  const { data: schedules } = await supabase
    .from('schedules')
    .select('*, worker:workers(id, first_name, last_name, color)')
    .eq('company_id', companyId)
    .eq('date', date);

  if (!schedules?.length) return [];

  const { data: todayEntries } = await supabase
    .from('time_entries')
    .select('worker_id')
    .eq('company_id', companyId)
    .gte('clock_in', `${date}T00:00:00`)
    .lt('clock_in', `${date}T23:59:59`);

  const clockedInWorkerIds = new Set((todayEntries || []).map((e) => e.worker_id));
  const now = new Date();

  return schedules.filter((s) => {
    if (clockedInWorkerIds.has(s.worker_id)) return false;
    const [hours, minutes] = s.start_time.split(':').map(Number);
    const shiftStart = new Date(`${date}T${s.start_time}`);
    shiftStart.setHours(hours, minutes, 0, 0);
    const minutesLate = (now.getTime() - shiftStart.getTime()) / 60000;
    return minutesLate > 15;
  });
}

export async function detectMissingPunches(companyId: string, date: string) {
  const supabase = getSupabaseAdmin();

  const { data: entries } = await supabase
    .from('time_entries')
    .select('*, worker:workers(id, first_name, last_name, color)')
    .eq('company_id', companyId)
    .gte('clock_in', `${date}T00:00:00`)
    .lt('clock_in', `${date}T23:59:59`)
    .order('clock_in', { ascending: true });

  if (!entries?.length) return [];

  const issues: Array<{
    entry: typeof entries[0];
    issueType: string;
    lastTimestamp: string;
  }> = [];

  for (const entry of entries) {
    if (entry.clock_in && !entry.clock_out) {
      const clockInTime = new Date(entry.clock_in);
      const hoursElapsed = (Date.now() - clockInTime.getTime()) / 3600000;
      if (hoursElapsed > 12) {
        issues.push({
          entry,
          issueType: 'Missing clock out',
          lastTimestamp: entry.lunch_in || entry.lunch_out || entry.clock_in,
        });
      }
    }
    if (entry.lunch_out && !entry.lunch_in && !entry.clock_out) {
      const lunchOutTime = new Date(entry.lunch_out);
      const hoursOnLunch = (Date.now() - lunchOutTime.getTime()) / 3600000;
      if (hoursOnLunch > 2) {
        issues.push({
          entry,
          issueType: 'Missing lunch return',
          lastTimestamp: entry.lunch_out,
        });
      }
    }
  }

  return issues;
}
