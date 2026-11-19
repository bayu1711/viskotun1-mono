import type { UserLifestyleProfile } from '../types/auth';

export type DerivedLifestyleCohort = 'smoker' | 'ramadan' | 'shift_work' | 'general';

const MANAGED_LIFESTYLE_TAGS = new Set([
  'ramadan_fasting',
  'healthcare_shift_worker',
  'midwakh_dokha',
  'shisha_waterpipe',
  'extreme_heat_summer'
]);

/** Validates an optional chronological age input into a safe adult/adolescent bound (13–110). */
export function sanitizeAge(raw: string | number | undefined): number | undefined {
  if (raw === undefined || raw === null || raw === '') return undefined;
  const num = typeof raw === 'number' ? raw : Number.parseInt(String(raw).trim(), 10);
  if (!Number.isFinite(num) || Number.isNaN(num)) return undefined;
  const rounded = Math.round(num);
  if (rounded < 13 || rounded > 110) return undefined;
  return rounded;
}

/** Parses 24-hour HH:mm string into numeric calendar reminder hours & minutes. */
export function parseReminderTime(time?: string): { hour: number; minute: number } {
  if (!time || typeof time !== 'string') return { hour: 9, minute: 0 };
  const match = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(time.trim());
  if (!match) return { hour: 9, minute: 0 };
  return {
    hour: Number.parseInt(match[1], 10),
    minute: Number.parseInt(match[2], 10)
  };
}

/**
 * Synchronizes structured lifestyle attributes into `activeTags` so Health Age
 * and AI Lifestyle Tuning stay aligned with manual changes on /profile.
 */
export function syncLifestyleActiveTags(profile: Partial<UserLifestyleProfile>): string[] {
  const customTags = (profile.activeTags ?? []).filter((tag) => !MANAGED_LIFESTYLE_TAGS.has(tag));
  const next = new Set<string>(customTags);

  if (profile.isRamadanFastingObserver) next.add('ramadan_fasting');
  if (profile.workPattern === 'shift_work') next.add('healthcare_shift_worker');
  if (profile.smokingStatus === 'midwakh_dokha') next.add('midwakh_dokha');
  if (profile.smokingStatus === 'shisha_waterpipe') next.add('shisha_waterpipe');
  if (profile.climateSensitivity === 'summer_heat') next.add('extreme_heat_summer');

  return Array.from(next);
}

/** Derives community review cohort classification from a user's lifestyle profile. */
export function deriveLifestyleCohort(profile?: Partial<UserLifestyleProfile>): DerivedLifestyleCohort {
  if (profile?.smokingStatus && profile.smokingStatus !== 'non_smoker' && profile.smokingStatus !== 'former_smoker') {
    return 'smoker';
  }
  if (profile?.isRamadanFastingObserver) return 'ramadan';
  if (profile?.workPattern === 'shift_work') return 'shift_work';
  return 'general';
}
