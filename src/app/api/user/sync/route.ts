import { NextResponse } from 'next/server';
import type { UserLifestyleProfile, UserProfile } from '../../../../types/auth';
import type { Routine, RoutineRuntime } from '../../../../types/routine';
import { getUserRecord, saveUserRecord, type UserRecord } from '../../../../server/userStorage';
import { requireUser } from '../../../../server/auth';
import { errorResponse, readJsonBody } from '../../../../server/http';
import { COPY } from '../../../../data/copy';

export const dynamic = 'force-dynamic';

const MAX_ROUTINES = 50;

interface UserSyncPayload {
  activeRoutineId?: string;
  routines?: Routine[];
  runtime?: Record<string, RoutineRuntime>;
  profile?: UserProfile;
  lifestyleProfile?: UserLifestyleProfile;
  /**
   * The `updatedAt` of the server record this client last saw. When the server copy is
   * newer, the write is rejected with 409 so the client can merge instead of overwriting.
   * Omit it only for an intentional reset.
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

/**
 * POST: Save the signed-in user's routines, runtime and profile.
 * The user is taken from the verified ID token; a `userId` in the body is ignored.
 * Routines saved here stay private to this user and never become shared canonical routines.
 */
export async function POST(request: Request) {
  const auth = await requireUser(request);
  if (auth instanceof Response) return auth;

  try {
    const body = await readJsonBody<UserSyncPayload>(request);
    if (!body) {
      return NextResponse.json({ error: COPY.api.assistant.invalidJson }, { status: 400 });
    }

    const routines = Array.isArray(body.routines) ? body.routines.slice(0, MAX_ROUTINES) : [];
    const runtime = body.runtime && typeof body.runtime === 'object' ? body.runtime : {};

    const existing = await getUserRecord(auth.uid);
    if (
      existing &&
      typeof body.baseUpdatedAt === 'number' &&
      existing.updatedAt > body.baseUpdatedAt
    ) {
      return NextResponse.json(
        { error: COPY.api.userSync.conflict, code: 'conflict', current: toClientRecord(existing) },
        { status: 409 }
      );
    }

    const updatedAt = Math.max(Date.now(), (existing?.updatedAt ?? 0) + 1);
    const profile = body.profile ?? existing?.profile;
    const lifestyleProfile = body.lifestyleProfile ?? existing?.lifestyleProfile;
    const record: UserRecord = {
      userId: auth.uid,
      activeRoutineId: typeof body.activeRoutineId === 'string' ? body.activeRoutineId : '',
      routines,
      runtime,
      ...(profile ? { profile } : {}),
      ...(lifestyleProfile ? { lifestyleProfile } : {}),
      accountStatus: existing?.accountStatus ?? 'active',
      ...(existing?.deactivatedAt ? { deactivatedAt: existing.deactivatedAt } : {}),
      updatedAt
    };

    await saveUserRecord(record);

    return NextResponse.json({
      success: true,
      syncedAt: updatedAt,
      updatedAt,
      routineCount: routines.length
    });
  } catch (error) {
    return errorResponse('UserSyncRoute.POST', error, COPY.api.userSync.internalError);
  }
}

/** GET: Load the signed-in user's saved state. */
export async function GET(request: Request) {
  const auth = await requireUser(request);
  if (auth instanceof Response) return auth;

  try {
    const record = await getUserRecord(auth.uid);
    if (!record) {
      return NextResponse.json({ found: false, routines: [], runtime: {}, updatedAt: 0 });
    }
    return NextResponse.json({ found: true, ...toClientRecord(record) });
  } catch (error) {
    return errorResponse('UserSyncRoute.GET', error, COPY.api.userSync.fetchError);
  }
}
