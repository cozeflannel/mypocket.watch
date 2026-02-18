import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext, isAuthError } from '@/lib/auth-helpers';
import { sendSMS, logMessage } from '@/lib/messaging';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;
  const { id } = await params;

  const { data: worker } = await ctx.supabase
    .from('workers')
    .select('*')
    .eq('id', id)
    .eq('company_id', ctx.company.id)
    .single();

  if (!worker) return NextResponse.json({ error: 'Worker not found' }, { status: 404 });
  if (!worker.phone) return NextResponse.json({ error: 'Worker has no phone number' }, { status: 400 });

  const welcomeMessage =
    `Welcome to ${ctx.company.name}! You're all set up for time tracking with My Pocket Watch. ⏰\n\n` +
    `Here's how it works:\n` +
    `📲 Clock In: Text "1"\n` +
    `📲 Clock Out: Text "2"\n` +
    `📲 Lunch Break: Text "3"\n` +
    `📲 Help: Text "HELP"\n\n` +
    `Choose your preferred way to communicate:\n` +
    `A) Keep using SMS\n` +
    `B) Switch to WhatsApp\n` +
    `C) Switch to Telegram\n` +
    `D) Switch to Messenger\n\n` +
    `Reply A, B, C, or D`;

  try {
    const sid = await sendSMS(worker.phone, welcomeMessage);

    await logMessage({
      companyId: ctx.company.id,
      workerId: worker.id,
      direction: 'outbound',
      platform: 'sms',
      messageType: 'onboarding',
      toAddress: worker.phone,
      fromAddress: process.env.TWILIO_PHONE_NUMBER || '',
      body: welcomeMessage,
      status: 'sent',
      externalId: sid,
    });

    await ctx.supabase
      .from('workers')
      .update({ onboarding_completed: true })
      .eq('id', id);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Onboarding message failed:', err);
    return NextResponse.json({ error: 'Failed to send welcome message' }, { status: 500 });
  }
}
