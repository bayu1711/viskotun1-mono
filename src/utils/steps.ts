import { COPY } from '../data/copy';
import type { ProtocolStep } from '../types/protocol';

export interface StepDisplay {
  setLabel: string;
  perSet: string;
  statLabel: string;
  statValue: string;
  /** Compact "3 sets · 15 reps" summary for list rows */
  summary: string;
}

/** Resolves display strings for a step, falling back to reps or hold time when the paper omits labels. */
export function getStepDisplay(step: ProtocolStep): StepDisplay {
  const seconds = step.durationSeconds ?? 0;
  const isTimed = seconds > 0;
  const setLabel = step.setLabel ?? COPY.task.defaultSetLabel;
  const isSingleUnit = step.reps === 1 && step.setLabel && step.setLabel !== 'sets';

  const defaultPerSet = isTimed
    ? COPY.task.perSetHold(seconds)
    : isSingleUnit
    ? `× 1 ${setLabel}`
    : COPY.task.perSetReps(step.reps);

  const defaultStatLabel = isTimed
    ? COPY.task.holdStatLabel
    : isSingleUnit
    ? COPY.task.targetStatLabel
    : COPY.task.repsStatLabel;

  const defaultStatValue = isTimed
    ? COPY.task.holdValue(seconds)
    : isSingleUnit
    ? `1 ${setLabel}`
    : String(step.reps);

  const summaryValue =
    step.statValue ?? (isTimed ? COPY.task.holdSummary(seconds) : isSingleUnit ? `1 ${setLabel}` : COPY.task.repsSummary(step.reps));

  return {
    setLabel,
    perSet: step.perSetLabel ?? defaultPerSet,
    statLabel: step.statLabel ?? defaultStatLabel,
    statValue: step.statValue ?? defaultStatValue,
    summary: `${step.sets} ${setLabel} · ${summaryValue}`
  };
}

/** The last step spans both columns when the grid would otherwise leave a gap. */
export function isWideStep(index: number, total: number) {
  return index === total - 1 && total % 2 === 1;
}