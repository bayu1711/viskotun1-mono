import type {
  LifestyleAdaptationSpec,
  RegionalLifestyleTag,
  UserLifestyleProfile
} from '../types/auth';
import type { GuardrailPolicy } from '../types/guardrails';
import type { Routine } from '../types/routine';

const ALLOWED_CATEGORIES = new Set<RegionalLifestyleTag['category']>([
  'schedule',
  'substance',
  'culture',
  'physical',
  'environment'
]);

const UNSAFE_GUIDANCE_PATTERNS: RegExp[] = [
  /\bdouble\s+(the\s+)?(dose|sets|reps|load|weight|duration)\b/i,
  /\bincrease\s+(your\s+)?(dose|sets|reps|load|weight)\s+(above|beyond)\b/i,
  /\b(push\s+through|ignore)\s+(sharp\s+|severe\s+|acute\s+)?(pain|discomfort|dizziness|chest\s+pain)\b/i,
  /\bskip\s+(the\s+)?(stop\s+rule|safety|hydration|rest\s+days?)\b/i,
  /\bstop\s+taking\s+(your\s+)?(medication|medicine|prescription)\b/i,
  /\b(diagnose|cures?\s+all|miracle\s+cure)\b/i,
  /\bexercise\s+outdoors?\s+(in\s+)?(midday|noon)\s+(extreme\s+)?heat\b/i
];

/** Returns true when a generated lifestyle tip or guidance violates safety guardrails. */
export function containsUnsafeLifestyleGuidance(text?: string): boolean {
  if (!text || typeof text !== 'string') return false;
  return UNSAFE_GUIDANCE_PATTERNS.some((pattern) => pattern.test(text));
}

/** Validates and sanitizes dynamically derived regional lifestyle tags. */
export function validateRegionalTagsWithGuardrails(
  rawTags: Array<Partial<RegionalLifestyleTag>>,
  countryCode: string
): RegionalLifestyleTag[] {
  const normCode = countryCode.trim().toUpperCase() || 'GL';
  const seen = new Set<string>();
  const clean: RegionalLifestyleTag[] = [];

  for (let i = 0; i < rawTags.length; i++) {
    const item = rawTags[i];
    const label = typeof item?.label === 'string' ? item.label.trim().slice(0, 64) : '';
    if (!label || label.length < 3 || containsUnsafeLifestyleGuidance(label)) continue;

    const lower = label.toLowerCase();
    if (seen.has(lower)) continue;
    seen.add(lower);

    const category = ALLOWED_CATEGORIES.has(item.category as RegionalLifestyleTag['category'])
      ? (item.category as RegionalLifestyleTag['category'])
      : 'schedule';

    const description =
      typeof item.description === 'string' && !containsUnsafeLifestyleGuidance(item.description)
        ? item.description.trim().slice(0, 140)
        : undefined;

    clean.push({
      id: item.id?.trim() || `ai-${normCode.toLowerCase()}-${i + 1}`,
      label,
      category,
      countryCode: normCode,
      popularityCount:
        typeof item.popularityCount === 'number' && Number.isFinite(item.popularityCount)
          ? Math.max(10, Math.round(item.popularityCount))
          : Math.max(300, 900 - i * 85),
      ...(description ? { description } : {}),
      source: item.source ?? 'ai-regional'
    });
  }

  return clean;
}

/** Counts active friction factors to decide if low-friction micro-dose pacing should be nudged. */
function hasCompoundingFriction(profile?: Partial<UserLifestyleProfile>): boolean {
  if (!profile) return false;
  let score = 0;
  const rhythms = profile.culturalRhythms ?? [];
  const isFasting =
    Boolean(profile.isRamadanFastingObserver) ||
    rhythms.includes('ramadan_fasting') ||
    rhythms.includes('periodic_religious_fasting') ||
    rhythms.includes('intermittent_fasting');
  if (isFasting) score += 1;
  if (profile.workPattern === 'shift_work') score += 1;
  if (profile.climateSensitivity === 'summer_heat') score += 1;
  if ((profile.physicalCautions?.length ?? 0) > 0) score += 1;
  if ((profile.activeTags?.length ?? 0) >= 3) score += 1;
  return score >= 2;
}

