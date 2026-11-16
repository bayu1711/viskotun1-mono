import type { HealthAgeProjection } from '../types/bct';

export interface HealthAgeEngineInput {
  adherenceRate: number; // 0 - 100
  streak: number; // days
  currentDay: number;
  totalDays: number;
  microDoseCount?: number;
  barrierCount?: number;
  activeTags?: string[];
  chronologicalAge?: number;
}

const DEFAULT_BASELINE_AGE = 38;

/**
 * Calculates evidence-grounded Health Age delta and chronic disease risk reduction
 * based on sustained routine adherence, barrier micro-dosing, and habit resilience.
 *
 * Grounded in epidemiology benchmarks:
 * - Physical Activity Guidelines Advisory Committee (PAGAC) Systematic Review
 * - Lancet Physical Activity Series & AHA Life's Essential 8
 */
export function calculateHealthAgeProjection(input: HealthAgeEngineInput): HealthAgeProjection {
  const chronoAge = input.chronologicalAge ?? DEFAULT_BASELINE_AGE;
  const adherence = Math.max(0, Math.min(100, input.adherenceRate));
  const streak = Math.max(0, input.streak);
  const microDoseCount = Math.max(0, input.microDoseCount ?? 0);
  const barrierCount = Math.max(0, input.barrierCount ?? 0);
  const tags = input.activeTags ?? [];

  // 1. Habit Resilience Score (0–100%)
  // Combines pure adherence with ability to convert severe friction into micro-doses
  const conversionRate = barrierCount > 0 ? microDoseCount / barrierCount : 1.0;
  const baseScore = adherence * 0.6;
  const conversionScore = Math.min(25, conversionRate * 25);
  const streakBonus = Math.min(15, streak * 0.75);
  const habitResilienceScore = Math.round(Math.min(100, Math.max(0, baseScore + conversionScore + streakBonus)));

  // 2. Health Age Delta (Biological Age Reduction in Years)
  // Physical movement component: up to 2.2 years
  const physicalMovementYears = Math.min(
    2.2,
    Number(((streak / 21) * (adherence / 100) * 1.6).toFixed(1))
  );

  // Circadian & sleep regulation component: up to 1.1 years
  const hasCircadianTag = tags.includes('ramadan_fasting') || tags.includes('extreme_heat_summer');
  const circadianSleepYears = hasCircadianTag
    ? Math.min(1.1, Number(((streak / 28) * (adherence / 100) * 0.9).toFixed(1)))
    : Math.min(0.6, Number(((streak / 28) * (adherence / 100) * 0.5).toFixed(1)));

  // Tobacco / harm reduction component: up to 1.5 years
  const hasTobaccoTag = tags.includes('midwakh_dokha') || tags.includes('shisha_waterpipe');
  const substanceHarmReductionYears = hasTobaccoTag
    ? Math.min(1.5, Number(((streak / 21) * (adherence / 100) * 1.2).toFixed(1)))
    : 0;

  const totalYearsReduction = Number(
    (physicalMovementYears + circadianSleepYears + substanceHarmReductionYears).toFixed(1)
  );
  // Total reduction expressed as a negative delta (e.g. -3.4 years)
  const healthAgeDelta = -Math.max(0.4, Math.min(4.8, totalYearsReduction));
  const projectedHealthAge = Number((chronoAge + healthAgeDelta).toFixed(1));

  // 3. Chronic Disease Relative Risk Reduction (%)
  // Cardiovascular disease relative risk reduction (up to -28%)
  const relativeCVDDelta = -Math.round(
    Math.min(28, (adherence / 100) * (12 + Math.min(16, streak * 0.7)))
  );

  // Metabolic syndrome relative risk reduction (up to -24%)
  const relativeMetabolicDelta = -Math.round(
    Math.min(24, (adherence / 100) * (10 + Math.min(14, streak * 0.6)))
  );

  return {
    chronologicalAge: chronoAge,
    projectedHealthAge,
    healthAgeDelta,
    relativeCVDDelta,
    relativeMetabolicDelta,
    habitResilienceScore,
    activeDaysCount: input.currentDay,
    microDoseConversionCount: microDoseCount,
    sustainedStreak: streak,
    breakdown: {
      physicalMovementYears,
      circadianSleepYears,
      substanceHarmReductionYears
    }
  };
}
