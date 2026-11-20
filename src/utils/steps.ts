import { COPY } from '../data/copy';
import type { LocaleCopy } from '../data/locales/types';
import type { RoutineStep } from '../types/routine';
import { formatStatLabel } from './text';

export interface StepDisplay {
  setLabel: string;
  perSet: string;
  statLabel: string;
  statValue: string;
  /** Compact "3 sets · 15 reps" summary for list rows */
  summary: string;
}

/** Resolves display strings for a step, falling back to reps or hold time when the paper omits labels. */
/** Pass the locale copy from `useLocale()` so labels follow the app language (defaults to English). */
export function getStepDisplay(step: RoutineStep, copy?: LocaleCopy): StepDisplay {
  const t = (copy ?? COPY).task;
  const seconds = step.durationSeconds ?? 0;
  const isTimed = seconds > 0;
  const setLabel = step.setLabel ?? t.defaultSetLabel;
  const isSingleUnit = step.reps === 1 && step.setLabel && step.setLabel !== COPY.task.defaultSetLabel /* stored data is English */;

  const defaultPerSet = isTimed
    ? t.perSetHold(seconds)
    : isSingleUnit
    ? t.singleUnitPerSet(setLabel)
    : t.perSetReps(step.reps);

  const defaultStatLabel = isTimed
    ? t.holdStatLabel
    : isSingleUnit
    ? t.targetStatLabel
    : t.repsStatLabel;

  const defaultStatValue = isTimed
    ? t.holdValue(seconds)
    : isSingleUnit
    ? t.singleUnitStat(setLabel)
    : String(step.reps);

  const summaryValue =
    step.statValue ?? (isTimed ? t.holdSummary(seconds) : isSingleUnit ? t.singleUnitStat(setLabel) : t.repsSummary(step.reps));

  return {
    setLabel,
    perSet: step.perSetLabel ?? defaultPerSet,
    statLabel: formatStatLabel(step.statLabel ?? defaultStatLabel),
    statValue: step.statValue ?? defaultStatValue,
    summary: `${step.sets} ${setLabel} · ${summaryValue}`
  };
}

/** The last step spans both columns when the grid would otherwise leave a gap. */
export function isWideStep(index: number, total: number) {
  return index === total - 1 && total % 2 === 1;
}