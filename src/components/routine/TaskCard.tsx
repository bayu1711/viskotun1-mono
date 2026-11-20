import React from 'react';
import AddIcon from '@mui/icons-material/Add';
import HelpOutlineOutlinedIcon from '@mui/icons-material/HelpOutlineOutlined';
import RemoveIcon from '@mui/icons-material/Remove';
import ScheduleOutlinedIcon from '@mui/icons-material/ScheduleOutlined';
import { useAssistant } from '../../contexts/AssistantContext';
import { useLocale } from '../../contexts/LocaleContext';
import { useRoutine } from '../../contexts/RoutineContext';
import { COPY } from '../../data/copy';
import type { RoutineStep } from '../../types/routine';
import { cn } from '../../utils/cn';
import { targetSetsForStep } from '../../utils/routineMetrics';
import { resolveStepTiming } from '../../utils/schedule';
import { getStepDisplay } from '../../utils/steps';
import { toneStyles } from '../../utils/tones';
import { CheckToggle } from '../ui/CheckToggle';
import { Icon } from '../ui/Icon';
import { StepIcon } from '../ui/StepIcon';
import { SetCounter } from './SetCounter';
import { TaskStatList } from './TaskStatList';

interface TaskCardProps {
  step: RoutineStep;
  wide?: boolean;
}

