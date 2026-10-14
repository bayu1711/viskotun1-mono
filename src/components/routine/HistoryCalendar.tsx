import React from 'react';
import { useProtocol } from '../../contexts/ProtocolContext';
import { COPY } from '../../data/copy';
import { buildCalendarWindow } from '../../utils/calendar';
import { toFraction } from '../../utils/math';
import { CalendarDayCell } from './CalendarDayCell';
import { CalendarLegend } from './CalendarLegend';

export function HistoryCalendar() {
  const { protocol, currentDay, totalDays, todayPercent } = useProtocol();
  const { isPaged, start, end, days } = buildCalendarWindow({
    dayHistory: protocol.dayHistory,
    currentDay,
    totalDays,
    todayFraction: toFraction(todayPercent)
  });

  return (
    <div>
      {isPaged && <p className="mb-3 text-xs lowercase text-ink/45">{COPY.calendar.range(start, end, totalDays)}</p>}
      <ol className="grid grid-cols-7 gap-y-2.5" aria-label={COPY.calendar.listLabel}>
        {days.map((day) =>
        <CalendarDayCell key={day.day} day={day} />
        )}
      </ol>
      <CalendarLegend />
    </div>);

}