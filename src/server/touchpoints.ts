import { GoogleAuth } from 'google-auth-library';
import { achillesRoutine } from '../data/routines/achilles';
import type { DailyNudgePayload, NudgeAction } from '../types/notifications';
import type { Routine, RoutineRuntime } from '../types/routine';
import { buildDailyNudgePayload } from '../utils/notifications';
import { parseTimeToMinutes, resolveProfileAvailability } from '../utils/schedule';
import { getFirebaseProjectId } from './auth';
import { hasGcpCredentials } from './guardrailLedger';
import {
  getAllUserRecords,
  getUserRecord,
  removeUserFcmToken,
  saveUserRecord,
  type UserRecord
} from './userStorage';

const FCM_SCOPE = 'https://www.googleapis.com/auth/firebase.messaging';

let cachedFcmAuth: GoogleAuth | null = null;

function getAppBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || 'https://trialn1.app').replace(/\/+$/, '');
}

export function getTelegramBotUsername(): string | undefined {
  const raw = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || process.env.TELEGRAM_BOT_USERNAME;
  const clean = raw?.trim().replace(/^@/, '');
  return clean || undefined;
}

export function isTelegramBotConfigured(): boolean {
  return Boolean(process.env.TELEGRAM_BOT_TOKEN?.trim());
}

export function isWebPushVapidConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY?.trim());
}

/** Resolves the active routine on a stored UserRecord, falling back cleanly to the calibrated baseline. */
export function resolveActiveRoutineForRecord(record: UserRecord): Routine {
  const routines = Array.isArray(record.routines) ? record.routines : [];
  if (record.activeRoutineId) {
    const match = routines.find((r) => r.id === record.activeRoutineId);
    if (match) return match;
  }
  return routines[0] ?? achillesRoutine;
}

