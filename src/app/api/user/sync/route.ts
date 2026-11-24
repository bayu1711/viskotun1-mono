import { NextResponse } from 'next/server';
import type { UserLifestyleProfile, UserProfile } from '../../../../types/auth';
import type { Routine, RoutineRuntime } from '../../../../types/routine';
import { getUserRecord, saveUserRecord, type UserRecord } from '../../../../server/userStorage';
import { getRequestUser } from '../../../../server/auth';
import { COPY } from '../../../../data/copy';

export const dynamic = 'force-dynamic';

const MAX_ROUTINES = 50;

interface UserSyncPayload {
  userId?: string;
  activeRoutineId?: string;
  routines?: Routine[];
  runtime?: Record<string, RoutineRuntime>;
  profile?: UserProfile;
  lifestyleProfile?: UserLifestyleProfile;
  /**
   * The `updatedAt` of the server record this client last saw. When the server copy is
   * newer, the write is rejected with 409 so the client can merge instead of overwriting.
   */
  baseUpdatedAt?: number;
}

function toClientRecord(record: UserRecord) {
  return {
    activeRoutineId: record.activeRoutineId,
    routines: record.routines || [],
    runtime: record.runtime || {},
    ...(record.profile ? { profile: record.profile } : {}),
    ...(record.lifestyleProfile ? { lifestyleProfile: record.lifestyleProfile } : {}),
    updatedAt: record.updatedAt
  };
}

export async function POST(request: Request) {
  try {
    const user = await getRequestUser(request);
    const body: UserSyncPayload = await request.json();
    const userId = user?.uid || body.userId;

    if (!userId) {
      return NextResponse.json({ error: COPY.api.userSync.userIdRequired }, { status: 400 });
    }

    const existing = await getUserRecord(userId);
    if (
      existing &&
      typeof body.baseUpdatedAt === 'number' &&
      existing.updatedAt > body.baseUpdatedAt
    ) {
      return NextResponse.json(
        { error: 'Conflict with remote updates', code: 'conflict', current: toClientRecord(existing) },
        { status: 409 }
      );
    }

    const resolvedRoutines = (body.routines || []).slice(0, MAX_ROUTINES);
    const updatedAt = Math.max(Date.now(), (existing?.updatedAt ?? 0) + 1);
    const profile = body.profile ?? existing?.profile;
    const lifestyleProfile = body.lifestyleProfile ?? existing?.lifestyleProfile;

    const payload: UserRecord = {
      userId,
      activeRoutineId: typeof body.activeRoutineId === 'string' ? body.activeRoutineId : '',
      routines: resolvedRoutines,
      runtime: body.runtime || {},
      ...(profile ? { profile } : {}),
      ...(lifestyleProfile ? { lifestyleProfile } : {}),
      ...(existing?.notifications ? { notifications: existing.notifications } : {}),
      accountStatus: existing?.accountStatus ?? 'active',
      ...(existing?.deactivatedAt ? { deactivatedAt: existing.deactivatedAt } : {}),
      updatedAt
    };

    await saveUserRecord(payload);

    return NextResponse.json({
      success: true,
      syncedAt: updatedAt,
      updatedAt,
      routineCount: resolvedRoutines.length
    });
  } catch (error) {
    console.error('User sync error:', error);
    return NextResponse.json({ error: COPY.api.userSync.internalError }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const user = await getRequestUser(request);
    const { searchParams } = new URL(request.url);
    const userId = user?.uid || searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: COPY.api.userSync.userIdRequired }, { status: 400 });
    }

    const record = await getUserRecord(userId);
    if (!record) {
      return NextResponse.json({ found: false, routines: [], runtime: {}, updatedAt: 0 });
    }

    return NextResponse.json({
      found: true,
      ...toClientRecord(record)
    });
  } catch (error) {
    console.error('User sync fetch error:', error);
    return NextResponse.json({ error: COPY.api.userSync.fetchError }, { status: 500 });
  }
}
