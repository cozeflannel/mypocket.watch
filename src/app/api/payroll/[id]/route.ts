import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext, isAuthError } from '@/lib/auth-helpers';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;
  const { id } = await params;

  const { data: period } = await ctx.supabase
    .from('payroll_periods')
    .select('*')
    .eq('id', id)
    .eq('company_id', ctx.company.id)
    .single();

  if (!period) return NextResponse.json({ error: 'Payroll period not found' }, { status: 404 });

  const { data: entries } = await ctx.supabase
    .from('payroll_entries')
    .select('*, worker:workers(id, first_name, last_name, color)')
    .eq('payroll_period_id', id)
    .eq('company_id', ctx.company.id)
    .order('created_at');

  return NextResponse.json({ ...period, entries: entries || [] });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;
  const { id } = await params;
  const body = await request.json();

  const updates: Record<string, unknown> = {};
  if (body.status) {
    updates.status = body.status;
    if (body.status === 'closed') {
      updates.closed_at = new Date().toISOString();
      updates.closed_by = ctx.adminUser.id;
    }
  }

  const { data, error } = await ctx.supabase
    .from('payroll_periods')
    .update(updates)
    .eq('id', id)
    .eq('company_id', ctx.company.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
