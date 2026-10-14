import React from 'react';
import CheckIcon from '@mui/icons-material/Check';
import { COPY } from '../../data/copy';
import type { ProtocolSummary } from '../../types/protocol';
import { cn } from '../../utils/cn';
import { toFraction } from '../../utils/math';
import { Icon } from '../ui/Icon';
import { ProgressRing } from '../ui/ProgressRing';
import { StepIcon } from '../ui/StepIcon';
import { PaperRowText } from './PaperRowText';

interface ProtocolOptionProps {
  protocol: ProtocolSummary;
  active: boolean;
  onSelect: (id: string) => void;
}

export function ProtocolOption({ protocol, active, onSelect }: ProtocolOptionProps) {
  return (
    <li role="none">
      <button
        type="button"
        role="option"
        aria-selected={active}
        onClick={() => onSelect(protocol.id)}
        className={cn(
          'flex w-full items-center gap-3 rounded-tile p-2.5 text-left transition-colors hover:bg-canvas focus:outline-none focus-visible:bg-canvas',
          active && 'bg-canvas'
        )}>
        
        <ProgressRing value={toFraction(protocol.todayPercent)} size={40} decorative>
          <StepIcon icon={protocol.icon} size="sm" />
        </ProgressRing>
        <PaperRowText
          title={protocol.title}
          meta={COPY.switcher.meta(protocol.currentDay, protocol.totalDays, protocol.todayPercent)} />
        
        {active && <Icon icon={CheckIcon} size="md" />}
      </button>
    </li>);

}