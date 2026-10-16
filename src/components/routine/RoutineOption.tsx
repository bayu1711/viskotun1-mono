import React from 'react';
import CheckIcon from '@mui/icons-material/Check';
import { COPY } from '../../data/copy';
import type { RoutineSummary } from '../../types/routine';
import { cn } from '../../utils/cn';
import { Icon } from '../ui/Icon';
import { ProgressRing } from '../ui/ProgressRing';
import { StepIcon } from '../ui/StepIcon';
import { PaperRowText } from '../protocol/PaperRowText';

interface RoutineOptionProps {
  routine?: RoutineSummary;
  protocol?: RoutineSummary;
  active: boolean;
  onSelect: (id: string) => void;
}

export function RoutineOption({ routine, protocol, active, onSelect }: RoutineOptionProps) {
  const item = routine || protocol;
  if (!item) return null;

  return (
    <li role="none">
      <button
        type="button"
        role="option"
        aria-selected={active}
        onClick={() => onSelect(item.id)}
        className={cn(
          'flex w-full items-center gap-3 rounded-tile p-2.5 text-left transition-colors hover:bg-canvas focus:outline-none focus-visible:bg-canvas',
          active && 'bg-canvas'
        )}
      >
        <ProgressRing value={item.todayFraction} size={40} decorative>
          <StepIcon icon={item.icon} size="sm" />
        </ProgressRing>
        <PaperRowText
          title={item.title}
          meta={COPY.switcher.meta(item.currentDay, item.totalDays, item.todayPercent)}
        />
        {active && <Icon icon={CheckIcon} size="md" />}
      </button>
    </li>
  );
}

export const ProtocolOption = RoutineOption;
