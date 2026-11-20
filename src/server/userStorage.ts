/**
 * Google Cloud Firestore user storage and live community telemetry.
 *
 * Holds each user's routines, runtime logs and profile. Community counts are computed
 * from real user records only: example participants are never counted.
 *
 * Memory and local-file fallbacks exist for local development. In production a failed
 * write throws (see persistence.ts) instead of silently living in one instance's memory.
 */

import fs from 'fs';
import path from 'path';
import { getFirestore } from './guardrailLedger';
import { assertDurableWrite, isMemoryFallbackAllowed } from './persistence';
import { logWarning } from './log';
import type { UserLifestyleProfile, UserProfile } from '../types/auth';
import type { Routine, RoutineRuntime } from '../types/routine';

export interface UserRecord {
  userId: string;
  activeRoutineId?: string;
  routines: Routine[];
  runtime: Record<string, RoutineRuntime>;
  profile?: UserProfile;
  lifestyleProfile?: UserLifestyleProfile;
  accountStatus?: 'active' | 'deactivated';
  deactivatedAt?: number;
  updatedAt: number;
}

const USERS_COLLECTION = 'users';

/**
 * Example participants that earlier builds seeded into memory and Firestore.
 * They are not real people, so they are excluded from every community count.
 */
export const LEGACY_SAMPLE_USER_IDS = new Set([
  'user-ach-runner-41m',
  'user-ach-desk-33f',
  'user-ach-bball-29m',
  'user-ach-hiker-52f',
  'user-hair-norwood-31m',
  'user-hair-diffuse-44m',
  'user-hair-temples-27m',
  'user-hair-female-38f',
  'user-cr-shift-28m',
  'user-cr-clin-34f'
]);

const IS_TEST = process.env.NODE_ENV === 'test' || Boolean(process.env.VITEST);
const LOCAL_STORAGE_FILE = path.join(process.cwd(), '.viskotun1_users.local.json');
const STATS_CACHE_TTL_MS = 60_000;

/** Local-development store. Never the source of truth in production. */
export const memoryUserStorage = new Map<string, UserRecord>();

function canUseLocalLedger(): boolean {
  return !IS_TEST && process.env.NODE_ENV !== 'production';
}

function loadLocalUserLedger(): void {
  if (!canUseLocalLedger()) return;
  try {
    if (fs.existsSync(LOCAL_STORAGE_FILE)) {
      const records = JSON.parse(fs.readFileSync(LOCAL_STORAGE_FILE, 'utf-8'));
      if (Array.isArray(records)) {
        for (const record of records) {
          if (record?.userId && !LEGACY_SAMPLE_USER_IDS.has(record.userId)) {
            memoryUserStorage.set(record.userId, record);
          }
        }
      }
    }
  } catch {
    // A corrupt local ledger only affects local development
  }
}

function persistLocalUserLedger(): void {
  if (!canUseLocalLedger()) return;
  try {
    fs.writeFileSync(LOCAL_STORAGE_FILE, JSON.stringify(Array.from(memoryUserStorage.values()), null, 2), 'utf-8');
  } catch {
    // Read-only file systems are fine in development
  }
}

loadLocalUserLedger();

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

function rememberLocally(record: UserRecord): void {
  if (!isMemoryFallbackAllowed()) return;
  memoryUserStorage.set(record.userId, record);
  persistLocalUserLedger();
}

function forgetLocally(userId: string): boolean {
  const existed = memoryUserStorage.delete(userId);
  persistLocalUserLedger();
  return existed;
}

function normalizeRecord(userId: string, data: Partial<UserRecord>): UserRecord {
  return {
    userId,
    activeRoutineId: data.activeRoutineId,
    routines: data.routines || [],
    runtime: data.runtime || {},
    ...(data.profile ? { profile: data.profile } : {}),
    ...(data.lifestyleProfile ? { lifestyleProfile: data.lifestyleProfile } : {}),
    ...(data.accountStatus ? { accountStatus: data.accountStatus } : {}),
    ...(data.deactivatedAt ? { deactivatedAt: data.deactivatedAt } : {}),
    updatedAt: data.updatedAt || 0
  };
}