export function TaskCard({ step, wide = false }: TaskCardProps) {
  const {
    doseMode,
    setsDone,
    incrementSet,
    decrementSet,
    toggleStep,
    isStepComplete,
    isStepExcluded,
    toggleExcludeStep,
    activeAdaptation
  } = useRoutine();
  const { askAboutTask } = useAssistant();
  const { copy } = useLocale();
  const sCopy = copy.schedule;

  const excluded = isStepExcluded(step.id);
  const timing = resolveStepTiming(step);
  const isOnDemand = timing.type === 'on_demand';
  const isContinuous = timing.type === 'continuous';
  const adaptationTip = activeAdaptation?.stepTips?.[step.id];
  const targetSets = targetSetsForStep(step, doseMode);
  const rawDone = setsDone[step.id] ?? 0;
  const done = isOnDemand ? rawDone : Math.min(rawDone, targetSets);
  const complete = isStepComplete(step.id);
  const styles = toneStyles[step.tone];
  const display = getStepDisplay(step);

  if (excluded) {
    return (
      <article
        className={cn(
          'flex min-h-card flex-col rounded-card border border-dashed border-ink/20 bg-cream/40 p-4 opacity-75 sm:p-5 transition-opacity hover:opacity-100',
          wide && 'sm:col-span-2'
        )}
      >
        <div className="flex items-start gap-2">
          <span className="mt-0.5 opacity-40">
            <StepIcon icon={step.icon} size="md" />
          </span>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <h3 className="text-body font-medium leading-snug line-through text-ink/60">
                {step.action}
              </h3>
              <span className="rounded-full bg-ink/10 px-2 py-0.5 text-3xs font-medium uppercase tracking-wider text-ink/60">
                {COPY.task.excludedBadge}
              </span>
            </div>
            <p className="mt-1 text-2xs text-ink/60">{step.detail}</p>
          </div>
          <button
            type="button"
            onClick={() => toggleExcludeStep(step.id)}
            className="inline-flex min-h-11 items-center rounded-full border border-ink/20 bg-white px-3 text-2xs font-medium text-ink transition-colors hover:bg-mint hover:border-ink"
          >
            {COPY.task.restoreStep}
          </button>
        </div>

        <div className="mt-auto pt-4">
          <p className="text-2xs italic text-ink/60">
            {COPY.task.excludedNote}
          </p>
        </div>
      </article>
    );
  }

  return (
    <article className={cn('flex min-h-card flex-col rounded-card p-4 sm:p-5', styles.card, wide && 'sm:col-span-2')}>
      <div className="flex items-start gap-2">
        <span className="mt-0.5">
          <StepIcon icon={step.icon} size="md" />
        </span>
        <div className="flex-1">
          <h3
            className={cn(
              'leading-snug transition-opacity',
              wide ? 'text-2xl sm:text-title' : 'text-body',
              !isOnDemand && complete && 'opacity-50'
            )}
          >
            {step.action}
          </h3>

          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {step.tempo && (
              <span className="inline-flex items-center rounded-full bg-white/70 px-2 py-0.5 text-3xs font-medium tabular-nums text-ink">
                {COPY.task.tempoBadge(step.tempo)}
              </span>
            )}

            {(isOnDemand || isContinuous || timing.type === 'spaced' || timing.type === 'anchored') && (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/75 px-2 py-0.5 text-3xs font-medium text-ink/85">
                <Icon icon={ScheduleOutlinedIcon} size="xs" />
                <span>{sCopy.archetypeLabels[timing.type]}</span>
              </span>
            )}
          </div>

          {adaptationTip && (
            <p className="mt-1.5 inline-flex items-center gap-1 rounded-full border border-ink/10 bg-cream/85 px-2.5 py-0.5 text-3xs font-medium text-ink/85">
              <span>{adaptationTip}</span>
            </p>
          )}

          {step.inferred && (
            <div className="mt-1 flex flex-wrap items-center gap-1.5 text-2xs">
              <span className="text-3xs text-ink/80">
                {step.inferredProvenance?.tier === 'lineage'
                  ? COPY.task.lineageBadge(step.inferredProvenance.source)
                  : COPY.task.inferredBadge(step.inferredProvenance?.source)}
              </span>
              <span className="text-3xs text-ink/30">·</span>
              <button
                type="button"
                onClick={() => toggleExcludeStep(step.id)}
                className="inline-flex min-h-11 items-center text-3xs text-ink/80 underline decoration-dotted transition-colors hover:text-ink hover:opacity-100"
                title={COPY.task.excludedNote}
              >
                {COPY.task.excludeStep}
              </button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              askAboutTask(step);
            }}
            aria-label={COPY.task.helpAriaLabel(step.action)}
            title={COPY.task.helpTooltip(step.action)}
            className="relative flex h-7 w-7 items-center justify-center rounded-full border border-ink/15 bg-white/80 text-ink/60 transition-colors before:absolute before:-inset-2 hover:border-ink hover:bg-mint hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-ink"
          >
            <Icon icon={HelpOutlineOutlinedIcon} size="xs" />
          </button>
          {!isOnDemand && (
            <CheckToggle checked={complete} onToggle={() => toggleStep(step.id)} itemLabel={step.action} tone={step.tone} />
          )}
        </div>
      </div>

      {wide && <TaskStatList step={step} display={display} />}

      {isOnDemand ? (
        <div className="mt-auto pt-5 space-y-2.5">
          <div className="flex items-baseline gap-2">
            <p className="text-metric font-light leading-none tabular-nums">
              {done}
              <span className={cn('ml-1.5 text-sm', styles.muted)}>{sCopy.onDemandCounterLabel}</span>
            </p>
          </div>
          <p className={cn('text-3xs leading-snug', styles.muted)}>{sCopy.onDemandOptionalHint}</p>
          <div className="flex items-center gap-2 pt-0.5">
            <button
              type="button"
              onClick={() => incrementSet(step.id)}
              className="inline-flex min-h-11 items-center gap-1 rounded-full bg-ink px-4 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90 cursor-pointer"
            >
              <Icon icon={AddIcon} size="xs" />
              <span>{sCopy.onDemandLogBtn.replace(/^\+\s*/, '')}</span>
            </button>
            {done > 0 && (
              <button
                type="button"
                onClick={() => decrementSet(step.id)}
                aria-label={COPY.task.decrease(step.action)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-ink/20 bg-white/80 text-ink hover:border-ink cursor-pointer"
              >
                <Icon icon={RemoveIcon} size="xs" />
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="mt-auto pt-5">
          <p className="text-metric font-light leading-none tabular-nums">
            {done}
            <span className={styles.muted}> / {targetSets}</span>
            <span className={cn('ml-1.5 text-sm', styles.muted)}>
              {isContinuous
                ? complete
                  ? sCopy.continuousConfirmLabel
                  : sCopy.continuousPendingLabel
                : display.setLabel}
            </span>
            {doseMode === 'micro' && (
              <span className="ml-2 inline-flex items-center rounded bg-mint px-1.5 py-0.5 text-3xs font-semibold text-ink">
                {COPY.task.microBadge}
              </span>
            )}
          </p>
          <SetCounter
            action={step.action}
            done={done}
            max={targetSets}
            perSetLabel={display.perSet}
            tone={step.tone}
            onIncrement={() => incrementSet(step.id)}
            onDecrement={() => decrementSet(step.id)}
          />
        </div>
      )}
    </article>
  );
}
