import { NextResponse } from 'next/server';
import { COPY } from '../../../../data/copy';
import { getRequestUser } from '../../../../server/auth';
import { hasGcpCredentials } from '../../../../server/guardrailLedger';
import {
  dispatchDueTouchpoints,
  getTelegramBotUsername,
  isTelegramBotConfigured,
  isWebPushVapidConfigured
} from '../../../../server/touchpoints';
import {
  ensureCalendarFeedToken,
  getUserRecord,
  issueTelegramLinkCode,
  registerUserFcmToken,
  removeUserFcmToken,
  unlinkTelegramChat
} from '../../../../server/userStorage';
import type { TouchpointStatusResponse } from '../../../../types/notifications';
import { buildCalendarFeedUrls } from '../../../../utils/calendar';

export const dynamic = 'force-dynamic';

type PreferenceAction =
  | 'init_calendar_feed'
  | 'rotate_calendar_token'
  | 'register_fcm_token'
  | 'generate_telegram_link'
  | 'send_test_nudge';

function resolveRequestOrigin(request: Request): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configured) return configured.replace(/\/+$/, '');
  try {
    return new URL(request.url).origin;
  } catch {
    return 'https://trialn1.app';
  }
}

async function buildStatusResponse(
  request: Request,
  userId: string
): Promise<TouchpointStatusResponse> {
  const feedToken = await ensureCalendarFeedToken(userId, false);
  const record = await getUserRecord(userId);
  const { httpsUrl, webcalUrl } = buildCalendarFeedUrls(resolveRequestOrigin(request), feedToken);
  const botUsername = getTelegramBotUsername();
  const linkCode = record?.notifications?.telegram?.linkCode;

  return {
    userId,
    reminderNotificationsEnabled: record?.profile?.reminderNotificationsEnabled !== false,
    calendarFeedToken: feedToken,
    calendarFeedHttpsUrl: httpsUrl,
    calendarFeedWebcalUrl: webcalUrl,
    webPushTokenCount: record?.notifications?.webPushTokens?.length ?? 0,
    telegram: {
      connected: Boolean(record?.notifications?.telegram?.connected),
      ...(record?.notifications?.telegram?.username
        ? { username: record.notifications.telegram.username }
        : {}),
      ...(linkCode ? { linkCode } : {}),
      ...(botUsername && linkCode
        ? { deepLinkUrl: `https://t.me/${botUsername}?start=${encodeURIComponent(linkCode)}` }
        : {})
    },
    config: {
      webPushVapidConfigured: isWebPushVapidConfigured(),
      fcmServerConfigured: hasGcpCredentials(),
      telegramBotConfigured: isTelegramBotConfigured(),
      ...(botUsername ? { telegramBotUsername: botUsername } : {})
    }
  };
}

export async function GET(request: Request) {
  try {
    const authUser = await getRequestUser(request);
    const { searchParams } = new URL(request.url);
    const userId = authUser?.uid || searchParams.get('userId')?.trim();

    if (!userId) {
      return NextResponse.json({ error: COPY.api.userSync.userIdRequired }, { status: 400 });
    }

    const status = await buildStatusResponse(request, userId);
    return NextResponse.json({ success: true, ...status });
  } catch (err) {
    console.error('[NotificationsPreferences] GET error:', err);
    return NextResponse.json({ error: COPY.api.userSync.internalError }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authUser = await getRequestUser(request);
    const body = await request.json().catch(() => null);
    const rawUserId = typeof body?.userId === 'string' ? body.userId.trim() : '';
    const userId = authUser?.uid || rawUserId;
    const action = body?.action as PreferenceAction | undefined;

    if (!userId) {
      return NextResponse.json({ error: COPY.api.userSync.userIdRequired }, { status: 400 });
    }

    if (action === 'rotate_calendar_token') {
      await ensureCalendarFeedToken(userId, true);
    } else if (action === 'register_fcm_token') {
      const fcmToken = typeof body?.fcmToken === 'string' ? body.fcmToken.trim() : '';
      if (!fcmToken) {
        return NextResponse.json({ error: 'fcmToken is required' }, { status: 400 });
      }
      await registerUserFcmToken(userId, fcmToken);
    } else if (action === 'generate_telegram_link') {
      await issueTelegramLinkCode(userId);
    } else if (action === 'send_test_nudge') {
      const dispatch = await dispatchDueTouchpoints({ targetUserId: userId, force: true });
      const status = await buildStatusResponse(request, userId);
      return NextResponse.json({ success: true, dispatch, ...status });
    } else {
      await ensureCalendarFeedToken(userId, false);
    }

    const status = await buildStatusResponse(request, userId);
    return NextResponse.json({ success: true, ...status });
  } catch (err) {
    console.error('[NotificationsPreferences] POST error:', err);
    return NextResponse.json({ error: COPY.api.userSync.internalError }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const authUser = await getRequestUser(request);
    const body = await request.json().catch(() => null);
    const { searchParams } = new URL(request.url);
    const userId =
      authUser?.uid ||
      (typeof body?.userId === 'string' ? body.userId.trim() : '') ||
      searchParams.get('userId')?.trim();
    const target = (body?.target || searchParams.get('target')) as 'web_push' | 'telegram' | undefined;

    if (!userId) {
      return NextResponse.json({ error: COPY.api.userSync.userIdRequired }, { status: 400 });
    }

    if (target === 'web_push') {
      const fcmToken = typeof body?.fcmToken === 'string' ? body.fcmToken.trim() : undefined;
      await removeUserFcmToken(userId, fcmToken);
    } else if (target === 'telegram') {
      await unlinkTelegramChat(userId);
    }

    const status = await buildStatusResponse(request, userId);
    return NextResponse.json({ success: true, ...status });
  } catch (err) {
    console.error('[NotificationsPreferences] DELETE error:', err);
    return NextResponse.json({ error: COPY.api.userSync.internalError }, { status: 500 });
  }
}
