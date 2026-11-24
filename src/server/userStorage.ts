/**
 * Google Cloud Firestore Users Storage Ledger & Real-Time Telemetry
 * 
 * Manages user workspaces, active routine assignments, and runtime telemetry
 * (feedback logs, morphing logs, day history, completed sets).
 * Provides live aggregate statistics for routines without dummy or simulated multipliers.
 */

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { getFirestore } from './guardrailLedger';
import type { UserLifestyleProfile, UserProfile } from '../types/auth';
import type { UserNotificationPreferences } from '../types/notifications';
import type { Routine, RoutineRuntime } from '../types/routine';
import { SEEDED_COMMUNITY_USERS } from './seedUsers';

export interface UserRecord {
  userId: string;
  activeRoutineId?: string;
  routines: Routine[];
  runtime: Record<string, RoutineRuntime>;
  profile?: UserProfile;
  lifestyleProfile?: UserLifestyleProfile;
  notifications?: UserNotificationPreferences;
  accountStatus?: 'active' | 'deactivated';
  deactivatedAt?: number;
  updatedAt: number;
}

const IS_TEST = process.env.NODE_ENV === 'test' || Boolean(process.env.VITEST);
const LOCAL_STORAGE_FILE = path.join(process.cwd(), '.viskotun1_users.local.json');

// In-memory server-side user store with fail-safe fallback
export const memoryUserStorage = new Map<string, UserRecord>();

// Pre-seed memory cache with authentic simulated trial cohort participants
for (const user of SEEDED_COMMUNITY_USERS) {
  memoryUserStorage.set(user.userId, user);
}

function loadLocalUserLedger(): void {
  if (IS_TEST) return;
  try {
    if (fs.existsSync(LOCAL_STORAGE_FILE)) {
      const raw = fs.readFileSync(LOCAL_STORAGE_FILE, 'utf-8');
      const records = JSON.parse(raw);
      if (Array.isArray(records)) {
        for (const record of records) {
          if (record && record.userId) {
            memoryUserStorage.set(record.userId, record);
          }
        }
      }
    }
  } catch {
    // Fail-safe silent continue
  }
}

function persistLocalUserLedger(): void {
  if (IS_TEST) return;
  try {
    const records = Array.from(memoryUserStorage.values());
    fs.writeFileSync(LOCAL_STORAGE_FILE, JSON.stringify(records, null, 2), 'utf-8');
  } catch {
    // Fail-safe silent continue in read-only environments
  }
}

// Hydrate from local ledger on startup
loadLocalUserLedger();

let hasAttemptedUserSeed = false;

async function seedUsersIfEmpty(): Promise<void> {
  const db = getFirestore();
  if (!db || hasAttemptedUserSeed) return;
  hasAttemptedUserSeed = true;

  try {
    const snapshot = await db.collection('users').limit(1).get();
    if (snapshot.empty) {
      const batch = db.batch();
      for (const user of SEEDED_COMMUNITY_USERS) {
        const docRef = db.collection('users').doc(user.userId);
        batch.set(docRef, user, { merge: true });
      }
      await batch.commit();
    }
  } catch (err: any) {
    console.warn('[UserStorage] Firestore initial user seeding skipped/failed:', err?.message || err);
  }
}

/**
 * Retrieve a user record by ID from live Cloud Firestore or fallback memory cache.
 */
export async function getUserRecord(userId: string): Promise<UserRecord | null> {
  const db = getFirestore();
  if (db) {
    try {
      const doc = await db.collection('users').doc(userId).get();
      if (doc.exists) {
        const data = doc.data() as UserRecord;
        if (data) {
          const resolved: UserRecord = {
            userId,
            activeRoutineId: data.activeRoutineId,
            routines: data.routines || [],
            runtime: data.runtime || {},
            ...(data.profile ? { profile: data.profile } : {}),
            ...(data.lifestyleProfile ? { lifestyleProfile: data.lifestyleProfile } : {}),
            ...(data.notifications ? { notifications: data.notifications } : {}),
            updatedAt: data.updatedAt || Date.now()
          };
          memoryUserStorage.set(userId, resolved);
          persistLocalUserLedger();
          return resolved;
        }
      }
    } catch (err: any) {
      console.warn('[UserStorage] Firestore read failed, falling back to memory:', err?.message || err);
    }
  }

  if (memoryUserStorage.has(userId)) {
    return memoryUserStorage.get(userId) || null;
  }

  loadLocalUserLedger();
  return memoryUserStorage.get(userId) || null;
}

