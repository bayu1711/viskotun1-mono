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

const WORK_FOCUS: Partial<Record<NonNullable<UserLifestyleProfile['workPattern']>, string>> = {
  shift_work: 'shift-aligned recovery & sleep regularity',
  desk_sedentary: 'postural mobility & sedentary break adherence',
  frequent_travel: 'travel-resilient habit continuity'
};

const SMOKING_FOCUS: Partial<Record<NonNullable<UserLifestyleProfile['smokingStatus']>, string>> = {
  midwakh_dokha: 'cardiorespiratory & vascular recovery monitoring',
  shisha_waterpipe: 'aerobic capacity & harm-reduction pacing',
  cigarettes: 'cardiorespiratory & tissue oxygenation protection',
  vape: 'vascular recovery pacing'
};

/**
 * Synthesizes a concise primary health / rehab focus string directly from
 * `UserLifestyleProfile` factors (and optional age / active routine context).
 */
export function deriveClinicalFocus(
  profile?: Partial<UserLifestyleProfile>,
  options?: { age?: number; routineTitle?: string }
): string {
  if (!profile) return 'Consistent daily adherence within trial safety boundaries';

  const pillars: string[] = [];

  if (options?.routineTitle) {
    pillars.push(`safe progression in ${options.routineTitle}`);
  }
  if (profile.isRamadanFastingObserver) {
    pillars.push('fasting-safe hydration & post-Iftar exertion timing');
  }
  if (profile.workPattern && WORK_FOCUS[profile.workPattern]) {
    pillars.push(WORK_FOCUS[profile.workPattern]!);
  }
  if (profile.climateSensitivity === 'summer_heat') {
    pillars.push('heat-mitigated indoor/cooler-window execution');
  }
  if (profile.smokingStatus && SMOKING_FOCUS[profile.smokingStatus]) {
    pillars.push(SMOKING_FOCUS[profile.smokingStatus]!);
  }
  if (profile.activityBaseline === 'sedentary' && profile.workPattern !== 'desk_sedentary') {
    pillars.push('low-friction foundational movement');
  }
  if (profile.physicalCautions && profile.physicalCautions.length > 0) {
    const joined = profile.physicalCautions.slice(0, 2).map((c) => c.toLowerCase()).join(' & ');
    pillars.push(`joint-protective loading (${joined})`);
  }

  if (pillars.length === 0) {
    const ageNote = options?.age && options.age >= 50 ? 'recovery-conscious ' : '';
    return `${ageNote}evidence-grounded daily adherence & gradual progression`.replace(/^[a-z]/, (c) => c.toUpperCase());
  }

  const summary = pillars.slice(0, 3).join(', ');
  return summary.charAt(0).toUpperCase() + summary.slice(1);
}

