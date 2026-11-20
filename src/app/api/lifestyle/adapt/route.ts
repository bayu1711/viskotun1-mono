import { NextResponse } from 'next/server';
import { getRequestUser } from '../../../../server/auth';
import { enforceRateLimit } from '../../../../server/rateLimit';
import { generateLifestyleAdaptation } from '@/server/lifestyleEngine';
import type { UserLifestyleProfile, UserProfile } from '@/types/auth';
import type { Routine } from '@/types/routine';
import type { RoutineSchedulePreference } from '@/types/schedule';

/** A routine plus profile is a few KB; anything far larger is not a real client request. */
const MAX_BODY_CHARS = 200_000;

export async function POST(request: Request) {
  const user = await getRequestUser(request);
  const limited = enforceRateLimit('lifestyle', request, user);
  if (limited) return limited;

  try {
    const raw = await request.text().catch(() => '');
    if (raw.length > MAX_BODY_CHARS) {
      return NextResponse.json({ error: 'Request is too large' }, { status: 413 });
    }
    let body: Record<string, unknown> | null = null;
    try {
      body = raw ? JSON.parse(raw) : null;
    } catch {
      body = null;
    }
    if (!body) {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    const {
      userProfile,
      lifestyleProfile,
      routine,
      routineSchedule
    }: {
      userProfile?: UserProfile;
      lifestyleProfile?: Partial<UserLifestyleProfile>;
      routine?: Routine | null;
      routineSchedule?: RoutineSchedulePreference;
    } = body;

    const adaptation = await generateLifestyleAdaptation({
      userProfile,
      lifestyleProfile,
      routine,
      routineSchedule
    });

    return NextResponse.json({ adaptation });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to adapt lifestyle';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
