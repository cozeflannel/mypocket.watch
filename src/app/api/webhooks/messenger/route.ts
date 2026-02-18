import { NextRequest, NextResponse } from 'next/server';
import { getWorkerByMessengerId, parseCommand, processTimeCommand } from '@/lib/time-entry-processor';
import { sendMessenger, getMessengerQuickReplies, logMessage } from '@/lib/messaging';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === process.env.FACEBOOK_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }
  return new NextResponse('Forbidden', { status: 403 });
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  if (body.object !== 'page') {
    return NextResponse.json({ status: 'ignored' });
  }

  for (const entry of body.entry || []) {
    for (const event of entry.messaging || []) {
      const senderId = event.sender?.id;
      if (!senderId) continue;

      let messageText = '';
      let quickReplyPayload = '';

      if (event.message?.quick_reply?.payload) {
        quickReplyPayload = event.message.quick_reply.payload;
      } else if (event.message?.text) {
        messageText = event.message.text;
      } else {
        continue;
      }

      const worker = await getWorkerByMessengerId(senderId);
      if (!worker) {
        await sendMessenger(
          senderId,
          "You're not registered. Please contact your employer to get set up with My Pocket Watch."
        );
        continue;
      }

      const inputText = quickReplyPayload || messageText;

      await logMessage({
        companyId: worker.company_id,
        workerId: worker.id,
        direction: 'inbound',
        platform: 'messenger',
        messageType: 'time_entry',
        toAddress: 'page',
        fromAddress: senderId,
        body: inputText,
        status: 'received',
      });

      // Map quick reply payloads
      const payloadMap: Record<string, string> = {
        CLOCK_IN: '1',
        CLOCK_OUT: '2',
        LUNCH: '3',
        HELP: 'HELP',
      };
      const mappedText = payloadMap[quickReplyPayload] || messageText;
      const command = parseCommand(mappedText);

      if (!command) {
        await sendMessenger(
          senderId,
          'Use the buttons below or type "1" (clock in), "2" (clock out), "3" (lunch), or "HELP".',
          getMessengerQuickReplies()
        );
        continue;
      }

      const result = await processTimeCommand(worker, command, 'messenger');

      await logMessage({
        companyId: worker.company_id,
        workerId: worker.id,
        direction: 'outbound',
        platform: 'messenger',
        messageType: 'time_entry_response',
        toAddress: senderId,
        fromAddress: 'page',
        body: result.message,
        status: 'sent',
      });

      await sendMessenger(senderId, result.message, getMessengerQuickReplies());
    }
  }

  return NextResponse.json({ status: 'ok' });
}