function formatDayKey(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Returns the due availability window label if the current clock sits within `[start, start + 15m]`. */
export function findDueAvailabilityWindow(record: UserRecord, now: Date): string | null {
  if (record.profile?.reminderNotificationsEnabled === false) return null;

  const avail = resolveProfileAvailability(record.profile);
  const windows =
    avail.mode === 'windows' && avail.windows.length > 0
      ? avail.windows
      : [{ id: 'default', label: 'Daily window', start: '09:00', end: '09:30' }];

  const currentMins = now.getUTCHours() * 60 + now.getUTCMinutes();
  for (const w of windows) {
    const startMins = parseTimeToMinutes(w.start);
    if (startMins === null) continue;
    const diff = currentMins - startMins;
    if (diff >= 0 && diff <= 15) {
      return `${w.label} (${w.start})`;
    }
  }
  return null;
}

/** Obtains an OAuth2 access token for FCM HTTP v1 when GCP credentials are present. */
async function getFcmAccessToken(): Promise<string | null> {
  if (!hasGcpCredentials()) return null;
  try {
    cachedFcmAuth ??= new GoogleAuth({ scopes: [FCM_SCOPE] });
    const client = await cachedFcmAuth.getClient();
    const tokenRes = await client.getAccessToken();
    return tokenRes.token ?? null;
  } catch (err) {
    console.warn('[Touchpoints] Unable to acquire FCM OAuth token:', err);
    return null;
  }
}

export interface SendFcmResult {
  sent: boolean;
  status: 'sent' | 'invalid_token' | 'unconfigured' | 'error';
  detail?: string;
}

/** Dispatches a single Web Push message via the free Firebase Cloud Messaging HTTP v1 API. */
export async function sendFcmNotification(
  token: string,
  payload: DailyNudgePayload
): Promise<SendFcmResult> {
  const accessToken = await getFcmAccessToken();
  if (!accessToken) {
    return { sent: false, status: 'unconfigured', detail: 'No GCP/FCM server credentials configured locally.' };
  }

  const projectId = getFirebaseProjectId();
  const appUrl = getAppBaseUrl();
  const targetUrl = payload.url.startsWith('http') ? payload.url : `${appUrl}${payload.url}`;

  try {
    const res = await fetch(`https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: {
          token,
          notification: {
            title: payload.title,
            body: payload.body
          },
          webpush: {
            fcm_options: { link: targetUrl },
            notification: {
              title: payload.title,
              body: payload.body,
              icon: `${appUrl}/icon.png`
            }
          },
          data: {
            url: payload.url,
            routineId: payload.routineId || ''
          }
        }
      }),
      signal: AbortSignal.timeout(8000)
    });

    if (res.ok) {
      return { sent: true, status: 'sent' };
    }

    const errText = await res.text().catch(() => '');
    if (res.status === 404 || errText.includes('UNREGISTERED')) {
      return { sent: false, status: 'invalid_token', detail: errText };
    }
    return { sent: false, status: 'error', detail: `HTTP ${res.status}: ${errText.slice(0, 160)}` };
  } catch (err: unknown) {
    return {
      sent: false,
      status: 'error',
      detail: err instanceof Error ? err.message : 'FCM request failed'
    };
  }
}

export interface TelegramButton {
  text: string;
  callback_data?: string;
  url?: string;
}

/** Builds interactive Telegram inline keyboard buttons allowing 1-tap log or Micro-dose fallback. */
export function buildTelegramNudgeKeyboard(): TelegramButton[][] {
  const appUrl = getAppBaseUrl();
  return [
    [
      { text: 'Done Full Set', callback_data: 'nudge:complete_day' },
      { text: 'Tough Day -> Micro', callback_data: 'nudge:switch_micro' }
    ],
    [
      { text: 'Rest Day', callback_data: 'nudge:log_rest' },
      { text: 'Open TrialN1', url: `${appUrl}/routine` }
    ]
  ];
}

/** Sends a Telegram message via the free Bot API (`$0` / message). */
export async function sendTelegramMessage(params: {
  chatId: string;
  text: string;
  inlineKeyboard?: TelegramButton[][];
}): Promise<{ sent: boolean; status: 'sent' | 'unconfigured' | 'error'; detail?: string }> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN?.trim();
  if (!botToken) {
    return { sent: false, status: 'unconfigured', detail: 'TELEGRAM_BOT_TOKEN not configured.' };
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: params.chatId,
        text: params.text,
        ...(params.inlineKeyboard ? { reply_markup: { inline_keyboard: params.inlineKeyboard } } : {})
      }),
      signal: AbortSignal.timeout(8000)
    });

    if (res.ok) return { sent: true, status: 'sent' };
    const errText = await res.text().catch(() => '');
    return { sent: false, status: 'error', detail: `HTTP ${res.status}: ${errText.slice(0, 160)}` };
  } catch (err: unknown) {
    return {
      sent: false,
      status: 'error',
      detail: err instanceof Error ? err.message : 'Telegram request failed'
    };
  }
}

/** Acknowledges a Telegram inline button tap so the spinner stops immediately in the client. */
export async function answerTelegramCallbackQuery(
  callbackQueryId: string,
  text: string
): Promise<void> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN?.trim();
  if (!botToken || !callbackQueryId) return;

  try {
    await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ callback_query_id: callbackQueryId, text }),
      signal: AbortSignal.timeout(5000)
    });
  } catch {
    // Non-fatal
  }
}

/** Applies a 1-tap Telegram callback action directly to the participant's active routine runtime. */
export async function applyNudgeActionToUserRecord(
  userId: string,
  action: NudgeAction
): Promise<{ ok: boolean; confirmation: string; routineTitle?: string }> {
  const record = await getUserRecord(userId);
  if (!record) {
    return { ok: false, confirmation: 'Account record not found.' };
  }

  const routine = resolveActiveRoutineForRecord(record);
  const title = routine.shortTitle || routine.title;
  const runtimeMap: Record<string, RoutineRuntime> = { ...(record.runtime || {}) };
  const existingRuntime = runtimeMap[routine.id];
  const currentEntry: RoutineRuntime = {
    ...(existingRuntime ?? {}),
    setsDone: existingRuntime?.setsDone ?? {},
    feedbackLogs: existingRuntime?.feedbackLogs ?? [],
    messages: existingRuntime?.messages ?? routine.initialMessages ?? [],
    escalationPaused: existingRuntime?.escalationPaused ?? false,
    doseMode: existingRuntime?.doseMode ?? 'standard'
  };

  let confirmation = `Opened ${title}.`;
  if (action === 'complete_day') {
    const nextSetsDone: Record<string, number> = { ...currentEntry.setsDone };
    for (const step of routine.steps) {
      nextSetsDone[step.id] = Math.max(nextSetsDone[step.id] ?? 0, step.sets ?? 1);
    }
    currentEntry.setsDone = nextSetsDone;
    currentEntry.lastActiveDate = formatDayKey(new Date());
    confirmation = `Logged Day ${routine.currentDay} full set for ${title}.`;
  } else if (action === 'switch_micro') {
    currentEntry.doseMode = 'micro';
    confirmation = `Switched ${title} to low-friction Micro mode (1 set preserves your momentum).`;
  } else if (action === 'log_rest') {
    currentEntry.doseMode = 'rest';
    confirmation = `Logged recovery Rest day for ${title} with zero streak penalty.`;
  }

  runtimeMap[routine.id] = currentEntry;
  await saveUserRecord({
    ...record,
    activeRoutineId: record.activeRoutineId || routine.id,
    runtime: runtimeMap,
    updatedAt: Date.now()
  });

  return { ok: true, confirmation, routineTitle: title };
}

export interface DispatchSummary {
  evaluatedUsers: number;
  sentWebPush: number;
  sentTelegram: number;
  skipped: number;
  previewPayload?: DailyNudgePayload;
}

/**
 * Evaluates participants (or a single target user for test nudges) and dispatches
 * free daily adherence reminders across Web Push (FCM) and Telegram.
 */
export async function dispatchDueTouchpoints(options: {
  now?: Date;
  targetUserId?: string;
  force?: boolean;
} = {}): Promise<DispatchSummary> {
  const now = options.now ?? new Date();
  const dayKey = formatDayKey(now);

  const candidates = options.targetUserId
    ? [await getUserRecord(options.targetUserId)].filter((r): r is UserRecord => Boolean(r))
    : await getAllUserRecords();

  let sentWebPush = 0;
  let sentTelegram = 0;
  let skipped = 0;
  let previewPayload: DailyNudgePayload | undefined;

  for (const record of candidates) {
    if (record.accountStatus === 'deactivated') {
      skipped += 1;
      continue;
    }

    const pushTokens = record.notifications?.webPushTokens ?? [];
    const telegramChat = record.notifications?.telegram?.connected
      ? record.notifications.telegram.chatId
      : undefined;

    if (!options.force && pushTokens.length === 0 && !telegramChat) {
      skipped += 1;
      continue;
    }

    let windowLabel = 'Daily check-in';
    if (!options.force) {
      const dueWindow = findDueAvailabilityWindow(record, now);
      if (!dueWindow || record.notifications?.lastNudgeDate === dayKey) {
        skipped += 1;
        continue;
      }
      windowLabel = dueWindow;
    }

    const routine = resolveActiveRoutineForRecord(record);
    const payload = buildDailyNudgePayload({
      routine,
      userProfile: record.profile,
      lifestyleProfile: record.lifestyleProfile,
      day: routine.currentDay ?? 1,
      windowLabel
    });
    if (!previewPayload) previewPayload = payload;

    const pushResults = await Promise.all(
      pushTokens.map(async (token) => {
        const res = await sendFcmNotification(token, payload);
        if (res.status === 'invalid_token') {
          await removeUserFcmToken(record.userId, token);
        }
        return res;
      })
    );
    sentWebPush += pushResults.filter((r) => r.sent).length;

    if (telegramChat) {
      const tgRes = await sendTelegramMessage({
        chatId: telegramChat,
        text: `${payload.title}\n\n${payload.body}`,
        inlineKeyboard: buildTelegramNudgeKeyboard()
      });
      if (tgRes.sent) sentTelegram += 1;
    }

    if (sentWebPush > 0 || sentTelegram > 0 || !options.force) {
      await saveUserRecord({
        ...record,
        notifications: {
          ...record.notifications,
          lastNudgeDate: dayKey,
          lastNudgeSentAt: now.getTime()
        },
        updatedAt: Date.now()
      });
    }
  }

  return {
    evaluatedUsers: candidates.length,
    sentWebPush,
    sentTelegram,
    skipped,
    ...(previewPayload ? { previewPayload } : {})
  };
}
