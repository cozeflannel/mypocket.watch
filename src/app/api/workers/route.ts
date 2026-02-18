import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext, isAuthError } from '@/lib/auth-helpers';
import { logAuditAction } from '@/lib/audit';
import twilio from 'twilio';

const COLORS = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
  '#EC4899', '#06B6D4', '#F97316', '#14B8A6', '#6366F1',
  '#D946EF', '#0EA5E9', '#84CC16', '#E11D48', '#7C3AED',
];

export async function GET() {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;

  const { data, error } = await ctx.supabase
    .from('workers')
    .select('*')
    .eq('company_id', ctx.company.id)
    .order('first_name');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;

  const body = await request.json();
  const { first_name, last_name, phone, email, hourly_rate, position, color } = body;

  if (!first_name || !last_name || !phone) {
    return NextResponse.json({ error: 'first_name, last_name, and phone are required' }, { status: 400 });
  }

  const assignedColor = color || COLORS[Math.floor(Math.random() * COLORS.length)];

  const { data: worker, error } = await ctx.supabase
    .from('workers')
    .insert({
      company_id: ctx.company.id,
      first_name,
      last_name,
      phone,
      email: email || null,
      hourly_rate: hourly_rate || null,
      position: position || null,
      color: assignedColor,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'A worker with this phone number already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await logAuditAction({
    companyId: ctx.company.id,
    adminUserId: ctx.adminUser.id,
    action: 'create',
    resourceType: 'worker',
    resourceId: worker.id,
    newValues: { first_name, last_name, phone, position },
  });

  // Initiate phone verification via Twilio Verify
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_VERIFY_SERVICE_SID) {
    try {
      const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      await twilioClient.verify.v2
        .services(process.env.TWILIO_VERIFY_SERVICE_SID)
        .verifications.create({ to: phone, channel: 'sms' });
    } catch (err) {
      console.error('Twilio Verify initiation failed:', err);
      // Don't fail the worker creation, verification can be retried
    }
  }

  return NextResponse.json(worker, { status: 201 });
}
