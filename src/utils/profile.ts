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

/**
 * Tags derived from structured fields (work pattern, smoking, climate, rhythms).
 * They are recomputed on every save, so they never go stale when a field changes.
 */
export const MANAGED_LIFESTYLE_TAGS = new Set<string>([
  ...CULTURAL_RHYTHM_KEYS,
  'healthcare_shift_worker',
  'desk_bound_worker',
  'frequent_traveler',
  'midwakh_dokha',
  'shisha_waterpipe',
  'cigarette_smoker',
  'vape_user',
  'extreme_heat_summer',
  'cold_climate_winter'
]);

/**
 * Canonical physical caution labels. The AI interview, the free-form tuner and the
 * /profile chips all store these exact strings, so one caution never appears twice.
 */
export const CAUTION_PRESET_KEYS = [
  'Morning stiffness',
  'Knee sensitivity',
  'Lower back sensitivity',
  'Shoulder mobility limit',
  'Ankle / Achilles tenderness',
  'Hip stiffness',
  'Neck tension',
  'Wrist sensitivity',
  'Joint sensitivity',
  'Heat fatigue'
] as const;

/** Older or localized spellings of a canonical caution, keyed in lower case. */
const CAUTION_ALIASES: Record<string, string> = {
  'lower back caution': 'Lower back sensitivity',
  'joint caution': 'Joint sensitivity',
  'تيبس صباحي': 'Morning stiffness',
  'حساسية الركبة': 'Knee sensitivity',
  'حذر أسفل الظهر': 'Lower back sensitivity',
  'إجهاد حراري': 'Heat fatigue'
};

const MAX_CAUTIONS = 8;
const MAX_CAUTION_LENGTH = 60;

/** Maps one caution to its canonical label, or returns the trimmed custom text. */
export function canonicalizeCaution(raw: string): string {
  const trimmed = raw.replace(/\s+/g, ' ').trim().slice(0, MAX_CAUTION_LENGTH);
  const lower = trimmed.toLowerCase();
  if (CAUTION_ALIASES[lower]) return CAUTION_ALIASES[lower];
  const preset = CAUTION_PRESET_KEYS.find((key) => key.toLowerCase() === lower);
  return preset ?? trimmed;
}

/** Trims, canonicalizes and de-duplicates (case-insensitive) a caution list. */
export function normalizePhysicalCautions(list?: readonly unknown[]): string[] {
  if (!Array.isArray(list)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of list) {
    if (typeof item !== 'string') continue;
    const label = canonicalizeCaution(item);
    const key = label.toLowerCase();
    if (!label || seen.has(key)) continue;
    seen.add(key);
    out.push(label);
    if (out.length >= MAX_CAUTIONS) break;
  }
  return out;
}

/**
 * Human-readable labels that older parsers wrote into `activeTags` as copies of
 * structured fields. They are dropped on sync because the managed ids above replace them.
 */
const DERIVED_TAG_LABELS = new Set(
  [
    'Shift Work / Night Shifts',
    'Desk-bound Sedentary',
    'Frequent Travel',
    'Non-Smoker',
    'Former Smoker',
    'Midwakh / Dokha Tobacco',
    'Shisha / Waterpipe',
    'Cigarettes',
    'Vape / E-cigarette',
    'Summer Heat Adaptation',
    'Cold Climate / Winter',
    'Ramadan Fasting Observer',
    'Intermittent Fasting (16:8)',
    'Periodic Fasting',
    'Late Family Dinner (21:00+)',
    'Early Dawn Riser',
    'Midday Rest / Siesta',
    'Weekly Rest / Sabbath',
    'Shared Household Schedule',
    ...CAUTION_PRESET_KEYS,
    ...Object.keys(CAUTION_ALIASES)
  ].map((label) => label.toLowerCase())
);

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
  // Cautions live in `physicalCautions` only; a tag copy of them would go stale on removal.
  const cautionKeys = new Set(
    normalizePhysicalCautions(profile.physicalCautions).map((c) => c.toLowerCase())
  );
  const customTags = (profile.activeTags ?? []).filter((tag) => {
    if (typeof tag !== 'string' || !tag.trim()) return false;
    if (MANAGED_LIFESTYLE_TAGS.has(tag)) return false;
    const key = tag.trim().toLowerCase();
    return !DERIVED_TAG_LABELS.has(key) && !cautionKeys.has(key);
  });
  const next = new Set<string>(customTags.map((tag) => tag.trim()));

  for (const rhythm of resolveCulturalRhythms(profile)) {
    next.add(rhythm);
  }
  if (profile.workPattern === 'shift_work') next.add('healthcare_shift_worker');
  if (profile.workPattern === 'desk_sedentary') next.add('desk_bound_worker');
  if (profile.workPattern === 'frequent_travel') next.add('frequent_traveler');
  if (profile.smokingStatus === 'midwakh_dokha') next.add('midwakh_dokha');
  if (profile.smokingStatus === 'shisha_waterpipe') next.add('shisha_waterpipe');
  if (profile.smokingStatus === 'cigarettes') next.add('cigarette_smoker');
  if (profile.smokingStatus === 'vape') next.add('vape_user');
  if (profile.climateSensitivity === 'summer_heat') next.add('extreme_heat_summer');
  if (profile.climateSensitivity === 'cold_climate') next.add('cold_climate_winter');

  return Array.from(next);
}

