import {
  ADHERENCE_HIGH_MIN,
  ADHERENCE_MODERATE_MIN,
  PAIN_ESCALATION_THRESHOLD,
  PAIN_SCORE_MAX,
  PAIN_SCORE_MIN,
  PROGRESSION_MAX_PAIN_SCORE,
  PROGRESSION_WINDOW_LOGS } from
'../data/config';
import type { PaperMeta, PainLog, Protocol } from '../types/protocol';
import { clamp, toPercent } from './math';

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
  const history = protocol.dayHistory.reduce((sum, value) => sum + value, 0);
  return toPercent((history + todayFraction) / protocol.currentDay);
}

export function exceedsPainThreshold(score: number) {
  return score >= PAIN_ESCALATION_THRESHOLD;
}

export function clampPainScore(score: number) {
  return clamp(score, PAIN_SCORE_MIN, PAIN_SCORE_MAX);
}

export function isProgressionReady(painLogs: PainLog[], escalationPaused: boolean) {
  const recent = painLogs.slice(-PROGRESSION_WINDOW_LOGS);
  return (
    !escalationPaused &&
    recent.length === PROGRESSION_WINDOW_LOGS &&
    recent.every((log) => log.score < PROGRESSION_MAX_PAIN_SCORE));

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