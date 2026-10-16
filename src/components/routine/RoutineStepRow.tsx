import React from 'react';
import { useRoutine } from '../../contexts/RoutineContext';
import { COPY } from '../../data/copy';
import type { RoutineStep } from '../../types/routine';
import { cn } from '../../utils/cn';
import { getStepDisplay } from '../../utils/steps';
import { CheckToggle } from '../ui/CheckToggle';
import { IconTile } from '../ui/IconTile';
import { StepIcon } from '../ui/StepIcon';

interface RoutineStepRowProps {
  step: RoutineStep;
}

export function RoutineStepRow({ step }: RoutineStepRowProps) {
  const { isStepComplete, toggleStep } = useRoutine();
  const complete = isStepComplete(step.id);
  const display = getStepDisplay(step);

  return (
    <li className="flex items-center gap-3 rounded-tile border border-ink p-2.5 pr-3">
      <IconTile variant="solid" size={40}>
        <StepIcon icon={step.icon} size="md" />
      </IconTile>
      <div className="min-w-0 flex-1">
        <p className={cn('text-sm lowercase leading-snug', complete && 'text-ink/40 line-through')}>{step.action}</p>
        <p className="mt-0.5 text-xs lowercase text-ink/45">
          {display.summary} · {step.frequency}
          {step.inferred && <span className="text-warning">{COPY.protocolCard.defaulted}</span>}
        </p>
      </div>
      <CheckToggle checked={complete} onToggle={() => toggleStep(step.id)} itemLabel={step.action} />
    </li>
  );
}

export const ProtocolStepRow = RoutineStepRow;
