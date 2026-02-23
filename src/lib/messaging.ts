import twilio from 'twilio';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import type { Worker } from '@/types/database';

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
);

function getSupabaseAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function sendSMS(to: string, body: string): Promise<string | null> {
  const message = await twilioClient.messages.create({
    to,
    from: process.env.TWILIO_PHONE_NUMBER!,
    body,
  });
  return message.sid;
}

export async function sendWorkerWelcome(worker: Worker): Promise<boolean> {
  const botUsername = 'MyPocketWatchbot';
  
  const message = `Welcome to PocketWatch, ${worker.first_name}! 🎉\n\n` +
    `To clock in/out, message us on Telegram: @${botUsername}\n` +
    `Send /start to begin setup.\n\n` +
    `Need help? Contact your employer.`;
  
  // Try SMS as fallback since Telegram isn't linked yet
  if (worker.phone) {
    try {
      await sendSMS(worker.phone, message);
      return true;
    } catch (err) {
      console.error('Failed to send welcome SMS:', err);
    }
  }
  return false;
}

export async function sendWhatsApp(to: string, body: string): Promise<string | null> {
  const message = await twilioClient.messages.create({
    to: `whatsapp:${to}`,
    from: `whatsapp:${process.env.WHATSAPP_BUSINESS_PHONE!}`,
    body,
  });
  return message.sid;
}

export async function sendWhatsAppButtons(
  to: string,
  bodyText: string,
  buttons: Array<{ id: string; title: string }>
): Promise<string | null> {
  const message = await twilioClient.messages.create({
    to: `whatsapp:${to}`,
    from: `whatsapp:${process.env.WHATSAPP_BUSINESS_PHONE!}`,
    contentSid: undefined,
    body: bodyText + '\n\n' + buttons.map((b, i) => `${i + 1}. ${b.title}`).join('\n'),
  });
  return message.sid;
}

export async function sendTelegram(chatId: string, text: string, replyMarkup?: object): Promise<boolean> {
  const url = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN!}/sendMessage`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
    }),
  });
  return res.ok;
}

export async function sendMessenger(recipientId: string, text: string, quickReplies?: Array<{ title: string; payload: string }>): Promise<boolean> {
  const url = `https://graph.facebook.com/v18.0/me/messages?access_token=${process.env.FACEBOOK_PAGE_ACCESS_TOKEN!}`;
  const body: Record<string, unknown> = {
    recipient: { id: recipientId },
    message: quickReplies
      ? {
          text,
          quick_replies: quickReplies.map((qr) => ({
            content_type: 'text',
            title: qr.title,
            payload: qr.payload,
          })),
        }
      : { text },
  };
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.ok;
}

export async function sendMessageToWorker(
  worker: Worker,
  message: string,
  options?: { buttons?: Array<{ id: string; title: string }> }
): Promise<{ success: boolean; externalId: string | null }> {
  // Default to Telegram if no preference set or preference is SMS
  const preferred = worker.preferred_communication || 'telegram';
  
  // Try Telegram first (default) if they have a telegram_id
  if (preferred === 'telegram' || preferred === 'sms') {
    if (worker.telegram_id) {
      try {
        const keyboard = options?.buttons
          ? {
              inline_keyboard: [
                options.buttons.map((b) => ({ text: b.title, callback_data: b.id })),
              ],
            }
          : undefined;
        const success = await sendTelegram(worker.telegram_id, message, keyboard);
        if (success) {
          return { success: true, externalId: null };
        }
      } catch (error) {
        console.error('Telegram send failed:', error);
        // Fall through to SMS fallback
      }
    }
  }

  try {
    switch (preferred) {
      case 'sms': {
        if (!worker.phone) throw new Error('No phone number');
        const sid = await sendSMS(worker.phone, message);
        return { success: true, externalId: sid };
      }
      case 'whatsapp': {
        const phone = worker.whatsapp_id || worker.phone;
        if (!phone) throw new Error('No WhatsApp ID or phone');
        if (options?.buttons) {
          const sid = await sendWhatsAppButtons(phone, message, options.buttons);
          return { success: true, externalId: sid };
        }
        const sid = await sendWhatsApp(phone, message);
        return { success: true, externalId: sid };
      }
      case 'telegram': {
        // Already tried above, this should not be reached if telegram_id exists
        if (!worker.telegram_id) throw new Error('No Telegram ID');
        const keyboard = options?.buttons
          ? {
              inline_keyboard: [
                options.buttons.map((b) => ({ text: b.title, callback_data: b.id })),
              ],
            }
          : undefined;
        await sendTelegram(worker.telegram_id, message, keyboard);
        return { success: true, externalId: null };
      }
      case 'messenger': {
        if (!worker.messenger_id) throw new Error('No Messenger ID');
        const quickReplies = options?.buttons?.map((b) => ({
          title: b.title,
          payload: b.id,
        }));
        await sendMessenger(worker.messenger_id, message, quickReplies);
        return { success: true, externalId: null };
      }
      default:
        throw new Error(`Unknown platform: ${preferred}`);
    }
  } catch (error) {
    // Fallback to SMS if preferred is not SMS and phone exists
    if (preferred !== 'sms' && worker.phone) {
      try {
        const sid = await sendSMS(worker.phone, `[BACKUP] ${message}`);
        return { success: true, externalId: sid };
      } catch {
        return { success: false, externalId: null };
      }
    }
    return { success: false, externalId: null };
  }
}

export async function logMessage(params: {
  companyId: string;
  workerId: string | null;
  direction: 'inbound' | 'outbound';
  platform: 'sms' | 'whatsapp' | 'telegram' | 'messenger';
  messageType: string;
  toAddress: string;
  fromAddress: string;
  body: string;
  status: 'queued' | 'sent' | 'delivered' | 'failed' | 'received';
  externalId?: string | null;
}) {
  const supabase = getSupabaseAdmin();
  await supabase.from('message_logs').insert({
    company_id: params.companyId,
    worker_id: params.workerId,
    direction: params.direction,
    platform: params.platform,
    message_type: params.messageType,
    to_address: params.toAddress,
    from_address: params.fromAddress,
    body: params.body,
    status: params.status,
    external_id: params.externalId || null,
  });
}

export function getTimeTrackingButtons() {
  return [
    { id: 'clock_in', title: '🟢 Clock In' },
    { id: 'clock_out', title: '🔴 Clock Out' },
    { id: 'lunch', title: '🍽️ Lunch Break' },
  ];
}

export function getTelegramKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: '🟢 Clock In', callback_data: 'clock_in' },
        { text: '🔴 Clock Out', callback_data: 'clock_out' },
      ],
      [
        { text: '🍽️ Lunch Break', callback_data: 'lunch' },
        { text: '❓ Help', callback_data: 'help' },
      ],
    ],
  };
}

export function getMessengerQuickReplies() {
  return [
    { title: '🟢 Clock In', payload: 'CLOCK_IN' },
    { title: '🔴 Clock Out', payload: 'CLOCK_OUT' },
    { title: '🍽️ Lunch', payload: 'LUNCH' },
    { title: '❓ Help', payload: 'HELP' },
  ];
}
