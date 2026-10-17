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
        <ProgressRing
          value={completion}
          size={38}
          tone="light-bare"
          decorative
          className="rounded-full bg-orange text-xs font-semibold text-white shadow-sm ring-2 ring-orange/30"
        >
          {day}
        </ProgressRing>
      );

    case 'complete':
      return <span className={cn(CELL, 'bg-mint font-semibold text-ink shadow-2xs')}>{day}</span>;
    case 'partial':
      return (
        <ProgressRing value={completion} size={38} tone="orange" weight="thin" decorative>
          <span className="text-xs font-medium text-ink/80">{day}</span>
        </ProgressRing>
      );

    case 'upcoming':
      return <span className={cn(CELL, 'font-medium text-ink/35')}>{day}</span>;
  }
}