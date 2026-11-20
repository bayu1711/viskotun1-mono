import { GoogleGenerativeAI } from '@google/generative-ai';
import type {
  CulturalRhythmId,
  LifestyleAdaptationSpec,
  RegionalLifestyleTag,
  UserLifestyleProfile,
  UserProfile
} from '../types/auth';
import type { Routine } from '../types/routine';
import type { RoutineSchedulePreference } from '../types/schedule';
import { resolveCulturalRhythms } from '../utils/profile';
import {
  evaluateRoutineScheduleCompatibility,
  formatAvailabilitySummary,
  resolveStepTiming
} from '../utils/schedule';
import { executeWithGeminiFailover, getGeminiApiKeys } from './geminiKeys';
import { getEffectiveGuardrails } from './guardrailLedger';
import {
  validateAdaptationWithGuardrails,
  validateRegionalTagsWithGuardrails
} from './lifestyleGuardrails';
import { getRegionalSuggestions } from './regionalRegistry';

const IS_TEST = process.env.NODE_ENV === 'test' || Boolean(process.env.VITEST);

// Cache AI-derived regional suggestions per country+city (TTL 1 hour)
const regionalAiCache = new Map<string, { tags: RegionalLifestyleTag[]; fetchedAt: number }>();
const REGIONAL_CACHE_TTL_MS = 60 * 60 * 1000;

function stripJsonCodeFences(raw: string): string {
  return raw
    .trim()
    .replace(/^```(?:json)?/i, '')
    .replace(/```$/i, '')
    .trim();
}

/**
 * Dynamically derives culturally diverse, locally grounded lifestyle/climate/work tags
 * for ANY country or city worldwide using Gemini AI + safety guardrails,
 * merging with verified crowdsourced registry tags and zero-downtime offline fallbacks.
 */
export async function deriveGlobalRegionalSuggestions(params: {
  countryCode: string;
  countryName?: string;
  city?: string;
  culturalRhythms?: readonly CulturalRhythmId[];
}): Promise<{ suggestions: RegionalLifestyleTag[]; source: 'gemini-global-ai' | 'registry-fallback' }> {
  const code = params.countryCode.trim().toUpperCase() || 'GLOBAL';
  const city = params.city?.trim() || '';
  const countryName = params.countryName?.trim() || code;
  const rhythmKey = (params.culturalRhythms ?? []).slice().sort().join(',');
  const cacheKey = `${code}:${city.toLowerCase()}:${rhythmKey}`;

  const existingRegistry = getRegionalSuggestions(code);

  const cached = regionalAiCache.get(cacheKey);
  if (cached && Date.now() - cached.fetchedAt < REGIONAL_CACHE_TTL_MS) {
    return { suggestions: mergeTags(cached.tags, existingRegistry), source: 'gemini-global-ai' };
  }

  const keys = IS_TEST ? [] : getGeminiApiKeys();
  if (keys.length === 0) {
    return { suggestions: existingRegistry, source: 'registry-fallback' };
  }

  try {
    const rhythmHint =
      params.culturalRhythms && params.culturalRhythms.length > 0
        ? `Participant's chosen cultural/household rhythms: ${params.culturalRhythms.join(', ')}.`
        : 'Do NOT assume a single cultural, dietary, or religious archetype from country alone.';

    const prompt = `You are TrialN1's Multicultural Global Clinical Context Engine.
Location: ${city ? `${city}, ` : ''}${countryName} (ISO: ${code}).
${rhythmHint}

Every city contains many different cultures, households, and work lives (locals, diaspora communities, varied dietary/fasting habits, shift schedules, family meal timings).
Generate 6 distinct, inclusive lifestyle factors spanning:
- Local environmental/climate realities (e.g., heat, winter low-UV, air quality, commute distance)
- Diverse cultural & household timings relevant across communities there (e.g., fasting traditions, late family dinners, early dawn risers, multi-generational homes, shift work, common caffeine/nicotine patterns).

Output ONLY a raw JSON array of objects matching:
[
  {
    "label": "Short 2-5 word label (no emojis)",
    "category": "schedule" | "substance" | "culture" | "physical" | "environment",
    "description": "1 concise sentence explaining why it matters for daily routine pacing"
  }
]
Rules:
- Never assume all residents of a country share one culture or diet.
- Never include unsafe medical claims or advice to double dosages/ignore pain.
- Keep labels clean, inclusive, and clinically neutral.`;

    const rawText = await executeWithGeminiFailover(async (apiKey) => {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-1.5-flash' });
      const res = await model.generateContent(prompt);
      return res.response.text();
    });

    const parsed = JSON.parse(stripJsonCodeFences(rawText));
    if (Array.isArray(parsed)) {
      const safeAiTags = validateRegionalTagsWithGuardrails(parsed, code);
      if (safeAiTags.length > 0) {
        regionalAiCache.set(cacheKey, { tags: safeAiTags, fetchedAt: Date.now() });
        return { suggestions: mergeTags(safeAiTags, existingRegistry), source: 'gemini-global-ai' };
      }
    }
  } catch (err) {
    console.warn(`[LifestyleEngine] Dynamic regional AI lookup failed for ${code}:`, err);
  }

  return { suggestions: existingRegistry, source: 'registry-fallback' };
}

