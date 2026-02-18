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

  return NextResponse.json(data);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;
  const { id } = await params;
  const body = await request.json();

  const allowedFields = [
    'worker_id',
    'date',
    'start_time',
    'end_time',
    'break_minutes',
    'notes',
  ];
  const updates: Record<string, unknown> = {};

  for (const field of allowedFields) {
    if (field in body) {
      updates[field] = body[field];
    }
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

  // Google Calendar Sync
  await GoogleCalendarService.syncSchedule(data, data.worker, 'update');

  return NextResponse.json(data);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;
  const { id } = await params;

  // 1. Fetch first (need Google Event ID & Worker ID)
  const { data: schedule } = await ctx.supabase
    .from('schedules')
    .select('*, worker:workers(id, first_name, last_name, color, position)')
    .eq('id', id)
    .eq('company_id', ctx.company.id)
    .single();

  if (!schedule) {
    return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
  }

  // 2. Delete from Google
  await GoogleCalendarService.syncSchedule(schedule, schedule.worker, 'delete');

  // 3. Delete from Supabase
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
