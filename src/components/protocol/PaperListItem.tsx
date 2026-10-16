'use client';

import React from 'react';
import { COPY } from '../../data/copy';
import type { RoutineSummary } from '../../types/routine';
import { cn } from '../../utils/cn';
import { IconTile } from '../ui/IconTile';
import { ProgressRing } from '../ui/ProgressRing';
import { StepIcon } from '../ui/StepIcon';
import { PaperRowText } from './PaperRowText';

interface PaperListItemProps {
  routine?: RoutineSummary;
  protocol?: RoutineSummary;
  active: boolean;
  onOpen: (id: string) => void;
}

export function PaperListItem({ routine, protocol = routine, active, onOpen }: PaperListItemProps) {
  const item = (routine || protocol)!;
  return (
    <li>
      <button
        type="button"
        onClick={() => onOpen(item.id)}
        aria-current={active ? 'true' : undefined}
        className={cn(
          'flex w-full items-center gap-3 rounded-tile border p-2.5 pr-4 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/30',
          active ? 'border-ink bg-white' : 'border-ink/15 hover:border-ink'
        )}
      >
        <IconTile variant="solid" size={40}>
          <StepIcon icon={item.icon} size="md" />
        </IconTile>
        <PaperRowText
          title={item.title}
          meta={
            <>
              {COPY.dashboard.paperMeta(item.currentDay, item.totalDays, item.streak)}
              {active && COPY.dashboard.activeSuffix}
            </>
          }
        />

        <ProgressRing value={item.todayFraction} size={36}>
          <span className="text-3xs tabular-nums">{item.todayPercent}</span>
        </ProgressRing>
      </button>
    </li>
  );
}