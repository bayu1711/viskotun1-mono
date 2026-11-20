import { describe, expect, it } from 'vitest';
import { getLocaleCopy } from '../../data/locales';
import type { RegionContext, UserLifestyleProfile } from '../../types/auth';
import {
  buildConversationalLifestyleReply,
  buildProfileUpdatesFromParse,
  computeNextInterviewStage,
  formatRegionLabel,
  getQuickRepliesForStage,
  getStagePlaceholder,
  parseConversationalLifestyleAnswer,
  type LifestyleInterviewStage
} from '../lifestyleInterview';

const DEFAULT_REGION: RegionContext = {
  countryCode: 'AE',
  countryName: 'United Arab Emirates',
  city: 'Abu Dhabi',
  detectedBy: 'client_timezone',
  confirmed: false
};

describe('Conversational Adaptive Lifestyle Interview', () => {
  it('confirms detected region on affirmative replies and switches cleanly for custom cities', () => {
    const confirmed = parseConversationalLifestyleAnswer('Yes, Abu Dhabi', 'region', {
      currentRegion: DEFAULT_REGION
    });
    expect(confirmed.answeredRegion).toBe(true);
    expect(confirmed.region?.confirmed).toBe(true);
    expect(confirmed.region?.city).toBe('Abu Dhabi');
    expect(confirmed.region?.countryCode).toBe('AE');

    const switched = parseConversationalLifestyleAnswer("Actually I'm in Tokyo, Japan", 'region', {
      currentRegion: DEFAULT_REGION
    });
    expect(switched.answeredRegion).toBe(true);
    expect(switched.region?.city).toBe('Tokyo');
    expect(switched.region?.countryCode).toBe('JP');
    expect(switched.region?.countryName).toBe('Japan');

    const customCity = parseConversationalLifestyleAnswer('Kyoto, Japan', 'region', {
      currentRegion: DEFAULT_REGION
    });
    expect(customCity.region?.city).toBe('Kyoto');
    expect(customCity.region?.countryCode).toBe('JP');
  });

  it('extracts age and available time windows (ranges, multiple windows, single times, or anytime) without confusing clock digits for age', () => {
    const both = parseConversationalLifestyleAnswer("I'm 34, free 7:30–9am & 7–9pm", 'age_time', {
      currentRegion: DEFAULT_REGION
    });
    expect(both.age).toBe(34);
    expect(both.availabilityMode).toBe('windows');
    expect(both.availableWindows).toHaveLength(2);
    expect(both.availableWindows?.[0]).toMatchObject({ start: '07:30', end: '09:00' });
    expect(both.availableWindows?.[1]).toMatchObject({ start: '19:00', end: '21:00' });
    expect(both.answeredAgeTime).toBe(true);

    const timeOnly = parseConversationalLifestyleAnswer('Post-Iftar · 20:30–22:00', 'age_time', {
      currentRegion: DEFAULT_REGION
    });
    expect(timeOnly.age).toBeUndefined();
    expect(timeOnly.availableWindows?.[0]).toMatchObject({ start: '20:30', end: '22:00' });
    expect(timeOnly.answeredAgeTime).toBe(true);

    const pmTime = parseConversationalLifestyleAnswer('8pm', 'age_time', {
      currentRegion: DEFAULT_REGION
    });
    expect(pmTime.age).toBeUndefined();
    expect(pmTime.availableWindows?.[0]).toMatchObject({ start: '20:00', end: '21:00' });

    const anytimeReply = parseConversationalLifestyleAnswer('38, flexible anytime works for me', 'age_time', {
      currentRegion: DEFAULT_REGION
    });
    expect(anytimeReply.age).toBe(38);
    expect(anytimeReply.availabilityMode).toBe('anytime');
    expect(anytimeReply.answeredAgeTime).toBe(true);
  });

  it('handles multi-answer turns and skips already-answered interview stages automatically', () => {
    const parsed = parseConversationalLifestyleAnswer(
      "I'm 31 in Dubai, free 7am-8:30am, desk job and observe Ramadan fasting",
      'region',
      { currentRegion: DEFAULT_REGION }
    );

    expect(parsed.region?.city).toBe('Dubai');
    expect(parsed.age).toBe(31);
    expect(parsed.availabilityMode).toBe('windows');
    expect(parsed.availableWindows?.[0]).toMatchObject({ start: '07:00', end: '08:30' });
    expect(parsed.workPattern).toBe('desk_sedentary');
    expect(parsed.culturalRhythms).toContain('ramadan_fasting');

    const { nextStage } = computeNextInterviewStage('region', parsed, new Set());
    expect(nextStage).toBe('cautions');
  });

  it('parses physical cautions and distinguishes non-smoker from cigarette smoking', () => {
    const nonSmokerKnee = parseConversationalLifestyleAnswer(
      'Slight knee pain and lower back stiffness, non-smoker',
      'cautions',
      { currentRegion: DEFAULT_REGION }
    );
    expect(nonSmokerKnee.smokingStatus).toBe('non_smoker');
    expect(nonSmokerKnee.physicalCautions).toEqual(
      expect.arrayContaining(['Knee sensitivity', 'Lower back sensitivity'])
    );

    const noCautions = parseConversationalLifestyleAnswer(
      'No cautions · non-smoker',
      'cautions',
      { currentRegion: DEFAULT_REGION }
    );
    expect(noCautions.answeredCautions).toBe(true);
    expect(noCautions.smokingStatus).toBe('non_smoker');
    expect(noCautions.extractedTags).toEqual([]);
  });

  it('completes a full 4-turn conversation and only marks intakeCompleted on the final turn', () => {
    const copyEn = getLocaleCopy('en');
    let stage: LifestyleInterviewStage = 'region';
    let answered = new Set<LifestyleInterviewStage>();
    let lifestyle: Partial<UserLifestyleProfile> = {
      region: DEFAULT_REGION,
      activeTags: [],
      intakeCompleted: false
    };

    const turns = [
      'Yes, Abu Dhabi',
      '32, 08:00',
      'Desk-bound work, Ramadan fasting, summer heat',
      'No cautions · non-smoker'
    ];

    turns.forEach((msg, index) => {
      const parsed = parseConversationalLifestyleAnswer(msg, stage, {
        currentRegion: lifestyle.region ?? DEFAULT_REGION,
        currentProfile: lifestyle
      });
      const step = computeNextInterviewStage(stage, parsed, answered);
      const { profileUpdates, suggestedFocus } = buildProfileUpdatesFromParse(
        parsed,
        step.nextStage,
        lifestyle
      );
      lifestyle = { ...lifestyle, ...profileUpdates };

      if (index < turns.length - 1) {
        expect(lifestyle.intakeCompleted).toBe(false);
      } else {
        expect(step.nextStage).toBe('complete');
        expect(lifestyle.intakeCompleted).toBe(true);
        expect(suggestedFocus.toLowerCase()).toContain('post-iftar');
        expect(lifestyle.activeTags).toEqual([
          'Desk-bound Sedentary',
          'ramadan_fasting',
          'extreme_heat_summer'
        ]);
      }

      const reply = buildConversationalLifestyleReply({
        parsed,
        nextStage: step.nextStage,
        regionLabel: formatRegionLabel(lifestyle.region),
        suggestedFocus,
        copy: copyEn,
        locale: 'en'
      });
      expect(reply.length).toBeGreaterThan(20);

      stage = step.nextStage;
      answered = new Set(step.updatedAnswered);
    });
  });

  it('produces contextual quick-reply chips and placeholders for every stage in EN and AR', () => {
    const copyEn = getLocaleCopy('en');
    const copyAr = getLocaleCopy('ar');

    for (const stage of ['region', 'age_time', 'rhythm', 'cautions', 'complete'] as const) {
      const chipsEn = getQuickRepliesForStage({
        stage,
        lifestyleProfile: { region: DEFAULT_REGION, activeTags: [] },
        suggestions: [],
        copy: copyEn
      });
      const chipsAr = getQuickRepliesForStage({
        stage,
        lifestyleProfile: { region: DEFAULT_REGION, activeTags: [] },
        suggestions: [],
        copy: copyAr
      });
      expect(chipsEn.length).toBeGreaterThanOrEqual(1);
      expect(chipsAr.length).toBeGreaterThanOrEqual(1);
      expect(getStagePlaceholder(stage, copyEn).length).toBeGreaterThan(10);
      expect(getStagePlaceholder(stage, copyAr).length).toBeGreaterThan(10);
    }
  });

  it('provides "Explore routines" on completion and does NOT suggest restarting with "Update my full profile"', () => {
    const copyEn = getLocaleCopy('en');
    const copyAr = getLocaleCopy('ar');

    const completeChipsWithoutRoutine = getQuickRepliesForStage({
      stage: 'complete',
      lifestyleProfile: { region: DEFAULT_REGION, activeTags: [] },
      suggestions: [],
      copy: copyEn,
      hasActiveRoutine: false
    });
    expect(completeChipsWithoutRoutine[0]).toBe(copyEn.lifestyleTuning.onboarding.quickExploreRoutines);
    expect(completeChipsWithoutRoutine).not.toContain(copyEn.lifestyleTuning.onboarding.quickUpdateProfile);
    expect(completeChipsWithoutRoutine).not.toContain(copyEn.lifestyleTuning.onboarding.quickDone);

    const completeChipsWithRoutine = getQuickRepliesForStage({
      stage: 'complete',
      lifestyleProfile: { region: DEFAULT_REGION, activeTags: [] },
      suggestions: [],
      copy: copyEn,
      hasActiveRoutine: true
    });
    expect(completeChipsWithRoutine[0]).toBe(copyEn.lifestyleTuning.onboarding.quickExploreRoutines);
    expect(completeChipsWithRoutine[1]).toBe(copyEn.lifestyleTuning.onboarding.quickDone);
    expect(completeChipsWithRoutine).not.toContain(copyEn.lifestyleTuning.onboarding.quickUpdateProfile);

    const completeChipsAr = getQuickRepliesForStage({
      stage: 'complete',
      lifestyleProfile: { region: DEFAULT_REGION, activeTags: [] },
      suggestions: [],
      copy: copyAr,
      hasActiveRoutine: false
    });
    expect(completeChipsAr[0]).toBe(copyAr.lifestyleTuning.onboarding.quickExploreRoutines);
    expect(completeChipsAr).not.toContain(copyAr.lifestyleTuning.onboarding.quickUpdateProfile);
  });

  it('parses combined multi-select lifestyle answers into structured profile fields cleanly', () => {
    const combined = parseConversationalLifestyleAnswer(
      'Knee stiffness / sensitivity, Lower back sensitivity, Shisha / waterpipe',
      'cautions',
      { currentRegion: DEFAULT_REGION }
    );
    expect(combined.answeredCautions).toBe(true);
    expect(combined.smokingStatus).toBe('shisha_waterpipe');
    expect(combined.physicalCautions).toContain('Knee sensitivity');
    expect(combined.physicalCautions).toContain('Lower back sensitivity');

    const rhythmCombined = parseConversationalLifestyleAnswer(
      'Desk-bound Sedentary, Intermittent Fasting (16:8), Summer Heat Adaptation',
      'rhythm',
      { currentRegion: DEFAULT_REGION }
    );
    expect(rhythmCombined.answeredRhythm).toBe(true);
    expect(rhythmCombined.workPattern).toBe('desk_sedentary');
    expect(rhythmCombined.culturalRhythms).toContain('intermittent_fasting');
    expect(rhythmCombined.climateSensitivity).toBe('summer_heat');
  });

  it('dynamically adapts caution chips based on region and dynamic suggestions without leaking Midwakh to Colombo', () => {
    const copyEn = getLocaleCopy('en');

    // 1. Colombo, Sri Lanka (LK) with dynamic suggestions
    const colomboRegion: RegionContext = {
      countryCode: 'LK',
      countryName: 'Sri Lanka',
      city: 'Colombo',
      detectedBy: 'user_selected',
      confirmed: true
    };

    const colomboSuggestions = [
      { id: '1', label: 'Joint & Mobility Sensitivity', category: 'physical' as const, countryCode: 'LK', popularityCount: 10 },
      { id: '2', label: 'Tobacco Tapering', category: 'substance' as const, countryCode: 'LK', popularityCount: 8 }
    ];

    const colomboChips = getQuickRepliesForStage({
      stage: 'cautions',
      lifestyleProfile: { region: colomboRegion, activeTags: [] },
      suggestions: colomboSuggestions,
      copy: copyEn
    });

    expect(colomboChips.some((chip) => chip.toLowerCase().includes('midwakh'))).toBe(false);
    expect(colomboChips.some((chip) => chip.toLowerCase().includes('dokha'))).toBe(false);
    expect(colomboChips.some((chip) => chip.toLowerCase().includes('shisha'))).toBe(false);
    expect(colomboChips).toContain('Joint & Mobility Sensitivity');
    expect(colomboChips).toContain('Tobacco Tapering');

    // 2. Colombo, Sri Lanka without suggestions (fallbacks)
    const colomboFallbackChips = getQuickRepliesForStage({
      stage: 'cautions',
      lifestyleProfile: { region: colomboRegion, activeTags: [] },
      suggestions: [],
      copy: copyEn
    });

    expect(colomboFallbackChips.some((chip) => chip.toLowerCase().includes('midwakh'))).toBe(false);
    expect(colomboFallbackChips.some((chip) => chip.toLowerCase().includes('dokha'))).toBe(false);
    expect(colomboFallbackChips.some((chip) => chip.toLowerCase().includes('shisha'))).toBe(false);
    expect(colomboFallbackChips).toContain(copyEn.profile.smokingOptions.cigarettes);

    // 3. UAE (AE) correctly presents Midwakh / Dokha
    const uaeChips = getQuickRepliesForStage({
      stage: 'cautions',
      lifestyleProfile: { region: DEFAULT_REGION, activeTags: [] },
      suggestions: [],
      copy: copyEn
    });

    expect(uaeChips).toContain(copyEn.profile.smokingOptions.midwakh_dokha);
    expect(uaeChips).toContain(copyEn.profile.smokingOptions.shisha_waterpipe);
  });

  it('recognizes Colombo in the region question without freeform country code degradation', () => {
    const parsed = parseConversationalLifestyleAnswer('Colombo', 'region', {
      currentRegion: DEFAULT_REGION
    });
    expect(parsed.answeredRegion).toBe(true);
    expect(parsed.region?.city).toBe('Colombo');
    expect(parsed.region?.countryCode).toBe('LK');
    expect(parsed.region?.countryName).toBe('Sri Lanka');
  });
});
