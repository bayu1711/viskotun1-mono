import React from 'react';
import { COPY } from '../../data/copy';
import { cn } from '../../utils/cn';
import type { CalendarDay } from '../../utils/calendar';
import { toPercent } from '../../utils/math';
import { ProgressRing } from '../ui/ProgressRing';

const CELL = 'flex h-cell w-cell items-center justify-center rounded-full text-xs';

interface CalendarDayCellProps {
  day: CalendarDay;
}

export function CalendarDayCell({ day }: CalendarDayCellProps) {
  const label =
  day.status === 'upcoming' ?
  COPY.calendar.upcoming(day.day) :
  COPY.calendar.progress(day.day, toPercent(day.completion));

  return (
    <li className="flex justify-center" aria-current={day.status === 'today' ? 'date' : undefined}>
      <span className="sr-only">{label}</span>
      <span aria-hidden="true">{renderVisual(day)}</span>
    </li>);

}

function renderVisual({ day, completion, status }: CalendarDay) {
  switch (status) {
    case 'today':
      return (
        <ProgressRing value={completion} size={38} tone="light-bare" decorative className="rounded-full bg-ink text-xs text-white">
          {day}
        </ProgressRing>);

    case 'complete':
      return <span className={cn(CELL, 'bg-mint text-ink/60')}>{day}</span>;
    case 'partial':
      return (
        <ProgressRing value={completion} size={38} tone="ink-bare" weight="thin" decorative>
          <span className="text-xs text-ink/70">{day}</span>
        </ProgressRing>);

    case 'upcoming':
      return <span className={cn(CELL, 'text-ink/30')}>{day}</span>;
  }
}