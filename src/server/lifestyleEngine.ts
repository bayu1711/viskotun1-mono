import { GoogleGenerativeAI } from '@google/generative-ai';
import type {
  LifestyleAdaptationSpec,
  RegionalLifestyleTag,
  UserLifestyleProfile,
  UserProfile
} from '../types/auth';
import type { Routine } from '../types/routine';
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
 * Dynamically derives regionally relevant lifestyle/climate/work adherence tags
 * for ANY country or city worldwide using Gemini AI + safety guardrails,
 * merging with verified crowdsourced registry tags and zero-downtime offline fallbacks.
 */
export async function deriveGlobalRegionalSuggestions(params: {
  countryCode: string;
  countryName?: string;
  city?: string;
}): Promise<{ suggestions: RegionalLifestyleTag[]; source: 'gemini-global-ai' | 'registry-fallback' }> {
  const code = params.countryCode.trim().toUpperCase() || 'GLOBAL';
  const city = params.city?.trim() || '';
  const countryName = params.countryName?.trim() || code;
  const cacheKey = `${code}:${city.toLowerCase()}`;

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
    const prompt = `You are TrialN1's Global Clinical Context Engine.
Location: ${city ? `${city}, ` : ''}${countryName} (ISO: ${code}).

Generate 5 distinct, practical, respectful lifestyle/environmental factors common to adults living in this location that affect adherence to clinical rehab, sleep, nutrition, or habit routines (e.g., climate extremes, daylight hours, commute patterns, local dietary/fasting traditions, occupational schedules, or common tobacco/caffeine habits).

Output ONLY a raw JSON array of objects matching:
[
  {
    "label": "Short 2-5 word label (no emojis)",
    "category": "schedule" | "substance" | "culture" | "physical" | "environment",
    "description": "1 concise sentence explaining why it matters for daily routine pacing"
  }
]
Rules:
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
}): Partial<LifestyleAdaptationSpec> {
  const lp = params.lifestyleProfile;
  const up = params.userProfile;
  const regionCity = lp?.region?.city?.trim();
  const regionCountry = lp?.region?.countryName?.trim() || lp?.region?.countryCode || 'Global';
  const regionLabel = regionCity ? `${regionCity}, ${regionCountry}` : regionCountry;

  const notes: string[] = [];
  let suggestedWindow = up?.preferredReminderTime ? `Scheduled around ${up.preferredReminderTime}` : 'Standard waking hours';
  let recommendedDoseMode: 'standard' | 'micro' | 'rest' = 'standard';

  if (lp?.isRamadanFastingObserver) {
    suggestedWindow = `Post-Iftar (${up?.preferredReminderTime || '20:30'}) & Pre-Suhoor`;
    notes.push('Exertion and hydration steps paced into non-fasting hours');
  }
  if (lp?.workPattern === 'shift_work') {
    if (!lp?.isRamadanFastingObserver) suggestedWindow = 'Post-shift waking window';
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

  const stepTips: Record<string, string> = {};
  for (const step of params.routine?.steps ?? []) {
    if (lp?.isRamadanFastingObserver) {
      stepTips[step.id] = 'Best completed after Iftar hydration';
    } else if (lp?.climateSensitivity === 'summer_heat') {
      stepTips[step.id] = 'Prefer AC/indoor space during peak afternoon heat';
    } else if (lp?.climateSensitivity === 'cold_climate') {
      stepTips[step.id] = 'Add 2-min warm-up before loading';
    } else if (lp?.workPattern === 'shift_work') {
      stepTips[step.id] = 'Flexible timing within your waking shift window';
    } else if (lp?.physicalCautions && lp.physicalCautions.length > 0) {
      stepTips[step.id] = `Caution: ease into range (${lp.physicalCautions[0]})`;
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
      frequency: s.frequency
    }));

    const prompt = `You are TrialN1's Guardrail-Protected Adaptive Lifestyle Engine.
Adapt the presentation, timing window, and step execution hints for this routine based strictly on the participant's global location, climate, work schedule, and profile.

Participant UserProfile: ${JSON.stringify(params.userProfile || {})}
Participant UserLifestyleProfile: ${JSON.stringify(params.lifestyleProfile || {})}
Active Routine: ${params.routine.shortTitle || params.routine.title}
Routine Steps: ${JSON.stringify(stepSummary)}
Clinical Policy Limits: Pause escalation and reduce load ${activePolicy.loadReductionPercent}% if symptom score >= ${activePolicy.painEscalationThreshold}/10.

Output ONLY raw JSON matching:
{
  "bannerTitle": "Concise 4-7 word adaptive headline referencing city/region or key factor",
  "bannerGuidance": "1-2 sentences tailoring scheduling, environment (AC/indoor/sunlight), and recovery to their life in their region",
  "recommendedDoseMode": "standard" | "micro" | "rest",
  "suggestedWindow": "Best daily execution window (e.g. 'Post-Iftar 20:30' or 'Evening indoor cool-down')",
  "stepTips": {
    "<stepId>": "Short 4-8 word practical lifestyle tip for that step"
  }
}

STRICT SAFETY GUARDRAILS:
1. NEVER inflate sets, reps, duration, or medication dosage beyond the paper's standard dose.
2. You may only shift timing, suggest safer environmental conditions, or scale DOWN to 'micro' / 'rest'.
3. NEVER give medical diagnoses or advise ignoring sharp pain or stopping prescribed medications.`;

    const rawText = await executeWithGeminiFailover(async (apiKey) => {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-1.5-flash' });
      const res = await model.generateContent(prompt);
      return res.response.text();
    });

    const parsed = JSON.parse(stripJsonCodeFences(rawText));
    return validateAdaptationWithGuardrails(
      { ...parsed, source: 'gemini-global-ai' },
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
