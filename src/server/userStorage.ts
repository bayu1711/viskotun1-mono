/**
 * Google Cloud Firestore Users Storage Ledger & Real-Time Telemetry
 * 
 * Manages user workspaces, active routine assignments, and runtime telemetry
 * (feedback logs, morphing logs, day history, completed sets).
 * Provides live aggregate statistics for protocols without dummy or simulated multipliers.
 */

import { getFirestore } from './guardrailLedger';
import type { Routine, RoutineRuntime, Protocol } from '../types/routine';

export interface UserRecord {
  userId: string;
  activeRoutineId?: string;
  activeProtocolId?: string;
  routines: Routine[];
  protocols: Protocol[];
  runtime: Record<string, RoutineRuntime>;
  updatedAt: number;
}

// In-memory server-side user store with fail-safe fallback
export const memoryUserStorage = new Map<string, UserRecord>();

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
            activeRoutineId: data.activeRoutineId || data.activeProtocolId,
            activeProtocolId: data.activeRoutineId || data.activeProtocolId,
            routines: data.routines || data.protocols || [],
            protocols: data.routines || data.protocols || [],
            runtime: data.runtime || {},
            updatedAt: data.updatedAt || Date.now()
          };
          memoryUserStorage.set(userId, resolved);
          return resolved;
        }
      }
    } catch (err: any) {
      console.warn('[UserStorage] Firestore read failed, falling back to memory:', err?.message || err);
    }
  }
  return memoryUserStorage.get(userId) || null;
}

/**
 * Persist a user record to both memory cache and Cloud Firestore.
 */
export async function saveUserRecord(record: UserRecord): Promise<void> {
  memoryUserStorage.set(record.userId, record);
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
 * Fetch all registered users across in-memory cache and Firestore.
 */
export async function getAllUserRecords(): Promise<UserRecord[]> {
  const recordsMap = new Map<string, UserRecord>();

  // 1. Fast in-memory hot cache
  for (const [id, record] of memoryUserStorage.entries()) {
    recordsMap.set(id, record);
  }

  // 2. Fetch from Firestore if available
  const db = getFirestore();
  if (db) {
    try {
      const snapshot = await db.collection('users').get();
      if (!snapshot.empty) {
        snapshot.forEach((doc) => {
          const data = doc.data() as UserRecord;
          const uid = data.userId || doc.id;
          if (uid) {
            const resolved: UserRecord = {
              userId: uid,
              activeRoutineId: data.activeRoutineId || data.activeProtocolId,
              activeProtocolId: data.activeRoutineId || data.activeProtocolId,
              routines: data.routines || data.protocols || [],
              protocols: data.routines || data.protocols || [],
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

/**
 * Computes live user telemetry for a specific protocol or routine ID:
 * - activeTrackersCount: number of distinct users actively tracking or having this protocol in their routine list
 * - userLogsCount: sum of all feedbackLogs, morphingLogs, dayHistory entries, and completed sets
 */
export async function getLiveUserStats(protocolId: string): Promise<{
  activeTrackersCount: number;
  userLogsCount: number;
}> {
  const users = await getAllUserRecords();
  let activeTrackersCount = 0;
  let userLogsCount = 0;

  for (const user of users) {
    const isActivelyTracking =
      user.activeRoutineId === protocolId ||
      user.activeProtocolId === protocolId;

    const hasInRoutines =
      (Array.isArray(user.routines) && user.routines.some((r) => r.id === protocolId)) ||
      (Array.isArray(user.protocols) && user.protocols.some((p) => p.id === protocolId));

    const userRuntime = user.runtime?.[protocolId];
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
