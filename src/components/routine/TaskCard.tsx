import React from 'react';
import { useRoutine } from '../../contexts/RoutineContext';
import { COPY } from '../../data/copy';
import type { RoutineStep, ProtocolStep } from '../../types/routine';
import { cn } from '../../utils/cn';
import { getStepDisplay } from '../../utils/steps';
import { toneStyles } from '../../utils/tones';
import { CheckToggle } from '../ui/CheckToggle';
import { StepIcon } from '../ui/StepIcon';
import { SetCounter } from './SetCounter';
import { TaskStatList } from './TaskStatList';

interface TaskCardProps {
  step: RoutineStep | ProtocolStep;
  wide?: boolean;
}

export function TaskCard({ step, wide = false }: TaskCardProps) {
  const {
    setsDone,
    incrementSet,
    decrementSet,
    toggleStep,
    isStepComplete,
    isStepExcluded,
    toggleExcludeStep
  } = useRoutine();
  const excluded = isStepExcluded(step.id);
  const done = Math.min(setsDone[step.id] ?? 0, step.sets);
  const complete = isStepComplete(step.id);
  const styles = toneStyles[step.tone];
  const display = getStepDisplay(step);

  if (excluded) {
    return (
      <article
        className={cn(
          'flex min-h-card flex-col rounded-card border border-dashed border-ink/20 bg-cream/40 p-4 opacity-75 sm:p-5 transition-opacity hover:opacity-100',
          wide && 'col-span-2'
        )}
      >
        <div className="flex items-start gap-2">
          <span className="mt-0.5 opacity-40">
            <StepIcon icon={step.icon} size="md" />
          </span>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <h3 className="text-body font-medium leading-snug line-through text-ink/50">
                {step.action}
              </h3>
              <span className="rounded-full bg-ink/10 px-2 py-0.5 text-3xs font-medium uppercase tracking-wider text-ink/60">
                {COPY.task.excludedBadge}
              </span>
            </div>
            <p className="mt-1 text-2xs text-ink/50">{step.detail}</p>
          </div>
          <button
            type="button"
            onClick={() => toggleExcludeStep(step.id)}
            className="rounded-full border border-ink/20 bg-white px-2.5 py-1 text-2xs font-medium text-ink shadow-2xs transition-colors hover:bg-mint hover:border-ink"
          >
            {COPY.task.restoreStep}
          </button>
        </div>

        <div className="mt-auto pt-4">
          <p className="text-2xs italic text-ink/45">
            {COPY.task.excludedNote}
          </p>
        </div>
      </article>
    );
  }

  return (
    <article className={cn('flex min-h-card flex-col rounded-card p-4 sm:p-5', styles.card, wide && 'col-span-2')}>
      <div className="flex items-start gap-2">
        <span className="mt-0.5">
          <StepIcon icon={step.icon} size="md" />
        </span>
        <div className="flex-1">
          <h3
            className={cn(
              'leading-snug transition-opacity',
              wide ? 'text-2xl sm:text-title' : 'text-body',
              complete && 'opacity-50'
            )}
          >
            {step.action}
          </h3>

          {step.inferred && (
            <div className="mt-1 flex flex-wrap items-center gap-1.5 text-2xs">
              <span className="inline-flex items-center rounded-full border border-ink/15 bg-white/70 px-2 py-0.5 font-medium text-ink/80 shadow-2xs">
                {step.inferredProvenance?.tier === 'lineage'
                  ? COPY.task.lineageBadge(step.inferredProvenance.source)
                  : COPY.task.inferredBadge(step.inferredProvenance?.source)}
              </span>
              <button
                type="button"
                onClick={() => toggleExcludeStep(step.id)}
                className="text-3xs text-ink/45 underline decoration-dotted transition-colors hover:text-ink hover:opacity-100"
                title={COPY.task.excludedNote}
              >
                {COPY.task.excludeStep}
              </button>
            </div>
          )}
        </div>
        <CheckToggle checked={complete} onToggle={() => toggleStep(step.id)} itemLabel={step.action} tone={step.tone} />
      </div>

      {wide && <TaskStatList step={step} display={display} />}

      <div className="mt-auto pt-5">
        <p className="text-metric font-light leading-none tabular-nums">
          {done}
          <span className={styles.muted}> / {step.sets}</span>
          <span className={cn('ml-1.5 text-sm', styles.muted)}>{display.setLabel}</span>
        </p>
        <SetCounter
          action={step.action}
          done={done}
          max={step.sets}
          perSetLabel={display.perSet}
          tone={step.tone}
          onIncrement={() => incrementSet(step.id)}
          onDecrement={() => decrementSet(step.id)}
        />

        {step.inferred && wide && (
          <p className={cn('mt-3 text-xs', styles.muted)}>
            {step.inferredProvenance?.rationale || COPY.task.inferredNote}
          </p>
        )}
      </div>
    </article>
  );
}