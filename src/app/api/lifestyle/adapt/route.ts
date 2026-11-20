import { NextResponse } from 'next/server';
import { generateLifestyleAdaptation } from '@/server/lifestyleEngine';
import type { UserLifestyleProfile, UserProfile } from '@/types/auth';
import type { Routine } from '@/types/routine';
import type { RoutineSchedulePreference } from '@/types/schedule';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
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
