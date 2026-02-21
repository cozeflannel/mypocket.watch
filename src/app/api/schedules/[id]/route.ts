import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext, isAuthError } from '@/lib/auth-helpers';
import { GoogleCalendarService } from '@/lib/google/calendar';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;
  const { id } = await params;

  const { data, error } = await ctx.supabase
    .from('schedules')
    .select('*, worker:workers(id, first_name, last_name, color, position)')
    .eq('id', id)
    .eq('company_id', ctx.company.id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
  }

  // Also fetch modification history
  const { data: modifications } = await ctx.supabase
    .from('schedule_modifications')
    .select('*')
    .eq('schedule_id', id)
    .order('created_at', { ascending: false });

  return NextResponse.json({ ...data, modifications: modifications || [] });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;
  const { id } = await params;
  const body = await request.json();

  // Fetch original schedule first (for audit trail)
  const { data: original } = await ctx.supabase
    .from('schedules')
    .select('*, worker:workers(id, first_name, last_name, color, position)')
    .eq('id', id)
    .eq('company_id', ctx.company.id)
    .single();

  if (!original) {
    return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
  }

  const allowedFields = ['worker_id', 'date', 'start_time', 'end_time', 'break_minutes', 'notes'];
  const updates: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (field in body) updates[field] = body[field];
  }

  const { data, error } = await ctx.supabase
    .from('schedules')
    .update(updates)
    .eq('id', id)
    .eq('company_id', ctx.company.id)
    .select('*, worker:workers(id, first_name, last_name, color, position)')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Record modification for audit trail
  const hasTimeChange =
    (body.start_time && body.start_time !== original.start_time) ||
    (body.end_time && body.end_time !== original.end_time) ||
    (body.date && body.date !== original.date);

  if (hasTimeChange) {
    let googleSynced = false;

    // Sync to Google Calendar
    const gcalResult = await GoogleCalendarService.syncSchedule(data, data.worker, 'update');
    if (gcalResult?.google_event_id) {
      googleSynced = true;
      await ctx.supabase
        .from('schedules')
        .update({ google_event_id: gcalResult.google_event_id })
        .eq('id', id);
    }

    await ctx.supabase.from('schedule_modifications').insert({
      company_id: ctx.company.id,
      schedule_id: id,
      modified_by_admin: ctx.adminUser.id,
      original_start_time: original.start_time,
      original_end_time: original.end_time,
      new_start_time: body.start_time || original.start_time,
      new_end_time: body.end_time || original.end_time,
      original_date: original.date,
      new_date: body.date || original.date,
      reason: body.reason || null,
      google_synced: googleSynced,
    });
  } else {
    // Still sync non-time changes to GCal
    await GoogleCalendarService.syncSchedule(data, data.worker, 'update');
  }

  return NextResponse.json(data);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;
  const { id } = await params;

  const { data: schedule } = await ctx.supabase
    .from('schedules')
    .select('*, worker:workers(id, first_name, last_name, color, position)')
    .eq('id', id)
    .eq('company_id', ctx.company.id)
    .single();

  if (!schedule) {
    return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
  }

  // Delete from Google Calendar
  await GoogleCalendarService.syncSchedule(schedule, schedule.worker, 'delete');

  const { error } = await ctx.supabase
    .from('schedules')
    .delete()
    .eq('id', id)
    .eq('company_id', ctx.company.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
