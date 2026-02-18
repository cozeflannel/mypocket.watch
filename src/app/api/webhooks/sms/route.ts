import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';
import { getWorkerByPhone, parseCommand, processTimeCommand } from '@/lib/time-entry-processor';
import { logMessage } from '@/lib/messaging';

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const from = formData.get('From') as string;
  const body = formData.get('Body') as string;
  const messageSid = formData.get('MessageSid') as string;

  // Validate Twilio signature
  const signature = request.headers.get('x-twilio-signature') || '';
  const url = `${process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/sms`;
  const params: Record<string, string> = {};
  formData.forEach((value, key) => {
    params[key] = value as string;
  });

  const isValid = twilio.validateRequest(
    process.env.TWILIO_AUTH_TOKEN!,
    signature,
    url,
    params
  );

  if (!isValid && process.env.NODE_ENV === 'production') {
    return new NextResponse('Forbidden', { status: 403 });
  }

  const worker = await getWorkerByPhone(from);
  if (!worker) {
    const twiml = `<?xml version="1.0" encoding="UTF-8"?><Response><Message>Sorry, this number isn't registered. Please contact your employer.</Message></Response>`;
    return new NextResponse(twiml, { headers: { 'Content-Type': 'text/xml' } });
  }

  // Log inbound
  await logMessage({
    companyId: worker.company_id,
    workerId: worker.id,
    direction: 'inbound',
    platform: 'sms',
    messageType: 'time_entry',
    toAddress: process.env.TWILIO_PHONE_NUMBER || '',
    fromAddress: from,
    body,
    status: 'received',
    externalId: messageSid,
  });

  const command = parseCommand(body);
  if (!command) {
    const twiml = `<?xml version="1.0" encoding="UTF-8"?><Response><Message>I didn't understand that. Text "1" to clock in, "2" to clock out, "3" for lunch, or "HELP" for instructions.</Message></Response>`;
    return new NextResponse(twiml, { headers: { 'Content-Type': 'text/xml' } });
  }

  const result = await processTimeCommand(worker, command, 'sms');

  // Log outbound
  await logMessage({
    companyId: worker.company_id,
    workerId: worker.id,
    direction: 'outbound',
    platform: 'sms',
    messageType: 'time_entry_response',
    toAddress: from,
    fromAddress: process.env.TWILIO_PHONE_NUMBER || '',
    body: result.message,
    status: 'sent',
  });

  const twiml = `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${escapeXml(result.message)}</Message></Response>`;
  return new NextResponse(twiml, { headers: { 'Content-Type': 'text/xml' } });
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
