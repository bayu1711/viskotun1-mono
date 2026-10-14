import React from 'react';
import { COPY } from '../../data/copy';
import type { ProtocolSummary } from '../../types/protocol';
import { cn } from '../../utils/cn';
import { toFraction } from '../../utils/math';
import { IconTile } from '../ui/IconTile';
import { ProgressRing } from '../ui/ProgressRing';
import { StepIcon } from '../ui/StepIcon';
import { PaperRowText } from './PaperRowText';

interface PaperListItemProps {
  protocol: ProtocolSummary;
  active: boolean;
  onOpen: (id: string) => void;
}

export function PaperListItem({ protocol, active, onOpen }: PaperListItemProps) {
  return (
    <li>
      <button
        type="button"
        onClick={() => onOpen(protocol.id)}
        aria-current={active ? 'true' : undefined}
        className={cn(
          'flex w-full items-center gap-3 rounded-tile border p-2.5 pr-4 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/30',
          active ? 'border-ink bg-white' : 'border-ink/15 hover:border-ink'
        )}>
        
        <IconTile variant="solid" size={40}>
          <StepIcon icon={protocol.icon} size="md" />
        </IconTile>
        <PaperRowText
          title={protocol.title}
          meta={
          <>
              {COPY.dashboard.paperMeta(protocol.currentDay, protocol.totalDays, protocol.streak)}
              {active && COPY.dashboard.activeSuffix}
            </>
          } />
        
        <ProgressRing value={toFraction(protocol.todayPercent)} size={36}>
          <span className="text-3xs tabular-nums">{protocol.todayPercent}</span>
        </ProgressRing>
      </button>
    </li>);

}