import React from 'react';
import HelpOutlineOutlinedIcon from '@mui/icons-material/HelpOutlineOutlined';
import { useAssistant } from '../../contexts/AssistantContext';
import { useRoutine } from '../../contexts/RoutineContext';
import { COPY } from '../../data/copy';
import type { RoutineStep } from '../../types/routine';
import { cn } from '../../utils/cn';
import { getStepDisplay } from '../../utils/steps';
import { CheckToggle } from '../ui/CheckToggle';
import { Icon } from '../ui/Icon';
import { IconTile } from '../ui/IconTile';
import { StepIcon } from '../ui/StepIcon';

interface RoutineStepRowProps {
  step: RoutineStep;
}

export function RoutineStepRow({ step }: RoutineStepRowProps) {
  const { isStepComplete, toggleStep } = useRoutine();
  const { askAboutTask } = useAssistant();
  const complete = isStepComplete(step.id);
  const display = getStepDisplay(step);

  return (
    <li className="flex items-center gap-3 rounded-tile border border-ink p-2.5 pr-3">
      <IconTile variant="solid" size={40}>
        <StepIcon icon={step.icon} size="md" />
      </IconTile>
      <div className="min-w-0 flex-1">
        <p className={cn('text-sm leading-snug', complete && 'text-ink/60 line-through')}>{step.action}</p>
        <p className="mt-0.5 text-xs text-ink/60">
          {display.summary} · {step.frequency}
          {step.inferred && (
            <span className="ml-1 text-3xs text-ink/50">
              · {step.inferredProvenance?.tier === 'lineage'
                ? COPY.task.lineageBadge(step.inferredProvenance.source)
                : COPY.task.inferredBadge(step.inferredProvenance?.source)}
            </span>
          )}
        </p>
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
        <CheckToggle checked={complete} onToggle={() => toggleStep(step.id)} itemLabel={step.action} />
      </div>
    </li>
  );
}

export const ProtocolStepRow = RoutineStepRow;
