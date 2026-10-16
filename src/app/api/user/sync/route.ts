import { NextResponse } from 'next/server';
import type { Routine, RoutineRuntime, Protocol, ProtocolRuntime } from '../../../../types/routine';
import { getFirestore } from '../../../../server/guardrailLedger';
import { saveCanonicalRoutine } from '../../../../server/routineRegistry';
import { COPY } from '../../../../data/copy';

interface UserSyncPayload {
  userId: string;
  activeRoutineId?: string;
  activeProtocolId?: string;
  routines?: Routine[];
  protocols?: Protocol[];
  runtime: Record<string, RoutineRuntime>;
}

// In-memory server-side user store with fail-safe fallback
const userStorage = new Map<
  string,
  {
    activeRoutineId?: string;
    activeProtocolId?: string;
    routines: Routine[];
    protocols: Protocol[];
    runtime: Record<string, RoutineRuntime>;
    updatedAt: number;
  }
>();

export async function POST(request: Request) {
  try {
    const body: UserSyncPayload = await request.json();
    const { userId, activeRoutineId, activeProtocolId, routines, protocols, runtime } = body;

    if (!userId) {
      return NextResponse.json({ error: COPY.api.userSync.userIdRequired }, { status: 400 });
    }

    const resolvedActiveId = activeRoutineId || activeProtocolId;
    const resolvedRoutines = routines || protocols || [];

    const payload = {
      activeRoutineId: resolvedActiveId,
      activeProtocolId: resolvedActiveId,
      routines: resolvedRoutines,
      protocols: resolvedRoutines,
      runtime: runtime || {},
      updatedAt: Date.now()
    };

    userStorage.set(userId, payload);

    const db = getFirestore();
    if (db) {
      try {
        await db.collection('users').doc(userId).set(payload, { merge: true });

        // Ensure each routine is registered canonically in Firestore
        if (resolvedRoutines.length > 0) {
          for (const routine of resolvedRoutines) {
            await saveCanonicalRoutine(routine).catch(() => {});
          }
        }
      } catch (firestoreErr: any) {
        console.warn('[UserSyncRoute] Could not persist to Firestore, stored in memory cache:', firestoreErr?.message || firestoreErr);
      }
    }

    return NextResponse.json({
      success: true,
      syncedAt: Date.now(),
      routineCount: resolvedRoutines.length,
      protocolCount: resolvedRoutines.length
    });
  } catch (error) {
    console.error('User sync error:', error);
    return NextResponse.json({ error: COPY.api.userSync.internalError }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: COPY.api.userSync.userIdRequired }, { status: 400 });
    }

    const db = getFirestore();
    if (db) {
      try {
        const doc = await db.collection('users').doc(userId).get();
        if (doc.exists) {
          const data = doc.data();
          if (data) {
            const resolvedActiveId = data.activeRoutineId || data.activeProtocolId;
            const resolvedRoutines = data.routines || data.protocols || [];
            return NextResponse.json({
              found: true,
              activeRoutineId: resolvedActiveId,
              activeProtocolId: resolvedActiveId,
              routines: resolvedRoutines,
              protocols: resolvedRoutines,
              runtime: data.runtime,
              updatedAt: data.updatedAt
            });
          }
        }
      } catch (firestoreErr: any) {
        console.warn('[UserSyncRoute] Could not read from Firestore, falling back to memory cache:', firestoreErr?.message || firestoreErr);
      }
    }

    const data = userStorage.get(userId);
    if (!data) {
      return NextResponse.json({
        found: false,
        routines: [],
        protocols: [],
        runtime: {}
      });
    }

    return NextResponse.json({
      found: true,
      activeRoutineId: data.activeRoutineId || data.activeProtocolId,
      activeProtocolId: data.activeRoutineId || data.activeProtocolId,
      routines: data.routines || data.protocols,
      protocols: data.routines || data.protocols,
      runtime: data.runtime,
      updatedAt: data.updatedAt
    });
  } catch (error) {
    console.error('User sync fetch error:', error);
    return NextResponse.json({ error: COPY.api.userSync.fetchError }, { status: 500 });
  }
}
