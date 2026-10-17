'use client';

import React from 'react';
import { useRoutine } from '../../contexts/RoutineContext';
import { COPY } from '../../data/copy';
import { buildCalendarWindow } from '../../utils/calendar';
import { CalendarDayCell } from './CalendarDayCell';
import { CalendarLegend } from './CalendarLegend';

export function HistoryCalendar() {
  const { routine, currentDay, totalDays, todayFraction } = useRoutine();
  const { isPaged, start, end, days } = buildCalendarWindow({
    dayHistory: routine.dayHistory,
    currentDay,
    totalDays,
    todayFraction
  });

  return (
    <div>
      {isPaged && <p className="mb-3 text-xs text-ink/60">{COPY.calendar.range(start, end, totalDays)}</p>}
      <ol className="grid grid-cols-7 gap-y-2.5" aria-label={COPY.calendar.listLabel}>
        {days.map((day) => (
          <CalendarDayCell key={day.day} day={day} />
        ))}
      </ol>
      <CalendarLegend />
    </div>
  );
}