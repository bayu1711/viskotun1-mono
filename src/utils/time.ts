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