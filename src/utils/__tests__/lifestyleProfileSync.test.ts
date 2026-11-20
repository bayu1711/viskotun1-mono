import { describe, expect, it } from 'vitest';
import { COPY } from '../../data/copy';
import { COPY_AR_OVERRIDE as AR_COPY } from '../../data/locales/ar';
import { buildProfileUpdatesFromParse, parseConversationalLifestyleAnswer } from '../lifestyleInterview';
import {
  CAUTION_PRESET_KEYS,
  coerceAvailableWindows,
  normalizePhysicalCautions,
  sanitizeLifestyleFields,
  syncLifestyleActiveTags
} from '../profile';

describe('Adaptive Lifestyle Profile ↔ N1 AI alignment', () => {
  it('maps legacy and localized caution labels onto one canonical list', () => {
    expect(
      normalizePhysicalCautions([
        'Lower back caution',
        'lower back sensitivity',
        'حساسية الركبة',
        '  Plantar fascia pain ',
        42
      ])
    ).toEqual(['Lower back sensitivity', 'Knee sensitivity', 'Plantar fascia pain']);
  });

  it('keeps cautions out of activeTags and drops stale derived labels', () => {
    const tags = syncLifestyleActiveTags({
      workPattern: 'shift_work',
      smokingStatus: 'non_smoker',
      physicalCautions: ['Shoulder mobility limit'],
      activeTags: [
        'Shoulder mobility limit',
        'Lower back sensitivity',
        'Cigarettes',
        'Shift Work / Night Shifts',
        'Gentle / Micro Pacing'
      ]
    });
    expect(tags).toEqual(['Gentle / Micro Pacing', 'healthcare_shift_worker']);
  });

  it('stores interview cautions in the same canonical form the /profile chips use', () => {
    const parsed = parseConversationalLifestyleAnswer('Shoulder pain and a stiff lower back', 'cautions', {
      currentRegion: { countryCode: 'IN', countryName: 'India', detectedBy: 'user_selected', confirmed: true }
    });
    const { profileUpdates } = buildProfileUpdatesFromParse(parsed, 'complete');
    expect(profileUpdates.physicalCautions).toEqual(['Lower back sensitivity', 'Shoulder mobility limit']);
    for (const caution of profileUpdates.physicalCautions ?? []) {
      expect(CAUTION_PRESET_KEYS).toContain(caution);
      expect(profileUpdates.activeTags).not.toContain(caution);
    }
  });

  it('does not overwrite a clinical goal the participant already wrote', () => {
    const parsed = parseConversationalLifestyleAnswer('none', 'cautions', {
      currentRegion: { countryCode: 'AE', countryName: 'United Arab Emirates', detectedBy: 'user_selected', confirmed: true }
    });
    const kept = buildProfileUpdatesFromParse(parsed, 'complete', {}, { clinicalGoals: 'Run a 10k' });
    expect(kept.userProfileUpdates.clinicalGoals).toBeUndefined();
    const filled = buildProfileUpdatesFromParse(parsed, 'complete', {}, {});
    expect(filled.userProfileUpdates.clinicalGoals).toBeTruthy();
  });

  it('drops AI enum values that the /profile form cannot show', () => {
    expect(
      sanitizeLifestyleFields({
        workPattern: 'night_owl',
        smokingStatus: 'other',
        climateSensitivity: 'winter_cold',
        activityBaseline: 'extreme',
        culturalRhythms: ['ramadan_fasting', 'made_up'],
        physicalCautions: ['knee sensitivity']
      })
    ).toEqual({
      smokingStatus: 'other',
      climateSensitivity: 'cold_climate',
      culturalRhythms: ['ramadan_fasting'],
      physicalCautions: ['Knee sensitivity']
    });
  });

  it('converts numeric AI time windows into HH:mm windows', () => {
    expect(coerceAvailableWindows([{ start: 6, end: 8.5 }, { start: '21:00', end: '22:30' }, { start: 'x' }])).toEqual([
      { id: 'win-0600', label: '', start: '06:00', end: '08:30' },
      { id: 'win-2100', label: '', start: '21:00', end: '22:30' }
    ]);
  });

  it('has a localized label for every canonical caution and managed tag', () => {
    for (const key of CAUTION_PRESET_KEYS) {
      expect(COPY.profile.cautionLabels[key]).toBeTruthy();
      expect(AR_COPY.profile?.cautionLabels?.[key]).toBeTruthy();
    }
    for (const key of Object.keys(COPY.profile.managedTagLabels)) {
      expect(AR_COPY.profile?.managedTagLabels?.[key as keyof typeof COPY.profile.managedTagLabels]).toBeTruthy();
    }
  });
});
