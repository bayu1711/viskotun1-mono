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
  DoseMode,
  FeedbackLog,
  FeedbackMetric,
  MorphingDataLog,
  PaperMeta,
  Routine,
  RoutineStep,
  RoutineSummary
} from '../types/routine';
import { clamp, toPercent } from './math';
import { normalizeDoi } from './paperFingerprint';
import { isOnDemandStep } from './schedule';

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

/**
 * Resolves only real user-logged biomarker data points (no synthetic/simulated points).
 * Deduplicates multiple entries on the same day by keeping the latest reading, sorted by day.
 */
export function resolveBiomarkerPoints(
  field: DataCollectionField | undefined,
  morphingLogs: MorphingDataLog[] = [],
  feedbackLogs: FeedbackLog[] = []
): Array<{ day: number; value: number }> {
  if (!field) return [];

  const byDay = new Map<number, number>();

  for (const log of morphingLogs) {
    if (log.fieldId === field.id && typeof log.value === 'number' && !Number.isNaN(log.value)) {
      byDay.set(log.day, Number(log.value));
    }
  }

  // Fall back to feedbackLogs when viewing a scale field that was logged via the standard feedback drawer
  if (byDay.size === 0 && field.type === 'scale' && feedbackLogs.length > 0) {
    for (const log of feedbackLogs) {
      if (typeof log.score === 'number' && !Number.isNaN(log.score)) {
        byDay.set(log.day, log.score);
      }
    }
  }

  return Array.from(byDay.entries())
    .map(([day, value]) => ({ day, value }))
    .sort((a, b) => a.day - b.day);
}

/**
 * Resolves target reference bounds for a biomarker field from the routine definition
 * (explicit targetMin/targetMax or safe range below escalationThreshold), with no hardcoded string heuristics.
 */
export function resolveFieldTargetBounds(field: DataCollectionField | undefined): {
  targetMin?: number;
  targetMax?: number;
} {
  if (!field) return {};

  if (typeof field.targetMin === 'number' || typeof field.targetMax === 'number') {
    return {
      targetMin: field.targetMin,
      targetMax: field.targetMax
    };
  }

  const threshold = fieldEscalationThreshold(field);
  if (typeof threshold === 'number') {
    return {
      targetMin: field.min ?? 0,
      targetMax: Math.max(field.min ?? 0, threshold - (field.step ?? 1))
    };
  }

  return {};
}

/**
 * Resolves milestone days for a photo or milestone field from the routine specification,
 * clipped to totalDays rather than a hardcoded 84-day array.
 */
