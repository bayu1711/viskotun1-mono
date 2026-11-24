import { NextResponse } from 'next/server';
import {
  answerTelegramCallbackQuery,
  applyNudgeActionToUserRecord,
  buildTelegramNudgeKeyboard,
  sendTelegramMessage
} from '../../../../server/touchpoints';
import {
  findUserByTelegramChatId,
  linkTelegramChatByCode
} from '../../../../server/userStorage';
import type { NudgeAction } from '../../../../types/notifications';

export const dynamic = 'force-dynamic';

const VALID_CALLBACK_ACTIONS = new Set<NudgeAction>([
  'complete_day',
  'switch_micro',
  'log_rest'
]);

interface TelegramUpdate {
  message?: {
    text?: string;
    chat?: { id?: number | string; username?: string };
    from?: { username?: string };
  };
  callback_query?: {
    id?: string;
    data?: string;
    message?: { chat?: { id?: number | string } };
  };
}

export async function POST(request: Request) {
  const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET?.trim();
  if (webhookSecret) {
    const provided = request.headers.get('x-telegram-bot-api-secret-token') || '';
    if (provided !== webhookSecret) {
      return NextResponse.json({ error: 'Unauthorized webhook caller' }, { status: 401 });
    }
  }

  try {
    const update: TelegramUpdate | null = await request.json().catch(() => null);
    if (!update) {
      return NextResponse.json({ ok: true });
    }

    // 1. Handle `/start <linkCode>` onboarding handshake
    const messageText = update.message?.text?.trim() || '';
    const chatId = update.message?.chat?.id ? String(update.message.chat.id) : '';
    if (chatId && messageText.startsWith('/start')) {
      const code = messageText.replace(/^\/start\s*/i, '').trim();
      const username = update.message?.from?.username || update.message?.chat?.username;
      if (code) {
        const linked = await linkTelegramChatByCode(code, chatId, username);
        if (linked) {
          await sendTelegramMessage({
            chatId,
            text: 'TrialN1 connected! You will receive free daily reminders at your chosen availability windows, and can log Full Set, Micro, or Rest directly here.',
            inlineKeyboard: buildTelegramNudgeKeyboard()
          });
          return NextResponse.json({ ok: true, linkedUserId: linked.userId });
        }
      }

      await sendTelegramMessage({
        chatId,
        text: 'Welcome to TrialN1! Visit Profile -> Data & Notifications to generate a linking code, then open the connect link.'
      });
      return NextResponse.json({ ok: true });
    }

    // 2. Handle 1-tap interactive inline buttons (`nudge:complete_day | switch_micro | log_rest`)
    const callback = update.callback_query;
    if (callback?.data && callback.message?.chat?.id) {
      const cbChatId = String(callback.message.chat.id);
      const rawAction = callback.data.replace(/^nudge:/, '') as NudgeAction;
      if (VALID_CALLBACK_ACTIONS.has(rawAction)) {
        const user = await findUserByTelegramChatId(cbChatId);
        if (user) {
          const outcome = await applyNudgeActionToUserRecord(user.userId, rawAction);
          if (callback.id) {
            await answerTelegramCallbackQuery(callback.id, outcome.confirmation.slice(0, 180));
          }
          await sendTelegramMessage({ chatId: cbChatId, text: outcome.confirmation });
          return NextResponse.json({ ok: true, action: rawAction, updated: outcome.ok });
        }
      }

      if (callback.id) {
        await answerTelegramCallbackQuery(callback.id, 'Please reconnect your account in TrialN1 Profile.');
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[TelegramWebhook] POST error:', err);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