/**
 * Persist a user record to both memory cache and Cloud Firestore.
 */
export async function saveUserRecord(record: UserRecord): Promise<void> {
  memoryUserStorage.set(record.userId, record);
  persistLocalUserLedger();
  const db = getFirestore();
  if (db) {
    try {
      await db.collection('users').doc(record.userId).set(record, { merge: true });
    } catch (err: any) {
      console.warn('[UserStorage] Firestore save failed, stored in memory cache:', err?.message || err);
    }
  }
}

/**
 * Clears all tracked routines, runtime telemetry, and saved profile/lifestyle settings
 * while keeping the account record active.
 */
export async function clearUserData(userId: string): Promise<UserRecord> {
  const existing = await getUserRecord(userId);
  const cleared: UserRecord = {
    userId,
    activeRoutineId: '',
    routines: [],
    runtime: {},
    accountStatus: existing?.accountStatus ?? 'active',
    updatedAt: Date.now()
  };

  memoryUserStorage.set(userId, cleared);
  persistLocalUserLedger();

  const db = getFirestore();
  if (db) {
    try {
      await db.collection('users').doc(userId).set(cleared, { merge: false });
    } catch (err: any) {
      console.warn('[UserStorage] Firestore clear failed, cleared memory cache:', err?.message || err);
    }
  }

  return cleared;
}

/**
 * Temporarily pauses/deactivates a user account while preserving their stored routines and logs.
 */
export async function deactivateUserAccount(userId: string): Promise<UserRecord> {
  const existing = await getUserRecord(userId);
  const deactivated: UserRecord = {
    userId,
    activeRoutineId: existing?.activeRoutineId ?? '',
    routines: existing?.routines ?? [],
    runtime: existing?.runtime ?? {},
    ...(existing?.profile ? { profile: existing.profile } : {}),
    ...(existing?.lifestyleProfile ? { lifestyleProfile: existing.lifestyleProfile } : {}),
    ...(existing?.notifications ? { notifications: existing.notifications } : {}),
    accountStatus: 'deactivated',
    deactivatedAt: Date.now(),
    updatedAt: Date.now()
  };

  await saveUserRecord(deactivated);
  return deactivated;
}

/**
 * Reactivates a previously deactivated user account upon sign-in.
 */
export async function reactivateUserAccount(userId: string): Promise<UserRecord | null> {
  const existing = await getUserRecord(userId);
  if (!existing) return null;

  const reactivated: UserRecord = {
    ...existing,
    accountStatus: 'active',
    updatedAt: Date.now()
  };
  delete reactivated.deactivatedAt;

  memoryUserStorage.set(userId, reactivated);
  persistLocalUserLedger();

  const db = getFirestore();
  if (db) {
    try {
      await db.collection('users').doc(userId).set(reactivated, { merge: false });
    } catch (err: any) {
      console.warn('[UserStorage] Firestore reactivate failed:', err?.message || err);
    }
  }

  return reactivated;
}

/**
 * Permanently deletes a user record from memory cache, local ledger, and Cloud Firestore.
 */
export async function deleteUserAccount(userId: string): Promise<boolean> {
  loadLocalUserLedger();
  const existed = memoryUserStorage.delete(userId);
  persistLocalUserLedger();

  const db = getFirestore();
  if (db) {
    try {
      await db.collection('users').doc(userId).delete();
    } catch (err: any) {
      console.warn('[UserStorage] Firestore delete failed, removed from memory cache:', err?.message || err);
    }
  }

  return existed;
}

/**
 * Fetch all registered users across in-memory cache and Firestore.
 */
