import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext, isAuthError } from '@/lib/auth-helpers';
import { logAuditAction } from '@/lib/audit';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;
  const { id } = await params;

  const { data, error } = await ctx.supabase
    .from('workers')
    .select('*')
    .eq('id', id)
    .eq('company_id', ctx.company.id)
    .single();

  if (error || !data) return NextResponse.json({ error: 'Worker not found' }, { status: 404 });
  return NextResponse.json(data);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;
  const { id } = await params;
  const body = await request.json();

  const { data: existing } = await ctx.supabase
    .from('workers')
    .select('*')
    .eq('id', id)
    .eq('company_id', ctx.company.id)
    .single();

  if (!existing) return NextResponse.json({ error: 'Worker not found' }, { status: 404 });

  const allowedFields = [
    'first_name', 'last_name', 'phone', 'email', 'hourly_rate',
    'position', 'color', 'is_active', 'preferred_communication',
    'whatsapp_id', 'telegram_id', 'messenger_id',
  ];
  const updates: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (field in body) updates[field] = body[field];
  }

  const { data, error } = await ctx.supabase
    .from('workers')
    .update(updates)
    .eq('id', id)
    .eq('company_id', ctx.company.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAuditAction({
    companyId: ctx.company.id,
    adminUserId: ctx.adminUser.id,
    action: 'update',
    resourceType: 'worker',
    resourceId: id,
    oldValues: existing,
    newValues: updates,
  });

  return NextResponse.json(data);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;
  const { id } = await params;

  const { error } = await ctx.supabase
    .from('workers')
    .update({ is_active: false })
    .eq('id', id)
    .eq('company_id', ctx.company.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAuditAction({
    companyId: ctx.company.id,
    adminUserId: ctx.adminUser.id,
    action: 'deactivate',
    resourceType: 'worker',
    resourceId: id,
  });

  return NextResponse.json({ success: true });
}
