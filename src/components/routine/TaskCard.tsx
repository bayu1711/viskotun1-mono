import React from 'react';
import { useProtocol } from '../../contexts/ProtocolContext';
import { COPY } from '../../data/copy';
import type { ProtocolStep } from '../../types/protocol';
import { cn } from '../../utils/cn';
import { getStepDisplay } from '../../utils/steps';
import { toneStyles } from '../../utils/tones';
import { CheckToggle } from '../ui/CheckToggle';
import { StepIcon } from '../ui/StepIcon';
import { SetCounter } from './SetCounter';
import { TaskStatList } from './TaskStatList';

interface TaskCardProps {
  step: ProtocolStep;
  wide?: boolean;
}

export function TaskCard({ step, wide = false }: TaskCardProps) {
  const { setsDone, incrementSet, decrementSet, toggleStep, isStepComplete } = useProtocol();
  const done = Math.min(setsDone[step.id] ?? 0, step.sets);
  const complete = isStepComplete(step.id);
  const styles = toneStyles[step.tone];
  const display = getStepDisplay(step);

  return (
    <article className={cn('flex min-h-card flex-col rounded-card p-4 sm:p-5', styles.card, wide && 'col-span-2')}>
      <div className="flex items-start gap-2">
        <span className="mt-0.5">
          <StepIcon icon={step.icon} size="md" />
        </span>
        <h3
          className={cn(
            'flex-1 lowercase leading-snug transition-opacity',
            wide ? 'text-2xl sm:text-title' : 'text-body',
            complete && 'opacity-50'
          )}>
          
          {step.action}
        </h3>
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
          onDecrement={() => decrementSet(step.id)} />
        
        {step.inferred && wide && <p className={cn('mt-3 text-xs lowercase', styles.muted)}>{COPY.task.inferredNote}</p>}
      </div>
    </article>);

}