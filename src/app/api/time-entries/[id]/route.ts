import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext, isAuthError } from '@/lib/auth-helpers';
import { logAuditAction } from '@/lib/audit';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;
  const { id } = await params;
  const body = await request.json();

  const { data: existing } = await ctx.supabase
    .from('time_entries')
    .select('*')
    .eq('id', id)
    .eq('company_id', ctx.company.id)
    .single();

  if (!existing) return NextResponse.json({ error: 'Time entry not found' }, { status: 404 });

  // Mark old entry as corrected
  await ctx.supabase
    .from('time_entries')
    .update({ is_correction: true })
    .eq('id', id);

  // Create corrected entry
  const { data: corrected, error } = await ctx.supabase
    .from('time_entries')
    .insert({
      company_id: ctx.company.id,
      worker_id: existing.worker_id,
      clock_in: body.clock_in || existing.clock_in,
      clock_out: body.clock_out ?? existing.clock_out,
      lunch_out: body.lunch_out ?? existing.lunch_out,
      lunch_in: body.lunch_in ?? existing.lunch_in,
      break_minutes: body.break_minutes ?? existing.break_minutes,
      entry_type: body.entry_type || existing.entry_type,
      source: 'admin',
      notes: body.notes || `Corrected by admin`,
      is_correction: false,
      corrected_entry_id: id,
      approved_by: ctx.adminUser.id,
      approved_at: new Date().toISOString(),
    })
    .select('*, worker:workers(id, first_name, last_name, color, hourly_rate)')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAuditAction({
    companyId: ctx.company.id,
    adminUserId: ctx.adminUser.id,
    action: 'correct',
    resourceType: 'time_entry',
    resourceId: id,
    oldValues: existing,
    newValues: corrected,
  });

  return NextResponse.json(corrected);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;
  const { id } = await params;

  const { data: existing } = await ctx.supabase
    .from('time_entries')
    .select('*')
    .eq('id', id)
    .eq('company_id', ctx.company.id)
    .single();

  if (!existing) return NextResponse.json({ error: 'Time entry not found' }, { status: 404 });

  const { error } = await ctx.supabase
    .from('time_entries')
    .delete()
    .eq('id', id)
    .eq('company_id', ctx.company.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAuditAction({
    companyId: ctx.company.id,
    adminUserId: ctx.adminUser.id,
    action: 'delete',
    resourceType: 'time_entry',
    resourceId: id,
    oldValues: existing,
  });

  return NextResponse.json({ success: true });
}