/**
 * Retrieve a user record by ID from Cloud Firestore, or the local-development store.
 */
export async function getUserRecord(userId: string): Promise<UserRecord | null> {
  const db = getFirestore();
  if (db) {
    try {
      const doc = await db.collection(USERS_COLLECTION).doc(userId).get();
      if (!doc.exists) return null;
      return normalizeRecord(userId, (doc.data() as UserRecord) || {});
    } catch (err) {
      if (!isMemoryFallbackAllowed()) throw err;
      logWarning('[UserStorage] Firestore read failed, using local store', { error: errorMessage(err) });
    }
  }

  if (!isMemoryFallbackAllowed()) return null;
  return memoryUserStorage.get(userId) || null;
}

async function writeRecord(record: UserRecord, merge: boolean): Promise<void> {
  rememberLocally(record);
  invalidateUserStatsCache();

  const db = getFirestore();
  if (!db) {
    assertDurableWrite('Firestore');
    return;
  }
  try {
    await db.collection(USERS_COLLECTION).doc(record.userId).set(record, { merge });
  } catch (err) {
    assertDurableWrite('Firestore', err);
    logWarning('[UserStorage] Firestore write failed, kept in local store', { error: errorMessage(err) });
  }
}

/**
 * Persist a full user record (routines and runtime are replaced, not merged).
 */
export async function saveUserRecord(record: UserRecord): Promise<void> {
  await writeRecord(record, false);
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
  await writeRecord(cleared, false);
  return cleared;
}

/**
 * Temporarily pauses/deactivates a user account while preserving their stored routines and logs.
 */
export async function deactivateUserAccount(userId: string): Promise<UserRecord> {
  const existing = await getUserRecord(userId);
  const deactivated: UserRecord = {
    ...normalizeRecord(userId, existing ?? {}),
    accountStatus: 'deactivated',
    deactivatedAt: Date.now(),
    updatedAt: Date.now()
  };
  await writeRecord(deactivated, false);
  return deactivated;
}

/**
 * Reactivates a previously deactivated user account upon sign-in.
 */
export async function reactivateUserAccount(userId: string): Promise<UserRecord | null> {
  const existing = await getUserRecord(userId);
  if (!existing) return null;
  if (existing.accountStatus !== 'deactivated') return existing;

  const reactivated: UserRecord = { ...existing, accountStatus: 'active', updatedAt: Date.now() };
  delete reactivated.deactivatedAt;
  await writeRecord(reactivated, false);
  return reactivated;
}

/**
 * Permanently deletes a user record from Cloud Firestore and the local-development store.
 */
export async function deleteUserAccount(userId: string): Promise<boolean> {
  const existedLocally = forgetLocally(userId);
  invalidateUserStatsCache();

  const db = getFirestore();
  if (!db) {
    assertDurableWrite('Firestore');
    return existedLocally;
  }
  try {
    const ref = db.collection(USERS_COLLECTION).doc(userId);
    const snapshot = await ref.get();
    await ref.delete();
    return snapshot.exists || existedLocally;
  } catch (err) {
    assertDurableWrite('Firestore', err);
    logWarning('[UserStorage] Firestore delete failed, removed from local store', { error: errorMessage(err) });
    return existedLocally;
  }
}

/**
 * Fetch all real user records (example participants excluded).
 */
