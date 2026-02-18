import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext, isAuthError } from '@/lib/auth-helpers';
import twilio from 'twilio';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;
  const { id } = await params;
  const { code } = await request.json();

  if (!code || code.length !== 6) {
    return NextResponse.json({ error: 'A 6-digit code is required' }, { status: 400 });
  }

  const { data: worker } = await ctx.supabase
    .from('workers')
    .select('*')
    .eq('id', id)
    .eq('company_id', ctx.company.id)
    .single();

  if (!worker) return NextResponse.json({ error: 'Worker not found' }, { status: 404 });

  if (!worker.phone) {
    return NextResponse.json({ error: 'Worker has no phone number' }, { status: 400 });
  }

  // Verify with Twilio
  try {
    const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!);
    const check = await twilioClient.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_SID!)
      .verificationChecks.create({ to: worker.phone, code });

    if (check.status !== 'approved') {
      return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 });
    }
  } catch (err) {
    console.error('Twilio verification check failed:', err);
    return NextResponse.json({ error: 'Verification service error' }, { status: 500 });
  }

  // Mark as verified
  await ctx.supabase
    .from('workers')
    .update({ phone_verified: true })
    .eq('id', id);

  return NextResponse.json({ success: true, phone_verified: true });
}
