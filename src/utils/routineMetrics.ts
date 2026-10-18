import {
  ADHERENCE_HIGH_MIN,
  ADHERENCE_MODERATE_MIN,
  DEFAULT_FEEDBACK_METRIC,
  FEEDBACK_ESCALATION_THRESHOLD,
  FEEDBACK_SCORE_MAX,
  FEEDBACK_SCORE_MIN,
  PROGRESSION_MAX_SCORE,
  PROGRESSION_WINDOW_LOGS
} from '../data/config';
import type {
  DataCollectionField,
  FeedbackLog,
  FeedbackMetric,
  PaperMeta,
  Routine
} from '../types/routine';
import { clamp, toPercent } from './math';

export function resolveFeedbackMetric(routine?: { feedbackMetric?: FeedbackMetric }): FeedbackMetric {
  return routine?.feedbackMetric ?? DEFAULT_FEEDBACK_METRIC;
}

export function resolveDataCollectionSpec(routine?: Routine): DataCollectionField[] {
  if (routine?.dataCollectionSpec && routine.dataCollectionSpec.length > 0) {
    return routine.dataCollectionSpec;
  }
  const metric = resolveFeedbackMetric(routine);
  return [
    {
      id: 'default-feedback-scale',
      name: metric.name,
      label: metric.label,
      type: 'scale',
      frequency: 'daily',
      min: 0,
      max: metric.maxScore ?? 10,
      step: 1,
      escalationThreshold: metric.escalationThreshold,
      escalationMessage: metric.escalationMessage
    }
  ];
}

export function isFieldScheduledForDay(field: DataCollectionField, day: number): boolean {
  if (field.frequency === 'daily') return true;
  if (field.frequency === 'milestone') return field.milestoneDays?.includes(day) ?? false;
  if (field.frequency === 'weekly') return day % 7 === 1 || day === 1;
  return true;
}

export function isMilestoneDay(routine?: Routine, day?: number): boolean {
  if (!routine || typeof day !== 'number') return false;
  const spec = resolveDataCollectionSpec(routine);
  return spec.some(
    (field) => field.frequency === 'milestone' && field.milestoneDays?.includes(day)
  );
}

export function getScheduledFieldsForDay(routine?: Routine, day?: number): DataCollectionField[] {
  if (!routine) return [];
  const targetDay = day ?? routine.currentDay;
  const spec = resolveDataCollectionSpec(routine);
  return spec.filter((field) => isFieldScheduledForDay(field, targetDay));
}

/** Fraction (0–1) of today's sets completed across all active (non-excluded) steps. */
export function completionOf(
  routine: Routine,
  setsDone: Record<string, number>,
  excludedStepIds: string[] = []
) {
  const activeSteps = routine.steps.filter((step) => !excludedStepIds.includes(step.id));
  const total = activeSteps.reduce((sum, step) => sum + step.sets, 0);
  const done = activeSteps.reduce(
    (sum, step) => sum + Math.min(setsDone[step.id] ?? 0, step.sets),
    0
  );
  return total === 0 ? 0 : done / total;
}

/** Average completion across every day so far, including today. */
export function adherenceOf(routine: Routine, todayFraction: number) {
  if (routine.currentDay <= 0) return 0;
  // History represents completed days prior to currentDay (days 1 .. currentDay - 1)
  const pastDaysCount = Math.max(0, routine.currentDay - 1);
  const pastHistory = routine.dayHistory.slice(0, pastDaysCount);
  const historySum = pastHistory.reduce((sum, value) => sum + value, 0);
  const rawRate = (historySum + Math.min(Math.max(0, todayFraction), 1)) / routine.currentDay;
  return clamp(toPercent(rawRate), 0, 100);
}

export function exceedsFeedbackThreshold(score: number, threshold = FEEDBACK_ESCALATION_THRESHOLD) {
  return score >= threshold;
}

export function clampFeedbackScore(score: number, max = FEEDBACK_SCORE_MAX, min = FEEDBACK_SCORE_MIN) {
  return clamp(score, min, max);
}

export function isProgressionReady(
  feedbackLogs: FeedbackLog[],
  escalationPaused: boolean,
  maxScore = PROGRESSION_MAX_SCORE
) {
  const recent = feedbackLogs.slice(-PROGRESSION_WINDOW_LOGS);
  return (
    !escalationPaused &&
    recent.length === PROGRESSION_WINDOW_LOGS &&
    recent.every((log) => log.score < maxScore)
  );
}

export type ComplianceLevel = 'high' | 'moderate' | 'low';

export function complianceLevel(adherenceRate: number): ComplianceLevel {
  if (adherenceRate >= ADHERENCE_HIGH_MIN) return 'high';
  if (adherenceRate >= ADHERENCE_MODERATE_MIN) return 'moderate';
  return 'low';
}

export type ProgressionStatus = 'paused' | 'ready' | 'holding';

export function progressionStatus(escalationPaused: boolean, progressionReady: boolean): ProgressionStatus {
  if (escalationPaused) return 'paused';
  if (progressionReady) return 'ready';
  return 'holding';
}

export function stopRuleOf(routine: Routine) {
  return routine.contraindications.find((item) => item.severity === 'stop');
}

export function isRandomizedTrial(paper: PaperMeta) {
  return paper.evidenceBadges.includes('rct');
}

/**
 * Evaluates whether all days in a routine schedule have been fully completed.
 * Returns true if:
 * - currentDay > totalDays
 * - currentDay >= totalDays and today's prescribed sets are completed (isTodayComplete)
 * - Or recorded dayHistory entries count meets or exceeds totalDays
 */
export function isRoutineCompleted(
  routine?: { currentDay: number; totalDays: number; dayHistory?: number[] } | null,
  isTodayComplete = false
): boolean {
  if (!routine || !routine.totalDays || routine.totalDays <= 0) return false;
  if (routine.dayHistory && routine.dayHistory.length >= routine.totalDays) return true;
  if (routine.currentDay > routine.totalDays) return true;
  return routine.currentDay >= routine.totalDays && isTodayComplete;
}

/** Applies the policy ledger threshold; returns the same routine when nothing changes. */
export function applyGuardrailThreshold(routine: Routine, threshold: number, message?: string): Routine {
  const needsUpdate = (target: { escalationThreshold?: number; escalationMessage?: string }) =>
    target.escalationThreshold !== threshold || (!!message && target.escalationMessage !== message);
  const appliesTo = (field: DataCollectionField) => field.type === 'scale' || field.escalationThreshold !== undefined;

  const metricChanged = !!routine.feedbackMetric && needsUpdate(routine.feedbackMetric);
  const specChanged = (routine.dataCollectionSpec || []).some((field) => appliesTo(field) && needsUpdate(field));
  if (!metricChanged && !specChanged) return routine;

  return {
    ...routine,
    feedbackMetric: routine.feedbackMetric
      ? {
          ...routine.feedbackMetric,
          escalationThreshold: threshold,
          escalationMessage: message || routine.feedbackMetric.escalationMessage
        }
      : routine.feedbackMetric,
    dataCollectionSpec: (routine.dataCollectionSpec || []).map((field) =>
      appliesTo(field)
        ? { ...field, escalationThreshold: threshold, escalationMessage: message || field.escalationMessage }
        : field
    )
  };
}
