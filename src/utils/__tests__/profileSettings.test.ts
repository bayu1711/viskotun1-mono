import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { COPY } from '../../data/copy';
import { ROUTES } from '../../data/navigation';
import {
  deriveClinicalFocus,
  deriveLifestyleCohort,
  getRegionalAvailabilityPresets,
  sanitizeAge,
  syncLifestyleActiveTags
} from '../profile';
import { parseClockTime } from '../schedule';
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

  it('parses HH:mm clock strings cleanly with 09:00 fallback', () => {
    expect(parseClockTime('20:30')).toEqual({ hour: 20, minute: 30 });
    expect(parseClockTime('07:05')).toEqual({ hour: 7, minute: 5 });
    expect(parseClockTime('invalid')).toEqual({ hour: 9, minute: 0 });
    expect(parseClockTime(undefined)).toEqual({ hour: 9, minute: 0 });
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

    const assistantRouteSource = fs.readFileSync(
      path.resolve(__dirname, '../../app/api/assistant/route.ts'),
      'utf-8'
    );
    expect(assistantRouteSource).toContain('Participant Profile & Adaptive Lifestyle Context');
  });

  it('synthesizes Primary Health / Rehab Focus from UserLifestyleProfile factors', () => {
    const focus = deriveClinicalFocus(
      {
        isRamadanFastingObserver: true,
        workPattern: 'shift_work',
        climateSensitivity: 'summer_heat',
        physicalCautions: ['Knee sensitivity']
      },
      { routineTitle: 'achilles rehab' }
    );
    expect(focus).toContain('achilles rehab');
    expect(focus).toContain('post-Iftar');
    expect(focus).toContain('shift-aligned');

    const defaultFocus = deriveClinicalFocus({
      workPattern: 'standard',
      smokingStatus: 'non_smoker',
      isRamadanFastingObserver: false
    });
    expect(defaultFocus.length).toBeGreaterThan(10);
  });

  it('auto-triggers conversational Adaptive Lifestyle interview on workspace for un-onboarded users', () => {
    const appShellSource = fs.readFileSync(
      path.resolve(__dirname, '../../components/layout/AppShell.tsx'),
      'utf-8'
    );
    expect(appShellSource).toContain('openLifestyleTuning');
    expect(appShellSource).toContain('ONBOARDING_DISMISSED_KEY');
    expect(appShellSource).toContain('if (isPublicPage || pathname === ROUTES.profile) return');

    const tuningViewSource = fs.readFileSync(
      path.resolve(__dirname, '../../components/assistant/LifestyleTuningView.tsx'),
      'utf-8'
    );
    expect(tuningViewSource).toContain('!lifestyleProfile?.intakeCompleted');
    expect(tuningViewSource).toContain('onInitConversation');
    expect(tuningViewSource).toContain('<AssistantMessage');
    expect(tuningViewSource).not.toContain('t.badge(');
  });

  it('adapts available time window preset chips to the selected region and fasting status', () => {
    const usPresets = getRegionalAvailabilityPresets({
      countryCode: 'US',
      isRamadanFastingObserver: false,
      basePresets: COPY.profile.availabilityPresets,
      fastingPreset: COPY.profile.fastingAvailabilityPreset
    });
    expect(usPresets.map((p) => p.label)).not.toContain(COPY.profile.fastingAvailabilityPreset.label);
    expect(usPresets.some((p) => p.start === '19:00' && p.end === '21:00')).toBe(true);

    const uaePresets = getRegionalAvailabilityPresets({
      countryCode: 'AE',
      isRamadanFastingObserver: false,
      basePresets: COPY.profile.availabilityPresets,
      fastingPreset: COPY.profile.fastingAvailabilityPreset
    });
    expect(uaePresets.map((p) => p.label)).toContain(COPY.profile.fastingAvailabilityPreset.label);

    const usRamadanPresets = getRegionalAvailabilityPresets({
      countryCode: 'US',
      isRamadanFastingObserver: true,
      basePresets: COPY.profile.availabilityPresets,
      fastingPreset: COPY.profile.fastingAvailabilityPreset
    });
    expect(usRamadanPresets.map((p) => p.label)).toContain(COPY.profile.fastingAvailabilityPreset.label);

    const multiculturalUsPresets = getRegionalAvailabilityPresets({
      countryCode: 'US',
      culturalRhythms: ['early_dawn_riser', 'late_family_dinner'],
      basePresets: COPY.profile.availabilityPresets,
      fastingPreset: COPY.profile.fastingAvailabilityPreset,
      dawnPreset: COPY.profile.dawnAvailabilityPreset,
      lateDinnerPreset: COPY.profile.lateDinnerAvailabilityPreset
    });
    expect(multiculturalUsPresets.map((p) => p.label)).toContain(COPY.profile.dawnAvailabilityPreset.label);
    expect(multiculturalUsPresets.map((p) => p.label)).toContain(COPY.profile.lateDinnerAvailabilityPreset.label);
    expect(multiculturalUsPresets.map((p) => p.label)).not.toContain(COPY.profile.fastingAvailabilityPreset.label);
  });

  it('syncs and synthesizes clinical focus across diverse culturalRhythms regardless of country', () => {
    const tags = syncLifestyleActiveTags({
      culturalRhythms: ['late_family_dinner', 'sabbath_weekly_rest'],
      activeTags: []
    });
    expect(tags).toEqual(expect.arrayContaining(['late_family_dinner', 'sabbath_weekly_rest']));

    const focus = deriveClinicalFocus({
      region: {
        countryCode: 'US',
        countryName: 'United States',
        city: 'Chicago',
        detectedBy: 'user_selected',
        confirmed: true
      },
      culturalRhythms: ['early_dawn_riser', 'intermittent_fasting'],
      workPattern: 'desk_sedentary'
    });
    expect(focus.toLowerCase()).toContain('dawn');
    expect(focus.toLowerCase()).toContain('fasted hydration');
  });

  it('deduplicates header language switchers and wires Profile primary/secondary language settings', () => {
    const topBarSource = fs.readFileSync(
      path.resolve(__dirname, '../../components/layout/TopBar.tsx'),
      'utf-8'
    );
    const uaeLandingSource = fs.readFileSync(
      path.resolve(__dirname, '../../views/UaeLanding.tsx'),
      'utf-8'
    );
    const profileSource = fs.readFileSync(
      path.resolve(__dirname, '../../views/Profile.tsx'),
      'utf-8'
    );

    const switcherSource = fs.readFileSync(
      path.resolve(__dirname, '../../components/layout/LanguageSwitcher.tsx'),
      'utf-8'
    );

    expect(topBarSource).toContain('<LanguageSwitcher');
    expect(uaeLandingSource).toContain('<LanguageSwitcher');
    expect(switcherSource).toContain('aria-haspopup="listbox"');
    expect(switcherSource).toContain('role="listbox"');
    expect(switcherSource).toContain('useDismissable');
    expect(profileSource).toContain('primaryLanguage');
    expect(profileSource).toContain('secondaryLanguage');
    expect(profileSource).toContain('setLocale(primaryLanguage)');
  });

  it('aligns Profile header pills with Explore Trending style and hides Add New Paper controls on /profile', () => {
    const profileSource = fs.readFileSync(
      path.resolve(__dirname, '../../views/Profile.tsx'),
      'utf-8'
    );
    const topBarSource = fs.readFileSync(
      path.resolve(__dirname, '../../components/layout/TopBar.tsx'),
      'utf-8'
    );

    expect(profileSource).toContain('hideRoutineSwitcher');
    expect(profileSource).toContain('variant="pills"');
    expect(topBarSource).toContain('pathname !== ROUTES.profile');
  });

  it('scopes regional smoking options so Midwakh and Shisha are not forced on international locales', () => {
    const profileSource = fs.readFileSync(
      path.resolve(__dirname, '../../views/Profile.tsx'),
      'utf-8'
    );
    expect(profileSource).toContain('visibleSmokingKeys');
    expect(profileSource).toContain('options={visibleSmokingKeys}');
  });
});
