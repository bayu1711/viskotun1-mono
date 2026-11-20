'use client';

import React from 'react';
import type { RoutineSummary } from '../../types/routine';
import { cn } from '../../utils/cn';
import { IconTile } from '../ui/IconTile';
import { ProgressRing } from '../ui/ProgressRing';
import { StepIcon } from '../ui/StepIcon';
import { PaperRowText } from './PaperRowText';

import { useLocale } from '../../contexts/LocaleContext';
interface PaperListItemProps {
  routine: RoutineSummary;
  active: boolean;
  onOpen: (id: string) => void;
}

export function PaperListItem({ routine, active, onOpen }: PaperListItemProps) {
  const { copy } = useLocale();
  const item = routine;
  return (
    <li>
      <button
        type="button"
        onClick={() => onOpen(item.id)}
        aria-current={active ? 'true' : undefined}
        className={cn(
          'flex w-full items-center gap-3 rounded-tile border p-2.5 pe-4 text-start transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/30',
          active ? 'border-orange bg-orange/5 ring-1 ring-orange/30' : 'border-ink/15 hover:border-ink/40 bg-white'
        )}
      >
        <IconTile variant={active ? 'orange' : 'solid'} size={40}>
          <StepIcon icon={item.icon} size="md" />
        </IconTile>
        <PaperRowText
          title={item.title}
          meta={
            <>
              {copy.dashboard.paperMeta(item.currentDay, item.totalDays)}
              {active && copy.dashboard.activeSuffix}
            </>
          }
        />

        <ProgressRing value={item.todayFraction} size={36} tone={active ? 'orange' : 'ink'}>
          <span className="text-3xs tabular-nums">
            {item.todayPercent}
            {copy.common.percentSign}
          </span>
        </ProgressRing>
      </button>
    </li>
  );
}