function mergeTags(primary: RegionalLifestyleTag[], secondary: RegionalLifestyleTag[]): RegionalLifestyleTag[] {
  const map = new Map<string, RegionalLifestyleTag>();
  for (const tag of primary) {
    map.set(tag.label.toLowerCase(), tag);
  }
  for (const tag of secondary) {
    const key = tag.label.toLowerCase();
    if (!map.has(key)) {
      map.set(key, tag);
    }
  }
  return Array.from(map.values());
}

/** Deterministic offline builder for LifestyleAdaptationSpec when AI keys are absent or unavailable. */
export function buildDeterministicAdaptation(params: {
  userProfile?: UserProfile;
  lifestyleProfile?: Partial<UserLifestyleProfile>;
  routine?: Routine | null;
  routineSchedule?: RoutineSchedulePreference;
}): Partial<LifestyleAdaptationSpec> {
  const lp = params.lifestyleProfile;
  const up = params.userProfile;
  const regionCity = lp?.region?.city?.trim();
  const regionCountry = lp?.region?.countryName?.trim() || lp?.region?.countryCode || 'Global';
  const regionLabel = regionCity ? `${regionCity}, ${regionCountry}` : regionCountry;

  const scheduleCompatibility = params.routine
    ? evaluateRoutineScheduleCompatibility(params.routine, up, params.routineSchedule)
    : undefined;

  const availabilityLabel = formatAvailabilitySummary(up, params.routineSchedule);
  const notes: string[] = [];
  const rhythms = resolveCulturalRhythms(lp);
  const hasRamadan = rhythms.includes('ramadan_fasting');
  const hasOtherFasting =
    rhythms.includes('intermittent_fasting') || rhythms.includes('periodic_religious_fasting');

  let suggestedWindow = availabilityLabel || 'Standard waking hours';
  let recommendedDoseMode: 'standard' | 'micro' | 'rest' = 'standard';

  if (scheduleCompatibility?.status === 'conflict') {
    suggestedWindow = 'Schedule review needed';
    notes.push(scheduleCompatibility.explanation);
  } else if (scheduleCompatibility?.status === 'tight') {
    recommendedDoseMode = 'micro';
    notes.push(scheduleCompatibility.explanation);
  } else if (params.routineSchedule?.mode === 'anytime') {
    suggestedWindow = 'Anytime (this routine)';
  } else if (hasRamadan) {
    suggestedWindow = `Post-Iftar (${availabilityLabel || '20:30–22:00'}) & Pre-Suhoor`;
    notes.push('Exertion and hydration steps paced into non-fasting hours');
  } else if (rhythms.includes('early_dawn_riser')) {
    suggestedWindow = `Early dawn window (${availabilityLabel || '05:30–07:00'})`;
    notes.push('Core movement anchored in calm early-morning hours');
  } else if (rhythms.includes('late_family_dinner')) {
    suggestedWindow = `Post-dinner recovery (${availabilityLabel || '21:30–22:30'}) or pre-dinner`;
    notes.push('Evening digestion gap and sleep wind-down protected');
  } else if (hasOtherFasting) {
    notes.push('Hydration and exertion paced around your fasting & refeed window');
  }

  if (rhythms.includes('midday_siesta_rest')) {
    notes.push('Session split away from midday rest window');
  }
  if (rhythms.includes('sabbath_weekly_rest')) {
    notes.push('Weekly rest day preserved cleanly within trial adherence targets');
  }
  if (rhythms.includes('collectivist_household')) {
    notes.push('Compact home-friendly sessions fitted around shared family hours');
  }

  if (lp?.workPattern === 'shift_work') {
    if (!hasRamadan && scheduleCompatibility?.status !== 'conflict') suggestedWindow = 'Post-shift waking window';
    notes.push('Intervals aligned to shift rotation to protect sleep debt');
    recommendedDoseMode = 'micro';
  } else if (lp?.workPattern === 'desk_sedentary') {
    notes.push('Structured micro-breaks paired with sedentary work blocks');
  } else if (lp?.workPattern === 'frequent_travel') {
    notes.push('Travel-resilient execution without specialized gym setups');
  }

  if (lp?.climateSensitivity === 'summer_heat') {
    notes.push('Climate-controlled indoor execution advised during peak heat');
  } else if (lp?.climateSensitivity === 'cold_climate') {
    notes.push('Gradual indoor warm-up advised before cold-weather loading');
  }

  if (lp?.physicalCautions && lp.physicalCautions.length > 0) {
    recommendedDoseMode = 'micro';
    notes.push(`Protective pacing active for ${lp.physicalCautions.slice(0, 2).join(' & ').toLowerCase()}`);
  }

  const hasGentlePacing = lp?.activeTags?.some((t) => {
    const lower = t.toLowerCase();
    return lower.includes('micro') || lower.includes('gentle') || lower.includes('lower intensity');
  });
  if (hasGentlePacing) {
    recommendedDoseMode = 'micro';
    notes.push('Routine calibrated to gentle micro-dosing to protect recovery');
  }

  const assignmentByStep = new Map(
    (scheduleCompatibility?.stepAssignments ?? []).map((a) => [a.stepId, a])
  );

  const stepTips: Record<string, string> = {};
  for (const step of params.routine?.steps ?? []) {
    const timing = resolveStepTiming(step);
    const assignment = assignmentByStep.get(step.id);

    if (timing.type === 'on_demand') {
      stepTips[step.id] = timing.anchorHint || 'Use anytime a craving or trigger strikes';
    } else if (timing.type === 'continuous') {
      stepTips[step.id] = assignment?.assignedLabel || 'All-day boundary · confirm at day end';
    } else if (assignment?.status === 'conflict') {
      stepTips[step.id] = assignment.assignedLabel;
    } else if (hasRamadan) {
      stepTips[step.id] = 'Best completed after Iftar hydration';
    } else if (rhythms.includes('late_family_dinner')) {
      stepTips[step.id] = 'Time 45 min after dinner or pre-meal';
    } else if (rhythms.includes('early_dawn_riser')) {
      stepTips[step.id] = 'Anchor gently after dawn waking';
    } else if (hasOtherFasting) {
      stepTips[step.id] = 'Pair with electrolytes during refeed hours';
    } else if (lp?.climateSensitivity === 'summer_heat') {
      stepTips[step.id] = 'Prefer AC/indoor space during peak afternoon heat';
    } else if (lp?.climateSensitivity === 'cold_climate') {
      stepTips[step.id] = 'Add 2-min warm-up before loading';
    } else if (lp?.workPattern === 'shift_work') {
      stepTips[step.id] = 'Flexible timing within your waking shift window';
    } else if (lp?.physicalCautions && lp.physicalCautions.length > 0) {
      stepTips[step.id] = `Caution: ease into range (${lp.physicalCautions[0]})`;
    } else if (assignment?.assignedLabel) {
      stepTips[step.id] = assignment.assignedLabel;
    }
  }

  const bannerTitle =
    notes.length > 0
      ? `${regionLabel} · Adaptive Context Active`
      : `${regionLabel} · Standard Trial Alignment`;

  const bannerGuidance =
    notes.length > 0
      ? `${notes.join('. ')}.`
      : `Routine cadence aligned for ${regionLabel} within standard evidence-based limits.`;

  return {
    bannerTitle,
    bannerGuidance,
    recommendedDoseMode,
    suggestedWindow,
    stepTips,
    ...(scheduleCompatibility ? { scheduleCompatibility } : {}),
    source: 'deterministic-fallback',
    regionLabel
  };
}

