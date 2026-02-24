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
  if (process.env.NODE_ENV === 'production' && process.env.TELEGRAM_WEBHOOK_SECRET && secretToken !== process.env.TELEGRAM_WEBHOOK_SECRET) {
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

    // Handle /start LINKCODE (Telegram deep link format: t.me/bot?start=CODE)
    // Also handle /link CODE as fallback
    const isDeepLink = text.toLowerCase().startsWith('/start ') && text.split(' ').length === 2;
    const isLinkCommand = text.toLowerCase().startsWith('/link ');

    if (isDeepLink || isLinkCommand) {
      const code = isDeepLink
        ? text.split(' ')[1].trim().toUpperCase()
        : text.slice(6).trim().toUpperCase();
      const supabase = getSupabaseAdmin();

      // Find worker by link code
      const { data: workers } = await supabase
        .from('workers')
        .select('*')
        .filter('metadata->>telegram_link_code', 'eq', code)
        .is('telegram_id', null);

      if (workers && workers.length > 0) {
        const worker = workers[0];

        // Update worker with telegram_id and set pending_verification
        await supabase
          .from('workers')
          .update({
            telegram_id: userId,
            metadata: { pending_verification: true }
          })
          .eq('id', worker.id);

        await sendTelegram(
          chatId,
          `Account linked! Hi ${worker.first_name}!\n\nPlease verify your info:\nPhone: ${worker.phone}\n\nIs this correct? Reply YES or NO`
        );
      } else {
        await sendTelegram(chatId, "Invalid link code. Please contact your employer.");
      }
      return NextResponse.json({ ok: true });
    }

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

    // Handle YES verification
    if (text.toUpperCase() === 'YES' && worker?.metadata?.pending_verification) {
      const supabase = getSupabaseAdmin();

      // Update worker: phone_verified and remove pending_verification
      await supabase
        .from('workers')
        .update({
          phone_verified: true,
          metadata: {}
        })
        .eq('id', worker.id);

      // Fetch upcoming schedules
      const { data: schedules } = await supabase
        .from('schedules')
        .select('*')
        .eq('worker_id', worker.id)
        .gte('date', new Date().toISOString().split('T')[0])
        .order('date', { ascending: true })
        .limit(5);

      let scheduleList = 'No upcoming schedules yet.';
      if (schedules && schedules.length > 0) {
        scheduleList = schedules.map(s => {
          const date = new Date(s.date);
          const dayName = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
          return `${dayName} ${s.start_time} - ${s.end_time}`;
        }).join('\n');
      }

      await sendTelegram(
        chatId,
        `Thanks for confirming! You are all set.\n\nYour upcoming schedule:\n${scheduleList}\n\nUse the buttons below to clock in/out.`,
        getTelegramKeyboard()
      );
      return NextResponse.json({ ok: true });
    }

    // Handle NO verification
    if (text.toUpperCase() === 'NO' && worker?.metadata?.pending_verification) {
      const supabase = getSupabaseAdmin();

      await supabase
        .from('workers')
        .update({
          metadata: { pending_verification: false, awaiting_correction_details: true }
        })
        .eq('id', worker.id);

      await sendTelegram(
        chatId,
        "No problem! What information is incorrect? Please describe what needs to be updated."
      );
      return NextResponse.json({ ok: true });
    }

    // Handle correction details
    if (worker?.metadata?.awaiting_correction_details && text && text !== '/start') {
      const supabase = getSupabaseAdmin();

      // Store correction details
      await supabase
        .from('workers')
        .update({
          metadata: { correction_details: text, awaiting_correction_details: false }
        })
        .eq('id', worker.id);

      // Find admin users for this company
      const { data: adminUsers } = await supabase
        .from('admin_users')
        .select('*')
        .eq('company_id', worker.company_id)
        .not('telegram_id', 'is', null);

      // Notify admins
      if (adminUsers && adminUsers.length > 0) {
        for (const admin of adminUsers) {
          await sendTelegram(
            admin.telegram_id!,
            `Worker ${worker.first_name} ${worker.last_name} says their info needs updating:\n\n"${text}"\n\nPlease update in the admin panel.`
          );
        }
      }

      await sendTelegram(
        chatId,
        "Thanks! Your employer has been notified and will update your info."
      );
      return NextResponse.json({ ok: true });
    }

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
