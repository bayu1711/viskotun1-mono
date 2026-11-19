import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { ROUTES } from '../../data/navigation';
import {
  deriveLifestyleCohort,
  parseReminderTime,
  sanitizeAge,
  syncLifestyleActiveTags
} from '../profile';
import { calculateHealthAgeProjection } from '../healthAgeEngine';

describe('UserProfile and UserLifestyleProfile utilities & wiring', () => {
  it('validates chronological age within safe physiological bounds', () => {
    expect(sanitizeAge(34)).toBe(34);
    expect(sanitizeAge('29')).toBe(29);
    expect(sanitizeAge(' 45 ')).toBe(45);
    expect(sanitizeAge(12)).toBeUndefined();
    expect(sanitizeAge(120)).toBeUndefined();
    expect(sanitizeAge('')).toBeUndefined();
    expect(sanitizeAge(undefined)).toBeUndefined();
  });

  it('parses preferred reminder HH:mm strings cleanly with 09:00 fallback', () => {
    expect(parseReminderTime('20:30')).toEqual({ hour: 20, minute: 30 });
    expect(parseReminderTime('07:05')).toEqual({ hour: 7, minute: 5 });
    expect(parseReminderTime('invalid')).toEqual({ hour: 9, minute: 0 });
    expect(parseReminderTime(undefined)).toEqual({ hour: 9, minute: 0 });
  });

  it('synchronizes structured lifestyle settings into activeTags while preserving custom tags', () => {
    const tags = syncLifestyleActiveTags({
      workPattern: 'shift_work',
      smokingStatus: 'midwakh_dokha',
      isRamadanFastingObserver: true,
      climateSensitivity: 'summer_heat',
      activeTags: ['custom_postpartum']
    });

    expect(tags).toContain('custom_postpartum');
    expect(tags).toContain('healthcare_shift_worker');
    expect(tags).toContain('midwakh_dokha');
    expect(tags).toContain('ramadan_fasting');
    expect(tags).toContain('extreme_heat_summer');

    const cleared = syncLifestyleActiveTags({
      workPattern: 'standard',
      smokingStatus: 'non_smoker',
      isRamadanFastingObserver: false,
      climateSensitivity: 'moderate',
      activeTags: tags
    });
    expect(cleared).toEqual(['custom_postpartum']);
  });

  it('derives accurate community cohorts from lifestyle profile', () => {
    expect(deriveLifestyleCohort({ smokingStatus: 'shisha_waterpipe' })).toBe('smoker');
    expect(deriveLifestyleCohort({ smokingStatus: 'former_smoker', isRamadanFastingObserver: true })).toBe('ramadan');
    expect(deriveLifestyleCohort({ smokingStatus: 'non_smoker', workPattern: 'shift_work' })).toBe('shift_work');
    expect(deriveLifestyleCohort({ smokingStatus: 'non_smoker', workPattern: 'standard' })).toBe('general');
  });

  it('computes personalized Health Age projection from chronological age', () => {
    const youngerBaseline = calculateHealthAgeProjection({
      adherenceRate: 90,
      streak: 14,
      currentDay: 14,
      totalDays: 30,
      chronologicalAge: 28
    });
    expect(youngerBaseline.chronologicalAge).toBe(28);
    expect(youngerBaseline.projectedHealthAge).toBeLessThan(28);
  });

  it('links TopBar profile avatar to ROUTES.profile and feeds userProfile.age into HealthAgeCard', () => {
    expect(ROUTES.profile).toBe('/profile');

    const topBarSource = fs.readFileSync(
      path.resolve(__dirname, '../../components/layout/TopBar.tsx'),
      'utf-8'
    );
    expect(topBarSource).toContain('href={ROUTES.profile}');
    expect(topBarSource).toContain('<Avatar initials={displayInitials}');

    const healthAgeSource = fs.readFileSync(
      path.resolve(__dirname, '../../components/dashboard/HealthAgeCard.tsx'),
      'utf-8'
    );
    expect(healthAgeSource).toContain('userProfile?.age ?? 38');
  });
});