export function resolveMilestoneDays(
  field: DataCollectionField | undefined,
  totalDays = 14
): number[] {
  const safeTotal = Math.max(2, totalDays);
  if (field?.milestoneDays && field.milestoneDays.length > 0) {
    const valid = Array.from(
      new Set(field.milestoneDays.filter((d) => d >= 1 && d <= safeTotal))
    ).sort((a, b) => a - b);
    if (valid.length > 0) {
      return valid.includes(1) ? valid : [1, ...valid];
    }
  }

  const mid = Math.max(2, Math.round(safeTotal / 2));
  return Array.from(new Set([1, mid, safeTotal])).sort((a, b) => a - b);
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

/** Target number of sets for a step under the given dose mode. */
export function targetSetsForStep(step: RoutineStep, doseMode: DoseMode = 'standard'): number {
  if (doseMode === 'micro') {
    return 1;
  }
  if (doseMode === 'rest') {
    return 0;
  }
  return step.sets;
}

/**
 * Fraction (0–1) of today's required steps completed across all active (non-excluded) steps, scaled by dose mode.
 * On-demand / trigger-based steps (e.g. smoking craving urge-surfing) are anytime tools and do not block
 * 100% daily completion when zero triggers occur, as long as the routine has scheduled or continuous steps.
 */
export function completionOf(
  routine: Routine,
  setsDone: Record<string, number>,
  excludedStepIds: string[] = [],
  doseMode: DoseMode = 'standard'
): number {
  const activeSteps = routine.steps.filter((step) => !excludedStepIds.includes(step.id));
  if (activeSteps.length === 0) return 0;

  const nonTriggerSteps = activeSteps.filter((step) => !isOnDemandStep(step));
  const countedSteps = nonTriggerSteps.length > 0 ? nonTriggerSteps : activeSteps;

  if (doseMode === 'micro') {
    // In micro-dose mode: target is 1 set per active required step to preserve neural & behavioral habit loops
    const targetSets = countedSteps.map((step) => ({
      id: step.id,
      target: 1
    }));
    const total = targetSets.reduce((sum, item) => sum + item.target, 0);
    const done = targetSets.reduce(
      (sum, item) => sum + Math.min(setsDone[item.id] ?? 0, item.target),
      0
    );
    return total === 0 ? 0 : done / total;
  }

  if (doseMode === 'rest') {
    // In active rest mode, any logged action or check-in completes the day
    const anySets = Object.values(setsDone).some((v) => v > 0);
    return anySets ? 1 : 0;
  }

  const total = countedSteps.reduce((sum, step) => sum + step.sets, 0);
  const done = countedSteps.reduce(
    (sum, step) => sum + Math.min(setsDone[step.id] ?? 0, step.sets),
    0
  );
  return total === 0 ? 0 : done / total;
}

/**
 * Calculates a non-punitive consistency / momentum score (0-100%).
 * Unlike a rigid streak that zeroes out on a single missed day,
 * the Momentum Index rewards active days and successful recovery days,
 * applying a gentle decay rather than an immediate wipeout.
 */
export function momentumOf(
  routine: Routine,
  todayFraction: number,
  streak: number
): number {
  if (routine.currentDay <= 0) return 0;
  const adherence = adherenceOf(routine, todayFraction);
  const streakBonus = Math.min(20, streak * 2);
  return clamp(Math.round(adherence * 0.8 + streakBonus), 0, 100);
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

export interface PaperRoutineStatusInput {
  paper: {
    id: string;
    routineId?: string;
    doi?: string;
  };
  routines: RoutineSummary[];
  activeRoutine?: {
    id: string;
    currentDay: number;
    totalDays: number;
    dayHistory?: number[];
    paper?: { doi?: string };
  } | null;
  currentActiveId?: string;
  dayIsComplete?: boolean;
  todayFraction?: number;
  currentDay?: number;
  totalDays?: number;
}

export interface PaperRoutineStatusResult {
  targetId?: string;
  routineIdForActions?: string;
  matchedSummary?: RoutineSummary;
  isActive: boolean;
  isInRoutine: boolean;
  isCompleted: boolean;
}

/**
 * Resolves whether a trending/sample paper is currently in the user's routines
 * (either selected as the active routine or saved as another routine in progress/completed).
 */
export function resolvePaperRoutineStatus({
  paper,
  routines,
  activeRoutine,
  currentActiveId,
  dayIsComplete = false,
  todayFraction = 0,
  currentDay = 1,
  totalDays = 14
}: PaperRoutineStatusInput): PaperRoutineStatusResult {
  const targetId = paper.routineId;
  const normPaperDoi = normalizeDoi(paper.doi);

  const matchedSummary = routines.find(
    (r) =>
      (targetId && r.id === targetId) ||
      r.id === paper.id ||
      Boolean(normPaperDoi && r.doi && normalizeDoi(r.doi) === normPaperDoi)
  );

  const resolvedActiveId = activeRoutine?.id || currentActiveId;
  const isActive = Boolean(
    resolvedActiveId &&
      ((targetId && resolvedActiveId === targetId) ||
        resolvedActiveId === paper.id ||
        (matchedSummary && resolvedActiveId === matchedSummary.id) ||
        (normPaperDoi &&
          activeRoutine?.paper?.doi &&
          normalizeDoi(activeRoutine.paper.doi) === normPaperDoi))
  );

  const isInRoutine = Boolean(matchedSummary || isActive);
  const routineIdForActions = matchedSummary?.id || targetId;

  const isCompleted = isInRoutine
    ? isActive
      ? isRoutineCompleted(
          activeRoutine ?? matchedSummary ?? { currentDay, totalDays },
          dayIsComplete || todayFraction >= 1
        )
      : matchedSummary
      ? isRoutineCompleted(matchedSummary, matchedSummary.todayFraction >= 1)
      : false
    : false;

  return {
    targetId,
    routineIdForActions,
    matchedSummary,
    isActive,
    isInRoutine,
    isCompleted
  };
}

type EscalationTarget = Pick<FeedbackMetric, 'escalationThreshold' | 'escalationMessage' | 'escalationSource'>;

/** Paper-specific advice (escalationSource 'routine') survives policy message changes. */
function policyMessageFor<T extends EscalationTarget>(target: T, message?: string) {
  const isRoutineAuthored = target.escalationSource === 'routine';
  return message && !isRoutineAuthored ? message : target.escalationMessage;
}

/**
 * Threshold that triggers an escalation for a logged field value, or undefined when the field
 * never escalates. Scale fields fall back to the default pain threshold; numeric, timer and
 * other measurements (blood pressure, minutes asleep) escalate only with an explicit threshold.
 */
export function fieldEscalationThreshold(field: DataCollectionField): number | undefined {
  if (field.escalationThreshold !== undefined) return field.escalationThreshold;
  return field.type === 'scale' ? FEEDBACK_ESCALATION_THRESHOLD : undefined;
}

export function fieldValueExceedsThreshold(field: DataCollectionField, value: unknown): boolean {
  const threshold = fieldEscalationThreshold(field);
  return typeof value === 'number' && threshold !== undefined && exceedsFeedbackThreshold(value, threshold);
}

/** Applies the policy ledger threshold; returns the same routine when nothing changes. */
export function applyGuardrailThreshold(routine: Routine, threshold: number, message?: string): Routine {
  const needsUpdate = (target: EscalationTarget) =>
    target.escalationThreshold !== threshold || target.escalationMessage !== policyMessageFor(target, message);
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
          escalationMessage: policyMessageFor(routine.feedbackMetric, message)
        }
      : routine.feedbackMetric,
    dataCollectionSpec: (routine.dataCollectionSpec || []).map((field) =>
      appliesTo(field)
        ? { ...field, escalationThreshold: threshold, escalationMessage: policyMessageFor(field, message) }
        : field
    )
  };
}