export async function getAllUserRecords(): Promise<UserRecord[]> {
  const recordsMap = new Map<string, UserRecord>();

  if (isMemoryFallbackAllowed()) {
    loadLocalUserLedger();
    for (const [id, record] of memoryUserStorage.entries()) {
      recordsMap.set(id, record);
    }
  }

  const db = getFirestore();
  if (db) {
    try {
      const snapshot = await db.collection(USERS_COLLECTION).get();
      snapshot.forEach((doc) => {
        const data = doc.data() as UserRecord;
        const uid = data.userId || doc.id;
        if (uid) recordsMap.set(uid, normalizeRecord(uid, data));
      });
    } catch (err) {
      logWarning('[UserStorage] Firestore fetch all failed', { error: errorMessage(err) });
    }
  }

  for (const sampleId of LEGACY_SAMPLE_USER_IDS) {
    recordsMap.delete(sampleId);
  }
  return Array.from(recordsMap.values());
}

const ROUTINE_ALIASES: Record<string, string> = {
  'achilles-rehab': 'achilles',
  'hair-regrowth': 'hair-loss'
};

function canonicalStatsId(routineId: string): string {
  return ROUTINE_ALIASES[routineId] || routineId;
}

export interface RoutineUserStats {
  activeTrackersCount: number;
  userLogsCount: number;
}

function countRuntimeLogs(runtime: RoutineRuntime | undefined): number {
  if (!runtime) return 0;
  let count = 0;
  if (Array.isArray(runtime.feedbackLogs)) count += runtime.feedbackLogs.length;
  if (Array.isArray(runtime.morphingLogs)) count += runtime.morphingLogs.length;
  const dayHistory = (runtime as { dayHistory?: unknown }).dayHistory;
  if (Array.isArray(dayHistory)) count += dayHistory.length;
  if (runtime.setsDone && typeof runtime.setsDone === 'object') count += Object.keys(runtime.setsDone).length;
  return count;
}

/** Aggregates tracker and log counts for every routine in one pass over the user records. */
export function computeRoutineUserStats(users: UserRecord[]): Map<string, RoutineUserStats> {
  const stats = new Map<string, RoutineUserStats>();

  for (const user of users) {
    const routineIds = new Set<string>();
    if (user.activeRoutineId) routineIds.add(canonicalStatsId(user.activeRoutineId));
    for (const routine of Array.isArray(user.routines) ? user.routines : []) {
      if (routine?.id) routineIds.add(canonicalStatsId(routine.id));
    }

    const logsByRoutine = new Map<string, number>();
    for (const [routineId, runtime] of Object.entries(user.runtime || {})) {
      const id = canonicalStatsId(routineId);
      routineIds.add(id);
      logsByRoutine.set(id, (logsByRoutine.get(id) ?? 0) + countRuntimeLogs(runtime));
    }

    for (const id of routineIds) {
      const entry = stats.get(id) ?? { activeTrackersCount: 0, userLogsCount: 0 };
      entry.activeTrackersCount += 1;
      entry.userLogsCount += logsByRoutine.get(id) ?? 0;
      stats.set(id, entry);
    }
  }

  return stats;
}

let statsCache: { expiresAt: number; stats: Map<string, RoutineUserStats> } | null = null;
let statsInFlight: Promise<Map<string, RoutineUserStats>> | null = null;

export function invalidateUserStatsCache(): void {
  statsCache = null;
}

async function getAllRoutineStats(): Promise<Map<string, RoutineUserStats>> {
  if (statsCache && statsCache.expiresAt > Date.now()) return statsCache.stats;
  if (statsInFlight) return statsInFlight;

  statsInFlight = getAllUserRecords()
    .then((users) => {
      const stats = computeRoutineUserStats(users);
      statsCache = { expiresAt: Date.now() + STATS_CACHE_TTL_MS, stats };
      return stats;
    })
    .finally(() => {
      statsInFlight = null;
    });
  return statsInFlight;
}

/**
 * Live user telemetry for a routine, from a cached aggregate refreshed at most once a minute
 * per instance (instead of reading every user document on every request).
 */
export async function getLiveUserStats(routineId: string): Promise<RoutineUserStats> {
  const stats = await getAllRoutineStats();
  return stats.get(canonicalStatsId(routineId)) ?? { activeTrackersCount: 0, userLogsCount: 0 };
}
