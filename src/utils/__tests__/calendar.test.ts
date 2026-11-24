import { describe, expect, it } from 'vitest';
import { achillesRoutine } from '../../data/routines/achilles';
import {
  buildCalendarFeedUrls,
  buildCalendarWindow,
  buildRoutineCalendarDescription,
  escapeIcsText,
  formatGoogleCalendarDateTime,
  formatIcsDateTime,
  generateIcsCalendar,
  getGoogleCalendarUrl
} from '../calendar';

describe('calendar utility', () => {
  it('escapes special characters per RFC 5545', () => {
    expect(escapeIcsText('Hello, World; Line 1\nLine 2\\Backslash')).toBe(
      'Hello\\, World\\; Line 1\\nLine 2\\\\Backslash'
    );
  });

  it('formats UTC ICS date timestamps correctly', () => {
    const d = new Date(Date.UTC(2026, 10, 18, 9, 30, 0));
    expect(formatIcsDateTime(d)).toBe('20261118T093000Z');
  });

  it('formats Google Calendar local date strings correctly', () => {
    const d = new Date(2026, 10, 18, 9, 30, 0);
    expect(formatGoogleCalendarDateTime(d)).toBe('20261118T093000');
  });

  it('builds multi-line plain text routine description including steps and stop rules', () => {
    const desc = buildRoutineCalendarDescription(achillesRoutine);
    expect(desc).toContain('TrialN1 — achilles rehab');
    expect(desc).toContain('Prescribed Steps:');
    expect(desc).toContain('Straight-Knee Eccentric Heel Drops');
    expect(desc).toContain('Stop Rule');
  });

  it('generates compliant RFC 5545 iCalendar content', () => {
    const ics = generateIcsCalendar(achillesRoutine, {
      hour: 9,
      minute: 0,
      durationMinutes: 30,
      startDate: new Date('2026-11-18T09:00:00Z')
    });

    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('VERSION:2.0');
    expect(ics).toContain('PRODID:-//TrialN1//Clinical Routine Calendar//EN');
    expect(ics).toContain('BEGIN:VEVENT');
    expect(ics).toContain('SUMMARY:TrialN1: achilles rehab');
    expect(ics).toContain('RRULE:FREQ=DAILY;COUNT=84');
    expect(ics).toContain('BEGIN:VALARM');
    expect(ics).toContain('TRIGGER:-PT15M');
    expect(ics).toContain('END:VALARM');
    expect(ics).toContain('END:VEVENT');
    expect(ics).toContain('END:VCALENDAR');
  });

  it('generates a valid Google Calendar URL with encoded parameters', () => {
    const url = getGoogleCalendarUrl(achillesRoutine, {
      startDate: new Date('2026-11-18T09:00:00')
    });

    expect(url).toContain('https://calendar.google.com/calendar/render?');
    expect(url).toContain('action=TEMPLATE');
    expect(url).toContain('TrialN1%3A+achilles+rehab');
    expect(url).toContain('RRULE%3AFREQ%3DDAILY%3BCOUNT%3D84');
  });

  it('builds calendar day window for current day paging', () => {
    const window = buildCalendarWindow({
      dayHistory: [1, 0.5],
      currentDay: 2,
      totalDays: 14,
      todayFraction: 0.5
    });
    expect(window.days.length).toBe(14);
    expect(window.days[0].status).toBe('complete');
    expect(window.days[1].status).toBe('today');
    expect(window.days[2].status).toBe('upcoming');
  });

  it('builds live subscribable HTTPS and webcal:// calendar feed URLs', () => {
    const urls = buildCalendarFeedUrls('https://trialn1.app/', 'feed_token_123');
    expect(urls.httpsUrl).toBe('https://trialn1.app/api/calendar/feed_token_123');
    expect(urls.webcalUrl).toBe('webcal://trialn1.app/api/calendar/feed_token_123');
  });
});
