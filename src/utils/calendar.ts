import { CALENDAR_WINDOW_DAYS } from '../data/config';

export type CalendarDayStatus = 'complete' | 'partial' | 'today' | 'upcoming';

export interface CalendarDay {
  day: number;
  completion: number;
  status: CalendarDayStatus;
}

interface CalendarWindowInput {
  dayHistory: number[];
  currentDay: number;
  totalDays: number;
  todayFraction: number;
}

/** Builds the visible window of days (paged in CALENDAR_WINDOW_DAYS blocks) around the current day. */
export function buildCalendarWindow({ dayHistory, currentDay, totalDays, todayFraction }: CalendarWindowInput) {
  const isPaged = totalDays > CALENDAR_WINDOW_DAYS;
  const start = isPaged ?
  Math.floor((currentDay - 1) / CALENDAR_WINDOW_DAYS) * CALENDAR_WINDOW_DAYS + 1 :
  1;
  const end = Math.min(totalDays, start + CALENDAR_WINDOW_DAYS - 1);

  const days: CalendarDay[] = Array.from({ length: Math.max(0, end - start + 1) }, (_, index) => {
    const day = start + index;
    if (day === currentDay) return { day, completion: todayFraction, status: 'today' };
    if (day > currentDay) return { day, completion: 0, status: 'upcoming' };
    const completion = dayHistory[day - 1] ?? 0;
    return { day, completion, status: completion >= 1 ? 'complete' : 'partial' };
  });

  return { isPaged, start, end, days };
}