/**
 * Enforces TrialN1 clinical safety guardrails over an AI-generated (or deterministic)
 * LifestyleAdaptationSpec: prevents load inflation, blocks unsafe medical claims,
 * validates step keys against the active routine, and injects policy safety bounds.
 */
export function validateAdaptationWithGuardrails(
  rawSpec: Partial<LifestyleAdaptationSpec>,
  routine: Routine | null | undefined,
  lifestyleProfile: Partial<UserLifestyleProfile> | undefined,
  policy: GuardrailPolicy
): LifestyleAdaptationSpec {
  const regionCity = lifestyleProfile?.region?.city?.trim();
  const regionCountry = lifestyleProfile?.region?.countryName?.trim() || lifestyleProfile?.region?.countryCode || 'Global';
  const regionLabel = regionCity ? `${regionCity}, ${regionCountry}` : regionCountry;

  const fallbackTitle = `${regionLabel} Lifestyle Adaptation`;
  const bannerTitle =
    rawSpec.bannerTitle && !containsUnsafeLifestyleGuidance(rawSpec.bannerTitle)
      ? rawSpec.bannerTitle.trim().slice(0, 90)
      : fallbackTitle;

  const safeFallbackGuidance =
    'Routine timing and environmental guidance adjusted to fit your daily schedule without exceeding trial dosing limits.';
  const bannerGuidance =
    rawSpec.bannerGuidance && !containsUnsafeLifestyleGuidance(rawSpec.bannerGuidance)
      ? rawSpec.bannerGuidance.trim().slice(0, 260)
      : safeFallbackGuidance;

  const suggestedWindow =
    rawSpec.suggestedWindow && !containsUnsafeLifestyleGuidance(rawSpec.suggestedWindow)
      ? rawSpec.suggestedWindow.trim().slice(0, 72)
      : 'Flexible waking window';

  let recommendedDoseMode: LifestyleAdaptationSpec['recommendedDoseMode'] =
    rawSpec.recommendedDoseMode === 'micro' || rawSpec.recommendedDoseMode === 'rest'
      ? rawSpec.recommendedDoseMode
      : 'standard';

  // Safety Guardrail: nudge micro-dose pacing when compounding fatigue/fasting/heat barriers stack
  if (recommendedDoseMode === 'standard' && hasCompoundingFriction(lifestyleProfile)) {
    recommendedDoseMode = 'micro';
  }

  const validStepIds = new Set((routine?.steps ?? []).map((s) => s.id));
  const stepTips: Record<string, string> = {};
  if (rawSpec.stepTips && typeof rawSpec.stepTips === 'object') {
    for (const [stepId, tip] of Object.entries(rawSpec.stepTips)) {
      if (validStepIds.size > 0 && !validStepIds.has(stepId)) continue;
      if (typeof tip !== 'string') continue;
      const trimmed = tip.trim().slice(0, 120);
      if (trimmed && !containsUnsafeLifestyleGuidance(trimmed)) {
        stepTips[stepId] = trimmed;
      }
    }
  }

  const safetyGuardrailNote = `Safety guardrail v${policy.version}: zero load inflation above study limits; pause escalation & reduce load ${policy.loadReductionPercent}% if symptoms reach ${policy.painEscalationThreshold}/10.`;

  return {
    bannerTitle,
    bannerGuidance,
    recommendedDoseMode,
    suggestedWindow,
    stepTips,
    ...(rawSpec.scheduleCompatibility
      ? { scheduleCompatibility: rawSpec.scheduleCompatibility }
      : {}),
    safetyGuardrailNote,
    guardrailVerified: true,
    source: rawSpec.source === 'gemini-global-ai' ? 'gemini-global-ai' : 'deterministic-fallback',
    regionLabel,
    generatedAt: rawSpec.generatedAt || new Date().toISOString()
  };
}