const WORK_PATTERN_VALUES = new Set<string>([
  'standard',
  'shift_work',
  'desk_sedentary',
  'frequent_travel',
  'flexible'
]);
const SMOKING_VALUES = new Set<string>([
  'non_smoker',
  'cigarettes',
  'midwakh_dokha',
  'shisha_waterpipe',
  'vape',
  'former_smoker',
  'other'
]);
const ACTIVITY_VALUES = new Set<string>(['sedentary', 'light', 'moderate', 'active']);
const CLIMATE_ALIASES: Record<string, NonNullable<UserLifestyleProfile['climateSensitivity']>> = {
  summer_heat: 'summer_heat',
  high_humidity: 'summer_heat',
  hot: 'summer_heat',
  moderate: 'moderate',
  cold_climate: 'cold_climate',
  winter_cold: 'cold_climate',
  cold: 'cold_climate'
};

/**
 * Validates loosely typed lifestyle fields (e.g. JSON from an LLM) against the
 * profile's enums. Unknown values are dropped instead of being stored, so the
 * /profile chips can always show what the AI saved.
 */
export function sanitizeLifestyleFields(raw: Record<string, unknown>): Partial<UserLifestyleProfile> {
  const out: Partial<UserLifestyleProfile> = {};
  if (typeof raw.workPattern === 'string' && WORK_PATTERN_VALUES.has(raw.workPattern)) {
    out.workPattern = raw.workPattern as UserLifestyleProfile['workPattern'];
  }
  if (typeof raw.smokingStatus === 'string' && SMOKING_VALUES.has(raw.smokingStatus)) {
    out.smokingStatus = raw.smokingStatus as UserLifestyleProfile['smokingStatus'];
  }
  if (typeof raw.activityBaseline === 'string' && ACTIVITY_VALUES.has(raw.activityBaseline)) {
    out.activityBaseline = raw.activityBaseline as UserLifestyleProfile['activityBaseline'];
  }
  if (typeof raw.climateSensitivity === 'string' && CLIMATE_ALIASES[raw.climateSensitivity]) {
    out.climateSensitivity = CLIMATE_ALIASES[raw.climateSensitivity];
  }
  if (typeof raw.isRamadanFastingObserver === 'boolean') {
    out.isRamadanFastingObserver = raw.isRamadanFastingObserver;
  }
  if (Array.isArray(raw.culturalRhythms)) {
    const valid = new Set<string>(CULTURAL_RHYTHM_KEYS);
    const rhythms = raw.culturalRhythms.filter(
      (r): r is CulturalRhythmId => typeof r === 'string' && valid.has(r)
    );
    if (rhythms.length > 0) out.culturalRhythms = Array.from(new Set(rhythms));
  }
  if (Array.isArray(raw.physicalCautions)) {
    const cautions = normalizePhysicalCautions(raw.physicalCautions);
    if (cautions.length > 0) out.physicalCautions = cautions;
  }
  return out;
}

/**
 * Converts LLM window shapes into HH:mm windows. Accepts "06:00", hours (6, 8.5)
 * or minutes since midnight (360).
 */
export function coerceAvailableWindows(raw: unknown): AvailableTimeWindow[] {
  if (!Array.isArray(raw)) return [];
  const toTime = (value: unknown): string | null => {
    if (typeof value === 'number' && Number.isFinite(value) && value >= 0 && value < 24 * 60) {
      const totalMinutes = value < 24 ? Math.round(value * 60) : Math.round(value);
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    }
    if (typeof value === 'string' && /^([01]?\d|2[0-3]):[0-5]\d$/.test(value.trim())) {
      return value.trim().padStart(5, '0');
    }
    return null;
  };
  const windows: AvailableTimeWindow[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const record = item as Record<string, unknown>;
    const start = toTime(record.start);
    const end = toTime(record.end);
    if (!start || !end) continue;
    windows.push({
      id: `win-${start.replace(':', '')}`,
      label: typeof record.label === 'string' ? record.label.slice(0, 40) : '',
      start,
      end
    });
  }
  return windows;
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