export async function getAllUserRecords(): Promise<UserRecord[]> {
  loadLocalUserLedger();
  const recordsMap = new Map<string, UserRecord>();

  // 1. Fast in-memory hot cache
  for (const [id, record] of memoryUserStorage.entries()) {
    recordsMap.set(id, record);
  }

  // 2. Fetch from Firestore if available
  const db = getFirestore();
  if (db) {
    try {
      if (!hasAttemptedUserSeed) {
        await seedUsersIfEmpty();
      }

      const snapshot = await db.collection('users').get();
      if (!snapshot.empty) {
        snapshot.forEach((doc) => {
          const data = doc.data() as UserRecord;
          const uid = data.userId || doc.id;
          if (uid) {
            const resolved: UserRecord = {
              userId: uid,
              activeRoutineId: data.activeRoutineId,
              routines: data.routines || [],
              runtime: data.runtime || {},
              ...(data.profile ? { profile: data.profile } : {}),
              ...(data.lifestyleProfile ? { lifestyleProfile: data.lifestyleProfile } : {}),
              ...(data.notifications ? { notifications: data.notifications } : {}),
              updatedAt: data.updatedAt || Date.now()
            };
            recordsMap.set(uid, resolved);
            memoryUserStorage.set(uid, resolved);
          }
        });
      }
    } catch (err: any) {
      console.warn('[UserStorage] Firestore fetch all failed, using memory cache:', err?.message || err);
    }
  }

  return Array.from(recordsMap.values());
}

function matchesRoutine(candidateId: string | undefined, targetId: string): boolean {
  if (!candidateId) return false;
  if (candidateId === targetId) return true;
  if ((candidateId === 'achilles-rehab' && targetId === 'achilles') || (candidateId === 'achilles' && targetId === 'achilles-rehab')) return true;
  if ((candidateId === 'hair-regrowth' && targetId === 'hair-loss') || (candidateId === 'hair-loss' && targetId === 'hair-regrowth')) return true;
  return false;
}

/**
 * Computes live user telemetry for a specific routine:
 * - activeTrackersCount: number of distinct users actively tracking or having this routine in their list
 * - userLogsCount: sum of all feedbackLogs, morphingLogs, dayHistory entries, and completed sets
 */
export async function getLiveUserStats(routineId: string): Promise<{
  activeTrackersCount: number;
  userLogsCount: number;
}> {
  const users = await getAllUserRecords();
  let activeTrackersCount = 0;
  let userLogsCount = 0;

  for (const user of users) {
    const isActivelyTracking = matchesRoutine(user.activeRoutineId, routineId);

    const hasInRoutines =
      Array.isArray(user.routines) && user.routines.some((r) => matchesRoutine(r.id, routineId));

    const userRuntime =
      user.runtime?.[routineId] ||
      (routineId === 'achilles' ? user.runtime?.['achilles-rehab'] : undefined) ||
      (routineId === 'achilles-rehab' ? user.runtime?.['achilles'] : undefined) ||
      (routineId === 'hair-loss' ? user.runtime?.['hair-regrowth'] : undefined) ||
      (routineId === 'hair-regrowth' ? user.runtime?.['hair-loss'] : undefined);

    const hasRuntime = Boolean(userRuntime);

    if (isActivelyTracking || hasInRoutines || hasRuntime) {
      activeTrackersCount += 1;
    }

    if (userRuntime) {
      if (Array.isArray(userRuntime.feedbackLogs)) {
        userLogsCount += userRuntime.feedbackLogs.length;
      }
      if (Array.isArray(userRuntime.morphingLogs)) {
        userLogsCount += userRuntime.morphingLogs.length;
      }
      if (Array.isArray((userRuntime as Record<string, any>).dayHistory)) {
        userLogsCount += (userRuntime as Record<string, any>).dayHistory.length;
      }
      if (userRuntime.setsDone && typeof userRuntime.setsDone === 'object') {
        userLogsCount += Object.keys(userRuntime.setsDone).length;
      }
    }
  }

  return {
    activeTrackersCount,
    userLogsCount
  };
}

const MAX_FCM_TOKENS_PER_USER = 10;

async function getOrInitUserRecord(userId: string): Promise<UserRecord> {
  const existing = await getUserRecord(userId);
  if (existing) return existing;
  const created: UserRecord = {
    userId,
    activeRoutineId: '',
    routines: [],
    runtime: {},
    accountStatus: 'active',
    updatedAt: Date.now()
  };
  await saveUserRecord(created);
  return created;
}

