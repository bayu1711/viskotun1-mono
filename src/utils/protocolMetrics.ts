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
  Protocol
} from '../types/protocol';
import { clamp, toPercent } from './math';

export function resolveFeedbackMetric(protocol?: { feedbackMetric?: FeedbackMetric }): FeedbackMetric {
  return protocol?.feedbackMetric ?? DEFAULT_FEEDBACK_METRIC;
}

export function resolveDataCollectionSpec(protocol?: Protocol): DataCollectionField[] {
  if (protocol?.dataCollectionSpec && protocol.dataCollectionSpec.length > 0) {
    return protocol.dataCollectionSpec;
  }
  const metric = resolveFeedbackMetric(protocol);
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

export function isMilestoneDay(protocol?: Protocol, day?: number): boolean {
  if (!protocol || typeof day !== 'number') return false;
  const spec = resolveDataCollectionSpec(protocol);
  return spec.some(
    (field) => field.frequency === 'milestone' && field.milestoneDays?.includes(day)
  );
}

export function getScheduledFieldsForDay(protocol?: Protocol, day?: number): DataCollectionField[] {
  if (!protocol) return [];
  const targetDay = day ?? protocol.currentDay;
  const spec = resolveDataCollectionSpec(protocol);
  return spec.filter((field) => {
    if (field.frequency === 'daily') return true;
    if (field.frequency === 'milestone') return field.milestoneDays?.includes(targetDay);
    if (field.frequency === 'weekly') return targetDay % 7 === 1 || targetDay === 1;
    return true;
  });
}

/** Fraction (0–1) of today's sets completed across all steps. */
export function completionOf(protocol: Protocol, setsDone: Record<string, number>) {
  const total = protocol.steps.reduce((sum, step) => sum + step.sets, 0);
  const done = protocol.steps.reduce(
    (sum, step) => sum + Math.min(setsDone[step.id] ?? 0, step.sets),
    0
  );
  return total === 0 ? 0 : done / total;
}

/** Average completion across every day so far, including today. */
export function adherenceOf(protocol: Protocol, todayFraction: number) {
  if (protocol.currentDay <= 0) return 0;
  // History represents completed days prior to currentDay (days 1 .. currentDay - 1)
  const pastDaysCount = Math.max(0, protocol.currentDay - 1);
  const pastHistory = protocol.dayHistory.slice(0, pastDaysCount);
  const historySum = pastHistory.reduce((sum, value) => sum + value, 0);
  const rawRate = (historySum + Math.min(Math.max(0, todayFraction), 1)) / protocol.currentDay;
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

export function stopRuleOf(protocol: Protocol) {
  return protocol.contraindications.find((item) => item.severity === 'stop');
}

export function isRandomizedTrial(paper: PaperMeta) {
  return paper.evidenceBadges.includes('rct');
}