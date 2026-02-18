import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';
import { getWorkerByPhone, parseCommand, processTimeCommand } from '@/lib/time-entry-processor';
import { logMessage, sendWhatsApp } from '@/lib/messaging';

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const from = (formData.get('From') as string || '').replace('whatsapp:', '');
  const body = formData.get('Body') as string || '';
  const messageSid = formData.get('MessageSid') as string;
  const buttonPayload = formData.get('ButtonPayload') as string | null;

  // Validate Twilio signature
  const signature = request.headers.get('x-twilio-signature') || '';
  const url = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/whatsapp`;
  const params: Record<string, string> = {};
  formData.forEach((value, key) => { params[key] = value as string; });

  const isValid = twilio.validateRequest(process.env.TWILIO_AUTH_TOKEN!, signature, url, params);
  if (!isValid && process.env.NODE_ENV === 'production') {
    return new NextResponse('Forbidden', { status: 403 });
  }

  const worker = await getWorkerByPhone(from);
  if (!worker) {
    await sendWhatsApp(from, "Sorry, this number isn't registered. Please contact your employer.");
    return NextResponse.json({ status: 'ok' });
  }

  await logMessage({
    companyId: worker.company_id,
    workerId: worker.id,
    direction: 'inbound',
    platform: 'whatsapp',
    messageType: 'time_entry',
    toAddress: process.env.WHATSAPP_BUSINESS_PHONE || '',
    fromAddress: from,
    body: buttonPayload || body,
    status: 'received',
    externalId: messageSid,
  });

  // Parse button payload or text command
  let command = buttonPayload
    ? (buttonPayload as 'clock_in' | 'clock_out' | 'lunch' | 'help')
    : parseCommand(body);

  if (!command) {
    await sendWhatsApp(from,
      "I didn't understand that. Use the buttons below or text \"1\" (clock in), \"2\" (clock out), \"3\" (lunch), or \"HELP\"."
    );
    return NextResponse.json({ status: 'ok' });
  }

  const result = await processTimeCommand(worker, command, 'whatsapp');

  await logMessage({
    companyId: worker.company_id,
    workerId: worker.id,
    direction: 'outbound',
    platform: 'whatsapp',
    messageType: 'time_entry_response',
    toAddress: from,
    fromAddress: process.env.WHATSAPP_BUSINESS_PHONE || '',
    body: result.message,
    status: 'sent',
  });

  await sendWhatsApp(from, result.message);
  return NextResponse.json({ status: 'ok' });
}
