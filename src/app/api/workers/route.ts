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
  const { first_name, last_name, phone, email, hourly_rate, position, color, hire_date, manager_id, team_id } = body;

  if (!first_name || !last_name || !phone) {
    return NextResponse.json({ error: 'first_name, last_name, and phone are required' }, { status: 400 });
  }

  const assignedColor = color || COLORS[Math.floor(Math.random() * COLORS.length)];

  // Use provided hire_date or default to today
  const workerHireDate = hire_date || new Date().toISOString().split('T')[0];

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
      hire_date: workerHireDate,
      manager_id: manager_id || null,
      team_id: team_id || null,
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

  // Generate 6-character alphanumeric link code
  const generateLinkCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const linkCode = generateLinkCode();

  // Update worker with link code in metadata
  await ctx.supabase
    .from('workers')
    .update({ metadata: { telegram_link_code: linkCode } })
    .eq('id', worker.id);

  // Send SMS with Telegram link code
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_PHONE_NUMBER) {
    try {
      const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      await twilioClient.messages.create({
        to: phone,
        from: process.env.TWILIO_PHONE_NUMBER,
        body: `Hi ${first_name}, welcome! To receive your schedule via Telegram, message @mypocketwatchbot and send: /link ${linkCode}`
      });
    } catch (err) {
      console.error('Twilio SMS failed:', err);
      // Don't fail the worker creation if SMS fails
    }
  }

  return NextResponse.json(worker, { status: 201 });
}
