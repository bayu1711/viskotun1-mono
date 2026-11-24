import { getMessaging, getToken, isSupported } from 'firebase/messaging';
import { getFirebaseApp } from '../lib/firebase';
import type { UserLifestyleProfile, UserProfile } from '../types/auth';
import type { DailyNudgePayload } from '../types/notifications';
import type { Routine } from '../types/routine';
import { formatRoutineTitle } from './text';

export type FcmRegistrationResult =
  | { ok: true; token: string }
  | { ok: false; reason: 'unsupported' | 'missing_vapid' | 'permission_denied' | 'error'; error?: string };

/**
 * Pure DRY builder producing a calm, adaptive nudge payload consumed identically
 * by Firebase Cloud Messaging (Web Push) and the Telegram Bot channel.
 */
export function buildDailyNudgePayload(params: {
  routine: Routine | null | undefined;
  userProfile?: UserProfile;
  lifestyleProfile?: Partial<UserLifestyleProfile>;
  day?: number;
  windowLabel?: string;
}): DailyNudgePayload {
  const routineTitle =
    formatRoutineTitle(params.routine?.shortTitle) ||
    params.routine?.title ||
    'Daily Routine';
  const dayLabel = params.day ? `Day ${params.day}` : 'Today';
  const regionCity = params.lifestyleProfile?.region?.city?.trim();
  const adaptiveMode = params.lifestyleProfile?.activeAdaptation?.recommendedDoseMode;
  const windowName = params.windowLabel || params.lifestyleProfile?.activeAdaptation?.suggestedWindow;

  const contextParts: string[] = [];
  if (windowName) contextParts.push(windowName);
  if (regionCity) contextParts.push(regionCity);
  const contextLine = contextParts.length > 0 ? ` (${contextParts.join(' · ')})` : '';

  const doseHint =
    adaptiveMode === 'micro'
      ? 'Low-friction Micro set recommended today—1 set protects your momentum.'
      : params.lifestyleProfile?.isRamadanFastingObserver
      ? 'Scheduled safely outside fasting hours.'
      : 'Ready when you are—or switch to 1-set Micro if today is tight.';

  const namePrefix = params.userProfile?.displayName?.trim()
    ? `${params.userProfile.displayName.trim()}, `
    : '';

  return {
    title: `TrialN1 · ${dayLabel}: ${routineTitle}`,
    body: `${namePrefix}your window is open${contextLine}. ${doseHint}`,
    url: '/routine',
    routineId: params.routine?.id,
    windowLabel: windowName
  };
}

/**
 * Registers the service worker and requests a free Firebase Cloud Messaging (FCM)
 * Web Push registration token using `NEXT_PUBLIC_FIREBASE_VAPID_KEY`.
 */
export async function requestBrowserFcmToken(): Promise<FcmRegistrationResult> {
  if (typeof window === 'undefined' || !('Notification' in window) || !('serviceWorker' in navigator)) {
    return { ok: false, reason: 'unsupported' };
  }

  const vapidKey = (process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || '').trim();
  if (!vapidKey) {
    return { ok: false, reason: 'missing_vapid' };
  }

  try {
    const supported = await isSupported();
    if (!supported) {
      return { ok: false, reason: 'unsupported' };
    }

    const permission =
      Notification.permission === 'granted'
        ? 'granted'
        : await Notification.requestPermission();
    if (permission !== 'granted') {
      return { ok: false, reason: 'permission_denied' };
    }

    const app = getFirebaseApp();
    if (!app) {
      return { ok: false, reason: 'error', error: 'Firebase app unavailable' };
    }

    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    const messaging = getMessaging(app);
    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: registration
    });

    if (!token) {
      return { ok: false, reason: 'error', error: 'Empty FCM token returned' };
    }
    return { ok: true, token };
  } catch (err: unknown) {
    return {
      ok: false,
      reason: 'error',
      error: err instanceof Error ? err.message : 'Failed to register Web Push token'
    };
  }
}
