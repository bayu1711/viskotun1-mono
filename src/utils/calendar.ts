import { CALENDAR_WINDOW_DAYS } from '../data/config';
import type { Routine } from '../types/routine';
import { stopRuleOf } from './routineMetrics';

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
  const start = isPaged
    ? Math.floor((currentDay - 1) / CALENDAR_WINDOW_DAYS) * CALENDAR_WINDOW_DAYS + 1
    : 1;
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

export interface CalendarExportOptions {
  hour?: number;
  minute?: number;
  durationMinutes?: number;
  startDate?: Date;
}

/** Escapes special characters for RFC 5545 compliance. */
export function escapeIcsText(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

/** Formats a date into UTC ICS timestamp: YYYYMMDDTHHMMSSZ */
export function formatIcsDateTime(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const year = date.getUTCFullYear();
  const month = pad(date.getUTCMonth() + 1);
  const day = pad(date.getUTCDate());
  const hours = pad(date.getUTCHours());
  const minutes = pad(date.getUTCMinutes());
  const seconds = pad(date.getUTCSeconds());
  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

/** Formats a date into local Google Calendar date string: YYYYMMDDTHHmmss */
export function formatGoogleCalendarDateTime(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());
  return `${year}${month}${day}T${hours}${minutes}${seconds}`;
}

/** Builds an informative multi-line plain text routine summary for calendar event description. */
export function buildRoutineCalendarDescription(routine: Routine): string {
  const lines: string[] = [];

  const displayTitle = routine.shortTitle || routine.title;
  lines.push(`ViskotuN1 — ${displayTitle}`);
  lines.push(`Trial: ${routine.paper?.title || routine.title}`);
  if (routine.paper?.doi) {
    lines.push(`DOI: https://doi.org/${routine.paper.doi}`);
  }
  lines.push('');
  lines.push('Prescribed Steps:');

  for (let i = 0; i < routine.steps.length; i++) {
    const s = routine.steps[i];
    const sets = s.sets ?? 1;
    const reps = s.reps ? ` × ${s.reps} reps` : '';
    const hold = s.durationSeconds ? ` × ${s.durationSeconds}s` : '';
    const stat = s.statValue ? ` (${s.statValue})` : '';
    lines.push(`${i + 1}. ${s.action} (${sets} sets${reps}${hold}${stat})`);
  }

  const stopRule = stopRuleOf(routine);
  if (stopRule) {
    lines.push('');
    lines.push(`⚠️ Stop Rule: ${stopRule.text}`);
  }

  lines.push('');
  lines.push('Track adherence and biofeedback: https://viskotun1.app/routine');

  return lines.join('\n');
}

/** Generates RFC 5545 iCalendar (.ics) string. */
export function generateIcsCalendar(routine: Routine, options: CalendarExportOptions = {}): string {
  const now = new Date();
  const start = options.startDate ? new Date(options.startDate) : new Date();

  const hour = options.hour ?? 9;
  const minute = options.minute ?? 0;
  const duration = options.durationMinutes ?? 30;

  start.setHours(hour, minute, 0, 0);
  const end = new Date(start.getTime() + duration * 60 * 1000);

  const totalDays = Math.max(1, routine.totalDays ?? 14);
  const title = routine.shortTitle || routine.title;
  const summary = `ViskotuN1: ${title}`;
  const description = escapeIcsText(buildRoutineCalendarDescription(routine));
  const uid = `viskotun1-${routine.id}-${now.getTime()}@viskotun1.app`;

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//ViskotuN1//Clinical Routine Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${formatIcsDateTime(now)}`,
    `DTSTART:${formatIcsDateTime(start)}`,
    `DTEND:${formatIcsDateTime(end)}`,
    `RRULE:FREQ=DAILY;COUNT=${totalDays}`,
    `SUMMARY:${escapeIcsText(summary)}`,
    `DESCRIPTION:${description}`,
    'STATUS:CONFIRMED',
    'BEGIN:VALARM',
    'TRIGGER:-PT15M',
    'ACTION:DISPLAY',
    `DESCRIPTION:Reminder: ${escapeIcsText(title)}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');
}

/** Triggers download of the .ics file in browser environments. */
export function downloadIcsFile(routine: Routine, options: CalendarExportOptions = {}): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const icsContent = generateIcsCalendar(routine, options);
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    const safeSlug = (routine.shortTitle || routine.id).toLowerCase().replace(/[^a-z0-9]+/g, '-');
    link.download = `viskotun1-${safeSlug}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return true;
  } catch (err) {
    console.error('[CalendarExport] Failed to download ICS file:', err);
    return false;
  }
}

/** Generates Google Calendar web creation URL with recurrence and pre-filled instructions. */
export function getGoogleCalendarUrl(routine: Routine, options: CalendarExportOptions = {}): string {
  const start = options.startDate ? new Date(options.startDate) : new Date();
  const hour = options.hour ?? 9;
  const minute = options.minute ?? 0;
  const duration = options.durationMinutes ?? 30;

  start.setHours(hour, minute, 0, 0);
  const end = new Date(start.getTime() + duration * 60 * 1000);

  const totalDays = Math.max(1, routine.totalDays ?? 14);
  const title = `ViskotuN1: ${routine.shortTitle || routine.title}`;
  const details = buildRoutineCalendarDescription(routine);

  const datesParam = `${formatGoogleCalendarDateTime(start)}/${formatGoogleCalendarDateTime(end)}`;
  const recurParam = `RRULE:FREQ=DAILY;COUNT=${totalDays}`;

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: datesParam,
    details: details,
    recur: recurParam
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
