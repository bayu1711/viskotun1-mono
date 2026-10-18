import { describe, expect, it } from 'vitest';
import { getDaysDifference, getLocalTodayDateString, getMsUntilNextLocalMidnight, greeting, nowLabel } from '../time';

describe('time utilities', () => {
  it('formats current time label correctly', () => {
    const fixed = new Date(2026, 9, 18, 14, 30);
    const label = nowLabel(fixed);
    expect(label).toBeTruthy();
    expect(typeof label).toBe('string');
  });

  it('provides appropriate greeting based on hour', () => {
    const morning = new Date(2026, 9, 18, 9, 0);
    const afternoon = new Date(2026, 9, 18, 14, 0);
    const evening = new Date(2026, 9, 18, 20, 0);

    expect(greeting(morning)).toMatch(/morning/i);
    expect(greeting(afternoon)).toMatch(/afternoon/i);
    expect(greeting(evening)).toMatch(/evening/i);
  });

  it('generates local date string in YYYY-MM-DD format', () => {
    const d = new Date(2026, 9, 18); // Note: month index 9 is October
    expect(getLocalTodayDateString(d)).toBe('2026-10-18');
  });

  it('computes integer day difference correctly across local dates', () => {
    expect(getDaysDifference('2026-10-17', '2026-10-18')).toBe(1);
    expect(getDaysDifference('2026-10-14', '2026-10-18')).toBe(4);
    expect(getDaysDifference('2026-10-18', '2026-10-18')).toBe(0);
    expect(getDaysDifference('2026-10-19', '2026-10-18')).toBe(-1);
    expect(getDaysDifference(undefined, '2026-10-18')).toBe(0);
    expect(getDaysDifference('2026-10-18', undefined)).toBe(0);
  });

  it('calculates positive milliseconds until next local midnight', () => {
    const noon = new Date(2026, 9, 18, 12, 0, 0);
    const ms = getMsUntilNextLocalMidnight(noon);
    expect(ms).toBeGreaterThan(0);
    // 12 hours is roughly 43,200,000 ms
    expect(ms).toBeGreaterThanOrEqual(43000000);
    expect(ms).toBeLessThanOrEqual(44000000);
  });
});
