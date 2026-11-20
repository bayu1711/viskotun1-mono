import type { CulturalRhythmId, UserLifestyleProfile } from '../types/auth';
import type { AvailableTimeWindow } from '../types/schedule';

export type DerivedLifestyleCohort = 'smoker' | 'ramadan' | 'shift_work' | 'general';

export const CULTURAL_RHYTHM_KEYS: readonly CulturalRhythmId[] = [
  'ramadan_fasting',
  'intermittent_fasting',
  'periodic_religious_fasting',
  'late_family_dinner',
  'early_dawn_riser',
  'midday_siesta_rest',
  'sabbath_weekly_rest',
  'collectivist_household'
];

const MANAGED_LIFESTYLE_TAGS = new Set([
  ...CULTURAL_RHYTHM_KEYS,
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

const FASTING_CONTEXT_COUNTRY_CODES = new Set([
  'AE',
  'SA',
  'QA',
  'KW',
  'BH',
  'OM',
  'EG',
  'JO',
  'LB',
  'IQ',
  'SY',
  'YE',
  'PS',
  'MA',
  'DZ',
  'TN',
  'LY',
  'SD',
  'PK',
  'ID',
  'MY',
  'TR',
  'BD'
]);

/** Returns true when regional defaults commonly include fasting-hour schedule options. */
export function isFastingContextRegion(countryCode?: string): boolean {
  if (!countryCode) return false;
  return FASTING_CONTEXT_COUNTRY_CODES.has(countryCode.trim().toUpperCase());
}

export interface AvailabilityWindowPreset {
  id: string;
  label: string;
  start: string;
  end: string;
}

/** Keeps `culturalRhythms` and legacy `isRamadanFastingObserver` aligned across callers. */
export function resolveCulturalRhythms(profile?: Partial<UserLifestyleProfile>): CulturalRhythmId[] {
  const next = new Set<CulturalRhythmId>(profile?.culturalRhythms ?? []);
  if (profile?.isRamadanFastingObserver) next.add('ramadan_fasting');
  return Array.from(next);
}

/**
 * Computes available time window preset chips adapted to cultural rhythms, fasting status,
 * and regional defaults so users in any country can pick realistic open windows matching
 * *their* actual household & cultural schedule without regional stereotyping.
 */
export function getRegionalAvailabilityPresets(options: {
  countryCode?: string;
  isRamadanFastingObserver?: boolean;
  culturalRhythms?: readonly CulturalRhythmId[];
  basePresets: readonly AvailabilityWindowPreset[];
  fastingPreset?: AvailabilityWindowPreset;
  dawnPreset?: AvailabilityWindowPreset;
  lateDinnerPreset?: AvailabilityWindowPreset;
}): AvailableTimeWindow[] {
  const rhythms = new Set(options.culturalRhythms ?? []);
  const presets: AvailableTimeWindow[] = [];

  if (options.dawnPreset && rhythms.has('early_dawn_riser')) {
    presets.push({ ...options.dawnPreset });
  }

  for (const preset of options.basePresets) {
    presets.push({ ...preset });
  }

  if (
    options.fastingPreset &&
    (options.isRamadanFastingObserver ||
      rhythms.has('ramadan_fasting') ||
      isFastingContextRegion(options.countryCode))
  ) {
    presets.push({ ...options.fastingPreset });
  }

  if (options.lateDinnerPreset && rhythms.has('late_family_dinner')) {
    presets.push({ ...options.lateDinnerPreset });
  }

  return presets;
}

/**
 * Synchronizes structured lifestyle attributes into `activeTags` so Health Age
 * and AI Lifestyle Tuning stay aligned with manual changes on /profile.
 */
export function syncLifestyleActiveTags(profile: Partial<UserLifestyleProfile>): string[] {
  const customTags = (profile.activeTags ?? []).filter((tag) => !MANAGED_LIFESTYLE_TAGS.has(tag));
  const next = new Set<string>(customTags);

  for (const rhythm of resolveCulturalRhythms(profile)) {
    next.add(rhythm);
  }
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
  if (profile?.isRamadanFastingObserver || profile?.culturalRhythms?.includes('ramadan_fasting')) {
    return 'ramadan';
  }
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

const CULTURAL_FOCUS: Partial<Record<CulturalRhythmId, string>> = {
  ramadan_fasting: 'fasting-safe hydration & post-Iftar exertion timing',
  intermittent_fasting: 'fasted hydration & refeed-window pacing',
  periodic_religious_fasting: 'fasting-day gentle loading & electrolyte recovery',
  late_family_dinner: 'post-dinner light mobility & evening wind-down spacing',
  early_dawn_riser: 'dawn circadian anchor & early-day execution',
  midday_siesta_rest: 'split afternoon-rest & cooler-hour pacing',
  sabbath_weekly_rest: '6-day active cadence with structured rest-day recovery',
  collectivist_household: 'compact home-friendly intervals around family schedules'
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
  for (const rhythm of resolveCulturalRhythms(profile)) {
    if (CULTURAL_FOCUS[rhythm]) pillars.push(CULTURAL_FOCUS[rhythm]!);
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

