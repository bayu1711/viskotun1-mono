import { AFTERNOON_END_HOUR, MORNING_END_HOUR } from '../data/config';
import { COPY } from '../data/copy';

export function nowLabel(date = new Date()) {
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export function greeting(date = new Date()) {
  const hour = date.getHours();
  if (hour < MORNING_END_HOUR) return COPY.greeting.morning;
  if (hour < AFTERNOON_END_HOUR) return COPY.greeting.afternoon;
  return COPY.greeting.evening;
}

/**
 * Returns the current calendar date string ('YYYY-MM-DD') in the user's local timezone.
 */
export function getLocalTodayDateString(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Computes calendar day difference between two YYYY-MM-DD dates in the user's local timezone.
 * Returns > 0 if targetDateStr is chronologically after baseDateStr.
 */
export function getDaysDifference(baseDateStr?: string, targetDateStr?: string): number {
  if (!baseDateStr || !targetDateStr) return 0;
  const [by, bm, bd] = baseDateStr.split('-').map(Number);
  const [ty, tm, td] = targetDateStr.split('-').map(Number);
  if (!by || !bm || !bd || !ty || !tm || !td) return 0;
  const base = new Date(by, bm - 1, bd).getTime();
  const target = new Date(ty, tm - 1, td).getTime();
  return Math.round((target - base) / (1000 * 60 * 60 * 24));
}

/**
 * Calculates milliseconds until next local midnight in the user's local timezone.
 */
export function getMsUntilNextLocalMidnight(date = new Date()): number {
  const tomorrow = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1, 0, 0, 0, 50);
  return Math.max(1000, tomorrow.getTime() - date.getTime());
}