/**
 * Synthesizes a guardrail-validated `LifestyleAdaptationSpec` from UserProfile,
 * UserLifestyleProfile, and the active Routine via Gemini AI (with safe fallback).
 */
export async function generateLifestyleAdaptation(params: {
  userProfile?: UserProfile;
  lifestyleProfile?: Partial<UserLifestyleProfile>;
  routine?: Routine | null;
  routineSchedule?: RoutineSchedulePreference;
}): Promise<LifestyleAdaptationSpec> {
  const activePolicy = await getEffectiveGuardrails();
  const deterministic = buildDeterministicAdaptation(params);

  const keys = IS_TEST ? [] : getGeminiApiKeys();
  if (keys.length === 0 || !params.routine) {
    return validateAdaptationWithGuardrails(
      deterministic,
      params.routine,
      params.lifestyleProfile,
      activePolicy
    );
  }

  try {
    const stepSummary = params.routine.steps.map((s) => ({
      id: s.id,
      action: s.action,
      frequency: s.frequency,
      timing: resolveStepTiming(s)
    }));

    const prompt = `You are TrialN1's Guardrail-Protected Adaptive Lifestyle Engine.
Adapt the presentation, timing window, and step execution hints for this routine based on BOTH the participant's chosen cultural/household rhythms (e.g. fasting, meal timing, dawn schedule, weekly rest) AND their physical location/climate/work schedule AND their available time windows — without ever stereotyping by country.

Participant UserProfile: ${JSON.stringify(params.userProfile || {})}
Participant UserLifestyleProfile: ${JSON.stringify(params.lifestyleProfile || {})}
Per-Routine Schedule Preference: ${JSON.stringify(params.routineSchedule || { mode: 'profile_windows' })}
Schedule Compatibility Check: ${JSON.stringify(deterministic.scheduleCompatibility || {})}
Active Routine: ${params.routine.shortTitle || params.routine.title}
Routine Steps: ${JSON.stringify(stepSummary)}
Clinical Policy Limits: Pause escalation and reduce load ${activePolicy.loadReductionPercent}% if symptom score >= ${activePolicy.painEscalationThreshold}/10.

Output ONLY raw JSON matching:
{
  "bannerTitle": "Concise 4-7 word adaptive headline referencing city/region or key factor",
  "bannerGuidance": "1-2 sentences tailoring scheduling, environment (AC/indoor/sunlight), and recovery to their chosen cultural & daily life",
  "recommendedDoseMode": "standard" | "micro" | "rest",
  "suggestedWindow": "Best daily execution window matching their chosen rhythms & open windows",
  "stepTips": {
    "<stepId>": "Short 4-8 word practical lifestyle tip for that step"
  }
}

STRICT SAFETY GUARDRAILS:
1. NEVER inflate sets, reps, duration, or medication dosage beyond the paper's standard dose.
2. You may only shift timing, suggest safer environmental conditions, or scale DOWN to 'micro' / 'rest'.
3. NEVER force on_demand / trigger-based steps (e.g. smoking craving tools) into a single fixed clock time — keep them anytime on trigger.
4. NEVER assume a participant's religion/diet from their country unless selected in culturalRhythms/activeTags; adapt strictly around physiological timing, hydration, sleep, and heat/cold safety.
5. NEVER give medical diagnoses or advise ignoring sharp pain or stopping prescribed medications.`;

    const rawText = await executeWithGeminiFailover(async (apiKey) => {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-1.5-flash' });
      const res = await model.generateContent(prompt);
      return res.response.text();
    });

    const parsed = JSON.parse(stripJsonCodeFences(rawText));
    return validateAdaptationWithGuardrails(
      {
        ...parsed,
        scheduleCompatibility: deterministic.scheduleCompatibility,
        source: 'gemini-global-ai'
      },
      params.routine,
      params.lifestyleProfile,
      activePolicy
    );
  } catch (err) {
    console.warn('[LifestyleEngine] Adaptation AI generation failed, falling back deterministically:', err);
    return validateAdaptationWithGuardrails(
      deterministic,
      params.routine,
      params.lifestyleProfile,
      activePolicy
    );
  }
}
