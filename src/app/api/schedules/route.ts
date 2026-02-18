import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext, isAuthError } from '@/lib/auth-helpers';

export async function GET(request: NextRequest) {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;

  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get('start');
  const endDate = searchParams.get('end');
  const workerId = searchParams.get('worker_id');

  let query = ctx.supabase
    .from('schedules')
    .select('*, worker:workers(id, first_name, last_name, color, position)')
    .eq('company_id', ctx.company.id)
    .order('date')
    .order('start_time');

  if (startDate) query = query.gte('date', startDate);
  if (endDate) query = query.lte('date', endDate);
  if (workerId) query = query.eq('worker_id', workerId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;

  const body = await request.json();
  const { worker_id, date, start_time, end_time, break_minutes, notes } = body;

  if (!worker_id || !date || !start_time || !end_time) {
    return NextResponse.json(
      { error: 'worker_id, date, start_time, and end_time are required' },
      { status: 400 }
    );
  }

  const { data, error } = await ctx.supabase
    .from('schedules')
    .insert({
      company_id: ctx.company.id,
      worker_id,
      date,
      start_time,
      end_time,
      break_minutes: break_minutes || 0,
      notes: notes || null,
      created_by: ctx.adminUser.id,
    })
    .select('*, worker:workers(id, first_name, last_name, color, position)')
    .single();

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'This worker already has a schedule for this date' },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Google Calendar Sync
  const { GoogleCalendarService } = await import('@/lib/google/calendar');
  const googleEvent = await GoogleCalendarService.syncSchedule(data, data.worker, 'create');
  
  if (googleEvent?.google_event_id) {
    await ctx.supabase
      .from('schedules')
      .update({ google_event_id: googleEvent.google_event_id })
      .eq('id', data.id);
  }

  return NextResponse.json(data, { status: 201 });
}
