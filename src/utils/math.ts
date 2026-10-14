import { PERCENT_MAX } from '../data/config';

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

/** 0–1 ratio → whole-number percent. */
export function toPercent(fraction: number) {
  return Math.round(fraction * PERCENT_MAX);
}

/** Whole-number percent → 0–1 ratio. */
export function toFraction(percent: number) {
  return clamp(percent / PERCENT_MAX, 0, 1);
}