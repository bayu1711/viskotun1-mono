'use client';

import React from 'react';
import { useRoutine } from '../../contexts/RoutineContext';
import { buildCalendarWindow } from '../../utils/calendar';
import { CalendarDayCell } from './CalendarDayCell';
import { CalendarLegend } from './CalendarLegend';

import { useLocale } from '../../contexts/LocaleContext';
export function HistoryCalendar() {
  const { copy } = useLocale();
  const { routine, currentDay, totalDays, todayFraction } = useRoutine();
  const { isPaged, start, end, days } = buildCalendarWindow({
    dayHistory: routine.dayHistory,
    currentDay,
    totalDays,
    todayFraction
  });

  return (
    <div>
      {isPaged && <p className="mb-3 text-xs text-ink/60">{copy.calendar.range(start, end, totalDays)}</p>}
      <ol className="grid grid-cols-7 gap-y-2.5" aria-label={copy.calendar.listLabel}>
        {days.map((day) => (
          <CalendarDayCell key={day.day} day={day} />
        ))}
      </ol>
      <CalendarLegend />
    </div>
  );
}