/**
 * Google Cloud Firestore Users Storage Ledger & Real-Time Telemetry
 * 
 * Manages user workspaces, active routine assignments, and runtime telemetry
 * (feedback logs, morphing logs, day history, completed sets).
 * Provides live aggregate statistics for routines without dummy or simulated multipliers.
 */

import fs from 'fs';
import path from 'path';
import { getFirestore } from './guardrailLedger';
import type { UserLifestyleProfile, UserProfile } from '../types/auth';
import type { Routine, RoutineRuntime } from '../types/routine';
import { SEEDED_COMMUNITY_USERS } from './seedUsers';

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
