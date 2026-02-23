import { NextRequest, NextResponse } from 'next/server';
import { getWorkerByTelegramId, getWorkerByPhone, parseCommand, processTimeCommand, getHelpText } from '@/lib/time-entry-processor';
import { sendTelegram, getTelegramKeyboard, logMessage } from '@/lib/messaging';
import { createClient as createAdminClient } from '@supabase/supabase-js';

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

function getSupabaseAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function linkTelegramId(workerId: string, telegramId: string): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from('workers')
    .update({ telegram_id: telegramId })
    .eq('id', workerId);
  return !error;
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

    // Handle /start command - with self-onboarding flow
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
          "Welcome to My Pocket Watch! ⏰\n\nTo get started, please reply with your phone number (the one your employer has on file). We'll verify and link your account automatically."
        );
      }
      return NextResponse.json({ ok: true });
    }

    // Handle phone number verification (onboarding)
    const worker = await getWorkerByTelegramId(userId);
    if (!worker) {
      // Try to find by phone number
      const phoneWorker = await getWorkerByPhone(text);
      if (phoneWorker) {
        const linked = await linkTelegramId(phoneWorker.id, userId);
        if (linked) {
          await sendTelegram(
            chatId,
            `✅ You're all set, ${phoneWorker.first_name}! Your Telegram is now linked to your PocketWatch account.\n\nUse the buttons below to clock in/out:`,
            getTelegramKeyboard()
          );
        } else {
          await sendTelegram(
            chatId,
            "Something went wrong linking your account. Please try again or contact your employer."
          );
        }
      } else {
        await sendTelegram(
          chatId,
          "We couldn't find an account with that phone number. Please check with your employer or try again."
        );
      }
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
