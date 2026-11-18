import { NextResponse } from 'next/server';
import type { Routine, RoutineRuntime } from '../../../../types/routine';
import { saveCanonicalRoutine } from '../../../../server/routineRegistry';
import { getUserRecord, saveUserRecord, type UserRecord } from '../../../../server/userStorage';
import { COPY } from '../../../../data/copy';

interface UserSyncPayload {
  userId: string;
  activeRoutineId?: string;
  routines?: Routine[];
  runtime: Record<string, RoutineRuntime>;
}

export async function POST(request: Request) {
  try {
    const body: UserSyncPayload = await request.json();
    const { userId, activeRoutineId, routines, runtime } = body;

    if (!userId) {
      return NextResponse.json({ error: COPY.api.userSync.userIdRequired }, { status: 400 });
    }

    const resolvedRoutines = routines || [];

    const payload: UserRecord = {
      userId,
      activeRoutineId,
      routines: resolvedRoutines,
      runtime: runtime || {},
      updatedAt: Date.now()
    };

    await saveUserRecord(payload);

    // Ensure each routine is registered canonically in Firestore
    if (resolvedRoutines.length > 0) {
      for (const routine of resolvedRoutines) {
        await saveCanonicalRoutine(routine).catch(() => {});
      }
    }

    return NextResponse.json({
      success: true,
      syncedAt: Date.now(),
      routineCount: resolvedRoutines.length
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

    const record = await getUserRecord(userId);
    if (!record) {
      return NextResponse.json({
        found: false,
        routines: [],
        runtime: {}
      });
    }

    return NextResponse.json({
      found: true,
      activeRoutineId: record.activeRoutineId,
      routines: record.routines || [],
      runtime: record.runtime,
      updatedAt: record.updatedAt
    });
  } catch (error) {
    console.error('User sync fetch error:', error);
    return NextResponse.json({ error: COPY.api.userSync.fetchError }, { status: 500 });
  }
}