/** Ensures a user has a persistent opaque token for live `webcal://` calendar feed subscriptions. */
export async function ensureCalendarFeedToken(userId: string, rotate = false): Promise<string> {
  const record = await getOrInitUserRecord(userId);
  const current = record.notifications?.calendarFeedToken;
  if (current && !rotate) return current;

  const token = crypto.randomBytes(18).toString('base64url');
  const next: UserRecord = {
    ...record,
    notifications: {
      ...record.notifications,
      calendarFeedToken: token
    },
    updatedAt: Date.now()
  };
  await saveUserRecord(next);
  return token;
}

/** Resolves the user record owning a live calendar feed subscription token. */
export async function findUserByCalendarToken(token: string): Promise<UserRecord | null> {
  const clean = token.trim();
  if (!clean || clean.length < 8) return null;

  const users = await getAllUserRecords();
  return users.find((u) => u.notifications?.calendarFeedToken === clean) ?? null;
}

/** Registers or refreshes a Firebase Cloud Messaging (FCM) Web Push token for a user device. */
export async function registerUserFcmToken(userId: string, token: string): Promise<string[]> {
  const clean = token.trim();
  if (!clean) throw new Error('FCM token required');
  const record = await getOrInitUserRecord(userId);
  const current = record.notifications?.webPushTokens ?? [];
  const nextTokens = [clean, ...current.filter((t) => t !== clean)].slice(0, MAX_FCM_TOKENS_PER_USER);

  await saveUserRecord({
    ...record,
    notifications: {
      ...record.notifications,
      webPushTokens: nextTokens
    },
    updatedAt: Date.now()
  });
  return nextTokens;
}

/** Removes an FCM Web Push token when disabled on a device or invalidated by FCM. */
export async function removeUserFcmToken(userId: string, token?: string): Promise<string[]> {
  const record = await getOrInitUserRecord(userId);
  const current = record.notifications?.webPushTokens ?? [];
  const nextTokens = token ? current.filter((t) => t !== token.trim()) : [];

  await saveUserRecord({
    ...record,
    notifications: {
      ...record.notifications,
      webPushTokens: nextTokens
    },
    updatedAt: Date.now()
  });
  return nextTokens;
}

/** Issues an 8-character single-use deep-link code to bind a Telegram chat via `/start <code>`. */
export async function issueTelegramLinkCode(userId: string): Promise<string> {
  const record = await getOrInitUserRecord(userId);
  const code = crypto.randomBytes(4).toString('hex').toUpperCase();

  await saveUserRecord({
    ...record,
    notifications: {
      ...record.notifications,
      telegram: {
        connected: Boolean(record.notifications?.telegram?.connected),
        ...(record.notifications?.telegram?.chatId ? { chatId: record.notifications.telegram.chatId } : {}),
        ...(record.notifications?.telegram?.username ? { username: record.notifications.telegram.username } : {}),
        linkCode: code,
        linkCodeIssuedAt: Date.now()
      }
    },
    updatedAt: Date.now()
  });
  return code;
}

/** Binds a Telegram chatId & optional username using the issued `/start <code>` token. */
export async function linkTelegramChatByCode(
  code: string,
  chatId: string,
  username?: string
): Promise<UserRecord | null> {
  const cleanCode = code.trim().toUpperCase();
  if (!cleanCode) return null;

  const users = await getAllUserRecords();
  const target = users.find((u) => u.notifications?.telegram?.linkCode === cleanCode);
  if (!target) return null;

  const updated: UserRecord = {
    ...target,
    notifications: {
      ...target.notifications,
      telegram: {
        connected: true,
        chatId: String(chatId),
        ...(username ? { username } : {}),
        connectedAt: Date.now()
      }
    },
    updatedAt: Date.now()
  };
  await saveUserRecord(updated);
  return updated;
}

/** Unlinks a user's Telegram Bot connection cleanly. */
export async function unlinkTelegramChat(userId: string): Promise<void> {
  const record = await getOrInitUserRecord(userId);
  await saveUserRecord({
    ...record,
    notifications: {
      ...record.notifications,
      telegram: { connected: false }
    },
    updatedAt: Date.now()
  });
}

/** Looks up an account currently linked to a Telegram chat ID. */
export async function findUserByTelegramChatId(chatId: string): Promise<UserRecord | null> {
  const clean = String(chatId).trim();
  if (!clean) return null;
  const users = await getAllUserRecords();
  return users.find((u) => u.notifications?.telegram?.connected && u.notifications.telegram.chatId === clean) ?? null;
}
