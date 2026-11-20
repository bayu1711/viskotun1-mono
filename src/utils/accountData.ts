import type { User, UserLifestyleProfile, UserProfile } from '../types/auth';
import type { Routine, RoutineRuntime } from '../types/routine';

export interface UserDataExportSnapshot {
  schemaVersion: '1.0';
  exportedAt: string;
  account: {
    id: string;
    name: string;
    email: string;
    isGuest: boolean;
    role: string;
    createdAt: number;
  } | null;
  profile: UserProfile;
  lifestyleProfile: UserLifestyleProfile;
  routines: Routine[];
  runtime: Record<string, RoutineRuntime>;
}

/** Builds a portable, human-readable JSON snapshot of all data stored for the current user. */
export function buildUserDataExport(input: {
  user: User | null;
  userProfile: UserProfile;
  lifestyleProfile: UserLifestyleProfile;
  routines: Routine[];
  runtime: Record<string, RoutineRuntime>;
}): UserDataExportSnapshot {
  return {
    schemaVersion: '1.0',
    exportedAt: new Date().toISOString(),
    account: input.user
      ? {
          id: input.user.id,
          name: input.user.name,
          email: input.user.email,
          isGuest: input.user.isGuest,
          role: input.user.role ?? 'user',
          createdAt: input.user.createdAt
        }
      : null,
    profile: input.userProfile,
    lifestyleProfile: input.lifestyleProfile,
    routines: input.routines,
    runtime: input.runtime
  };
}

/** Counts total biofeedback, morphing, and barrier log entries stored across all routines. */
export function countStoredUserLogs(runtime: Record<string, RoutineRuntime>): number {
  let total = 0;
  for (const entry of Object.values(runtime)) {
    if (!entry) continue;
    total += entry.feedbackLogs?.length ?? 0;
    total += entry.morphingLogs?.length ?? 0;
    total += entry.barrierLogs?.length ?? 0;
  }
  return total;
}

/** Triggers a client-side JSON file download for the user's exported data snapshot. */
export function downloadUserDataExport(snapshot: UserDataExportSnapshot): void {
  const datePart = snapshot.exportedAt.slice(0, 10);
  const blob = new Blob([JSON.stringify(snapshot, null, 2)], {
    type: 'application/json;charset=utf-8'
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `trialn1-data-export-${datePart}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/** Clears scoped TrialN1 routine & profile keys from browser storage. */
export function clearBrowserStorageForAccount(options: {
  userId?: string;
  includeAuthSession?: boolean;
}): void {
  if (typeof window === 'undefined') return;
  const scope = options.userId ? `usr_${options.userId}` : 'guest';
  const keysToRemove = [
    `viskotun1_v2_${scope}_routines`,
    `viskotun1_v2_${scope}_active_id`,
    `viskotun1_v2_${scope}_runtime`,
    'viskotun1_user_profile',
    'viskotun1_lifestyle_profile'
  ];

  if (options.includeAuthSession) {
    keysToRemove.push('viskotun1_auth_user');
  }

  for (const key of keysToRemove) {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // Ignore storage access errors
    }
  }

  try {
    window.sessionStorage.removeItem('trialn1_lifestyle_onboarding_dismissed');
  } catch {
    // Ignore storage access errors
  }
}
