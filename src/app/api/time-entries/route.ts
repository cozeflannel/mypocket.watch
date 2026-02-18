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
    .from('time_entries')
    .select('*, worker:workers(id, first_name, last_name, color, hourly_rate)')
    .eq('company_id', ctx.company.id)
    .eq('is_correction', false)
    .order('clock_in', { ascending: false });

  if (startDate) query = query.gte('clock_in', `${startDate}T00:00:00Z`);
  if (endDate) query = query.lte('clock_in', `${endDate}T23:59:59Z`);
  if (workerId) query = query.eq('worker_id', workerId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;

  const body = await request.json();
  const { worker_id, clock_in, clock_out, lunch_out, lunch_in, break_minutes, entry_type, notes } = body;

  if (!worker_id || !clock_in) {
    return NextResponse.json({ error: 'worker_id and clock_in are required' }, { status: 400 });
  }

  const { data, error } = await ctx.supabase
    .from('time_entries')
    .insert({
      company_id: ctx.company.id,
      worker_id,
      clock_in,
      clock_out: clock_out || null,
      lunch_out: lunch_out || null,
      lunch_in: lunch_in || null,
      break_minutes: break_minutes || 0,
      entry_type: entry_type || 'regular',
      source: 'admin',
      notes: notes || null,
      approved_by: ctx.adminUser.id,
      approved_at: new Date().toISOString(),
    })
    .select('*, worker:workers(id, first_name, last_name, color, hourly_rate)')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
