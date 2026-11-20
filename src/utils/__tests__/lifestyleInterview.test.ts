import { describe, expect, it } from 'vitest';
import { getLocaleCopy } from '../../data/locales';
import type { RegionContext, RegionalLifestyleTag, UserLifestyleProfile } from '../../types/auth';
import {
  buildConversationalLifestyleReply,
  buildProfileUpdatesFromParse,
  computeNextInterviewStage,
  formatRegionLabel,
  getQuickRepliesForStage,
  getStagePlaceholder,
  isLifestyleCommandOrQuestion,
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
          'ramadan_fasting',
          'desk_bound_worker',
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

    for (const stage of ['region', 'age', 'availability', 'age_time', 'rhythm', 'cautions', 'complete'] as const) {
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

  it('provides "Explore routines" on completion with chips to change routine (schedule, intensity, cautions, rhythm) instead of listing other routines', () => {
    const copyEn = getLocaleCopy('en');
    const copyAr = getLocaleCopy('ar');

    const dummySuggestions: RegionalLifestyleTag[] = [
      { id: 'tag-1', label: 'Gentle fasting-day recovery', category: 'culture', countryCode: 'AE', popularityCount: 10 },
      { id: 'tag-2', label: 'Quick home-based movement', category: 'schedule', countryCode: 'AE', popularityCount: 9 },
      { id: 'tag-3', label: 'Protecting your sleep', category: 'schedule', countryCode: 'AE', popularityCount: 8 }
    ];

    const completeChipsWithoutRoutine = getQuickRepliesForStage({
      stage: 'complete',
      lifestyleProfile: { region: DEFAULT_REGION, activeTags: [] },
      suggestions: dummySuggestions,
      copy: copyEn,
      hasActiveRoutine: false
    });
    expect(completeChipsWithoutRoutine[0]).toBe(copyEn.lifestyleTuning.onboarding.quickExploreRoutines);
    expect(completeChipsWithoutRoutine).toContain(copyEn.lifestyleTuning.onboarding.quickChangeSchedule);
    expect(completeChipsWithoutRoutine).toContain(copyEn.lifestyleTuning.onboarding.quickLowerIntensity);
    expect(completeChipsWithoutRoutine).toContain(copyEn.lifestyleTuning.onboarding.quickAddCaution);
    expect(completeChipsWithoutRoutine).toContain(copyEn.lifestyleTuning.onboarding.quickChangeRhythm);
    // Crucial: other routines/suggestions must NOT be listed
    expect(completeChipsWithoutRoutine).not.toContain('Gentle fasting-day recovery');
    expect(completeChipsWithoutRoutine).not.toContain('Quick home-based movement');
    expect(completeChipsWithoutRoutine).not.toContain('Protecting your sleep');
    expect(completeChipsWithoutRoutine).not.toContain(copyEn.lifestyleTuning.onboarding.quickUpdateProfile);
    expect(completeChipsWithoutRoutine).not.toContain(copyEn.lifestyleTuning.onboarding.quickDone);

    const completeChipsWithRoutine = getQuickRepliesForStage({
      stage: 'complete',
      lifestyleProfile: { region: DEFAULT_REGION, activeTags: [] },
      suggestions: dummySuggestions,
      copy: copyEn,
      hasActiveRoutine: true
    });
    expect(completeChipsWithRoutine[0]).toBe(copyEn.lifestyleTuning.onboarding.quickExploreRoutines);
    expect(completeChipsWithRoutine[1]).toBe(copyEn.lifestyleTuning.onboarding.quickDone);
    expect(completeChipsWithRoutine).toContain(copyEn.lifestyleTuning.onboarding.quickChangeSchedule);
    expect(completeChipsWithRoutine).toContain(copyEn.lifestyleTuning.onboarding.quickLowerIntensity);
    expect(completeChipsWithRoutine).toContain(copyEn.lifestyleTuning.onboarding.quickAddCaution);

    const fastingChips = getQuickRepliesForStage({
      stage: 'complete',
      lifestyleProfile: { region: DEFAULT_REGION, culturalRhythms: ['ramadan_fasting'], activeTags: [] },
      suggestions: dummySuggestions,
      copy: copyEn,
      hasActiveRoutine: true
    });
    expect(fastingChips).toContain(copyEn.lifestyleTuning.onboarding.quickAdjustFasting);
    expect(fastingChips).not.toContain(copyEn.lifestyleTuning.onboarding.quickChangeRhythm);

    const completeChipsAr = getQuickRepliesForStage({
      stage: 'complete',
      lifestyleProfile: { region: DEFAULT_REGION, activeTags: [] },
      suggestions: dummySuggestions,
      copy: copyAr,
      hasActiveRoutine: false
    });
    expect(completeChipsAr[0]).toBe(copyAr.lifestyleTuning.onboarding.quickExploreRoutines);
    expect(completeChipsAr).toContain(copyAr.lifestyleTuning.onboarding.quickChangeSchedule);
    expect(completeChipsAr).toContain(copyAr.lifestyleTuning.onboarding.quickLowerIntensity);
    expect(completeChipsAr).toContain(copyAr.lifestyleTuning.onboarding.quickAddCaution);
    expect(completeChipsAr).toContain(copyAr.lifestyleTuning.onboarding.quickChangeRhythm);
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

  it('keeps initial profile availability unset so skipping age_time resolves to flexible anytime', () => {
    const skipped = parseConversationalLifestyleAnswer('Skip', 'age_time', {
      currentRegion: DEFAULT_REGION,
      currentUserProfile: {}
    });
    expect(skipped.answeredAgeTime).toBe(true);
    expect(skipped.availabilityMode).toBe('anytime');
    expect(skipped.availableWindows).toBeUndefined();
  });

  it('separates age and availability into distinct stages and supports multi-slot availability selection', () => {
    // Stage 1: region -> answers region -> next is age
    const regionAnswer = parseConversationalLifestyleAnswer('Colombo', 'region', {
      currentRegion: DEFAULT_REGION
    });
    const step1 = computeNextInterviewStage('region', regionAnswer, new Set());
    expect(step1.nextStage).toBe('age');

    // Stage 2: age -> answers age by typing -> next is availability
    const ageAnswer = parseConversationalLifestyleAnswer('29', 'age', {
      currentRegion: regionAnswer.region ?? DEFAULT_REGION
    });
    expect(ageAnswer.age).toBe(29);
    expect(ageAnswer.answeredAge).toBe(true);
    const step2 = computeNextInterviewStage('age', ageAnswer, new Set(step1.updatedAnswered));
    expect(step2.nextStage).toBe('availability');

    // Stage 3: availability -> user selects 2 slots (multi-select chip combination)
    const multiSlotAnswer = parseConversationalLifestyleAnswer(
      'Morning 07:30–09:00, Evening 19:00–21:00',
      'availability',
      { currentRegion: regionAnswer.region ?? DEFAULT_REGION }
    );
    expect(multiSlotAnswer.answeredAvailability).toBe(true);
    expect(multiSlotAnswer.availabilityMode).toBe('windows');
    expect(multiSlotAnswer.availableWindows).toHaveLength(2);
    expect(multiSlotAnswer.availableWindows?.[0]).toMatchObject({ start: '07:30', end: '09:00' });
    expect(multiSlotAnswer.availableWindows?.[1]).toMatchObject({ start: '19:00', end: '21:00' });

    const step3 = computeNextInterviewStage('availability', multiSlotAnswer, new Set(step2.updatedAnswered));
    expect(step3.nextStage).toBe('rhythm');
  });

  it('allows skipping age and selecting flexible anytime availability separately', () => {
    const skipAge = parseConversationalLifestyleAnswer('Prefer not to say · Skip', 'age', {
      currentRegion: DEFAULT_REGION
    });
    expect(skipAge.answeredAge).toBe(true);
    expect(skipAge.age).toBeUndefined();

    const step = computeNextInterviewStage('age', skipAge, new Set(['region']));
    expect(step.nextStage).toBe('availability');

    const anytimeAnswer = parseConversationalLifestyleAnswer('Flexible · Anytime', 'availability', {
      currentRegion: DEFAULT_REGION
    });
    expect(anytimeAnswer.answeredAvailability).toBe(true);
    expect(anytimeAnswer.availabilityMode).toBe('anytime');
    expect(anytimeAnswer.availableWindows).toBeUndefined();

    const nextStep = computeNextInterviewStage('availability', anytimeAnswer, new Set(step.updatedAnswered));
    expect(nextStep.nextStage).toBe('rhythm');
  });

  it('keeps unknown region neutral without fabricating Abu Dhabi or United Arab Emirates', () => {
    const copyEn = getLocaleCopy('en');
    const unknownRegion: RegionContext = {
      countryCode: '',
      countryName: '',
      detectedBy: 'default_global',
      confirmed: false
    };

    expect(formatRegionLabel(unknownRegion)).toBe('');
    expect(formatRegionLabel(undefined)).toBe('');

    const regionChips = getQuickRepliesForStage({
      stage: 'region',
      lifestyleProfile: { region: unknownRegion, activeTags: [] },
      suggestions: [],
      copy: copyEn
    });
    expect(regionChips.every((chip) => !chip.startsWith('Yes,'))).toBe(true);

    const yesOnUnknown = parseConversationalLifestyleAnswer('Yes', 'region', {
      currentRegion: unknownRegion
    });
    expect(yesOnUnknown.answeredRegion).toBe(false);
    expect(yesOnUnknown.region).toBeUndefined();
  });

  it('parses imperative region change commands and updates region without creating tags', () => {
    const res = parseConversationalLifestyleAnswer(
      'change my region to colombo sri lanka',
      'complete',
      { currentRegion: DEFAULT_REGION }
    );
    expect(res.answeredRegion).toBe(true);
    expect(res.region?.city).toBe('Colombo');
    expect(res.region?.countryCode).toBe('LK');
    expect(res.region?.countryName).toBe('Sri Lanka');
    expect(res.region?.confirmed).toBe(true);
    expect(res.extractedTags).not.toContain('change my region to colombo sri lanka');
    expect(res.customTags).not.toContain('change my region to colombo sri lanka');

    // Also verify free-form location change at complete stage
    const freeform = parseConversationalLifestyleAnswer(
      'set my location to Geneva, Switzerland',
      'complete',
      { currentRegion: DEFAULT_REGION }
    );
    expect(freeform.answeredRegion).toBe(true);
    expect(freeform.region?.city).toBe('Geneva');
    expect(freeform.region?.countryCode).toBe('CH');
    expect(freeform.region?.confirmed).toBe(true);

    // Verify Arabic imperative region change
    const arabic = parseConversationalLifestyleAnswer(
      'تغيير منطقتي إلى دبي',
      'complete',
      { currentRegion: DEFAULT_REGION }
    );
    expect(arabic.answeredRegion).toBe(true);
    expect(arabic.region?.city).toBe('Dubai');
    expect(arabic.region?.countryCode).toBe('AE');
  });

  it('correctly identifies commands and questions vs actual lifestyle habits', () => {
    expect(isLifestyleCommandOrQuestion('change my region to colombo sri lanka')).toBe(true);
    expect(isLifestyleCommandOrQuestion('set location to London')).toBe(true);
    expect(isLifestyleCommandOrQuestion('what is my current schedule?')).toBe(true);
    expect(isLifestyleCommandOrQuestion('can I change this later?')).toBe(true);
    expect(isLifestyleCommandOrQuestion('غير موقعي إلى أبوظبي')).toBe(true);

    expect(isLifestyleCommandOrQuestion('Early Dawn Riser')).toBe(false);
    expect(isLifestyleCommandOrQuestion('Tea / Caffeine Routine')).toBe(false);
    expect(isLifestyleCommandOrQuestion('Desk-bound sedentary')).toBe(false);
  });
});
