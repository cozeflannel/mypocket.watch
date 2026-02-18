import { NextRequest, NextResponse } from 'next/server';
import { getWorkerByTelegramId, parseCommand, processTimeCommand, getHelpText } from '@/lib/time-entry-processor';
import { sendTelegram, getTelegramKeyboard, logMessage } from '@/lib/messaging';

interface TelegramUpdate {
  message?: {
    chat: { id: number };
    from: { id: number; first_name: string };
    text?: string;
  };
  callback_query?: {
    id: string;
    from: { id: number; first_name: string };
    message: { chat: { id: number } };
    data: string;
  };
}

export async function POST(request: NextRequest) {
  const secretToken = request.headers.get('x-telegram-bot-api-secret-token');
  if (process.env.NODE_ENV === 'production' && secretToken !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  const update: TelegramUpdate = await request.json();
  const chatId = String(
    update.callback_query?.message.chat.id || update.message?.chat.id || ''
  );
  const userId = String(update.callback_query?.from.id || update.message?.from.id || '');

  if (!chatId || !userId) {
    return NextResponse.json({ ok: true });
  }

  // Handle callback query (button press)
  if (update.callback_query) {
    const data = update.callback_query.data;

    // Acknowledge the callback
    await fetch(
      `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/answerCallbackQuery`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callback_query_id: update.callback_query.id }),
      }
    );

    const worker = await getWorkerByTelegramId(userId);
    if (!worker) {
      await sendTelegram(chatId, "You're not registered. Please contact your employer to get set up.");
      return NextResponse.json({ ok: true });
    }

    const command = data === 'clock_in' ? 'clock_in'
      : data === 'clock_out' ? 'clock_out'
      : data === 'lunch' ? 'lunch'
      : data === 'help' ? 'help'
      : null;

    if (!command) {
      await sendTelegram(chatId, "Unknown action.", getTelegramKeyboard());
      return NextResponse.json({ ok: true });
    }

    await logMessage({
      companyId: worker.company_id,
      workerId: worker.id,
      direction: 'inbound',
      platform: 'telegram',
      messageType: 'time_entry',
      toAddress: 'bot',
      fromAddress: userId,
      body: data,
      status: 'received',
    });

    const result = await processTimeCommand(worker, command, 'telegram');

    await logMessage({
      companyId: worker.company_id,
      workerId: worker.id,
      direction: 'outbound',
      platform: 'telegram',
      messageType: 'time_entry_response',
      toAddress: userId,
      fromAddress: 'bot',
      body: result.message,
      status: 'sent',
    });

    await sendTelegram(chatId, result.message, getTelegramKeyboard());
    return NextResponse.json({ ok: true });
  }

  // Handle text message
  if (update.message?.text) {
    const text = update.message.text;

    // Handle /start command
    if (text === '/start') {
      const worker = await getWorkerByTelegramId(userId);
      if (worker) {
        await sendTelegram(
          chatId,
          `Welcome back, ${worker.first_name}! Use the buttons below to track your time.`,
          getTelegramKeyboard()
        );
      } else {
        await sendTelegram(
          chatId,
          "Welcome to My Pocket Watch! ⏰\n\nYour employer needs to register your Telegram ID first. Please contact them to get set up."
        );
      }
      return NextResponse.json({ ok: true });
    }

    const worker = await getWorkerByTelegramId(userId);
    if (!worker) {
      await sendTelegram(chatId, "You're not registered. Please contact your employer.");
      return NextResponse.json({ ok: true });
    }

    // Map /commands to standard commands
    const commandMap: Record<string, string> = {
      '/clockin': '1',
      '/clockout': '2',
      '/lunch': '3',
      '/help': 'HELP',
    };
    const mappedText = commandMap[text.toLowerCase()] || text;
    const command = parseCommand(mappedText);

    if (!command) {
      await sendTelegram(chatId, "Use the buttons below or type /clockin, /clockout, /lunch, /help", getTelegramKeyboard());
      return NextResponse.json({ ok: true });
    }

    await logMessage({
      companyId: worker.company_id,
      workerId: worker.id,
      direction: 'inbound',
      platform: 'telegram',
      messageType: 'time_entry',
      toAddress: 'bot',
      fromAddress: userId,
      body: text,
      status: 'received',
    });

    const result = await processTimeCommand(worker, command, 'telegram');

    await logMessage({
      companyId: worker.company_id,
      workerId: worker.id,
      direction: 'outbound',
      platform: 'telegram',
      messageType: 'time_entry_response',
      toAddress: userId,
      fromAddress: 'bot',
      body: result.message,
      status: 'sent',
    });

    await sendTelegram(chatId, result.message, getTelegramKeyboard());
  }

  return NextResponse.json({ ok: true });
}
