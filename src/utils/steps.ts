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
  const summaryValue =
  step.statValue ?? (isTimed ? COPY.task.holdSummary(seconds) : COPY.task.repsSummary(step.reps));

  return {
    setLabel,
    perSet: step.perSetLabel ?? (isTimed ? COPY.task.perSetHold(seconds) : COPY.task.perSetReps(step.reps)),
    statLabel: step.statLabel ?? (isTimed ? COPY.task.holdStatLabel : COPY.task.repsStatLabel),
    statValue: step.statValue ?? (isTimed ? COPY.task.holdValue(seconds) : String(step.reps)),
    summary: `${step.sets} ${setLabel} · ${summaryValue}`
  };
}

/** The last step spans both columns when the grid would otherwise leave a gap. */
export function isWideStep(index: number, total: number) {
  return index === total - 1 && total % 2 === 1;
}