import { describe, expect, it } from 'vitest';
import {
  getRegionalSuggestions,
  recordCrowdsourcedTag,
  parseLifestyleDeterministically
} from '../regionalRegistry';

describe('regionalRegistry', () => {
  describe('getRegionalSuggestions', () => {
    it('returns UAE presets for AE including Midwakh, Shisha, and Ramadan', () => {
      const suggestions = getRegionalSuggestions('AE');
      expect(suggestions.length).toBeGreaterThanOrEqual(5);

      const labels = suggestions.map((s) => s.label);
      expect(labels.some((l) => l.includes('Ramadan'))).toBe(true);
      expect(labels.some((l) => l.includes('Midwakh'))).toBe(true);
      expect(labels.some((l) => l.includes('Shisha'))).toBe(true);
      expect(labels.some((l) => l.includes('Shift Work'))).toBe(true);
      expect(labels.some((l) => l.includes('Heat'))).toBe(true);
    });

    it('returns Saudi presets for SA', () => {
      const suggestions = getRegionalSuggestions('SA');
      expect(suggestions.length).toBeGreaterThanOrEqual(4);
      expect(suggestions[0].countryCode).toBe('SA');
      const labels = suggestions.map((s) => s.label);
      expect(labels.some((l) => l.includes('Ramadan'))).toBe(true);
      expect(labels.some((l) => l.includes('Shisha'))).toBe(true);
    });

    it('returns culturally diverse options for US including fasting and late family meals', () => {
      const suggestions = getRegionalSuggestions('US');
      expect(suggestions.length).toBeGreaterThanOrEqual(5);
      const labels = suggestions.map((s) => s.label);
      expect(labels.some((l) => l.includes('Intermittent Fasting'))).toBe(true);
      expect(labels.some((l) => l.includes('Late Family Dinner'))).toBe(true);
    });

    it('falls back gracefully to GLOBAL presets for unrecognized country codes', () => {
      const suggestions = getRegionalSuggestions('ZZ');
      expect(suggestions.length).toBeGreaterThan(0);
      const labels = suggestions.map((s) => s.label);
      expect(labels.some((l) => l.includes('Rotating Night Shifts'))).toBe(true);
    });
  });

  describe('recordCrowdsourcedTag', () => {
    it('registers a novel crowdsourced tag and increments popularity', () => {
      const tag1 = recordCrowdsourcedTag('AE', 'Falconry Desert Training', 'physical');
      expect(tag1.popularityCount).toBe(1);
      expect(tag1.label).toBe('Falconry Desert Training');

      // Recording the same tag again increments popularity
      const tag2 = recordCrowdsourcedTag('AE', 'Falconry Desert Training', 'physical');
      expect(tag2.popularityCount).toBe(2);

      const suggestions = getRegionalSuggestions('AE');
      expect(suggestions.some((s) => s.label === 'Falconry Desert Training')).toBe(true);
    });
  });

  describe('parseLifestyleDeterministically', () => {
    it('detects midwakh/dokha tobacco consumption', () => {
      const result = parseLifestyleDeterministically('I smoke midwakh twice a day');
      expect(result.profileUpdates.smokingStatus).toBe('midwakh_dokha');
      expect(result.extractedTags).toContain('Midwakh / Dokha Tobacco');
      expect(result.reply.toLowerCase()).toContain('nicotine');
    });

    it('detects shisha / waterpipe consumption', () => {
      const result = parseLifestyleDeterministically('I enjoy shisha on weekends with friends');
      expect(result.profileUpdates.smokingStatus).toBe('shisha_waterpipe');
      expect(result.extractedTags).toContain('Shisha / Waterpipe');
    });

    it('detects healthcare shift work schedule', () => {
      const result = parseLifestyleDeterministically('I work rotating 12-hour night shifts as a nurse');
      expect(result.profileUpdates.workPattern).toBe('shift_work');
      expect(result.extractedTags).toContain('Shift Work / Night Shifts');
      expect(result.reply.toLowerCase()).toContain('routine');
    });

    it('detects Ramadan fasting observance', () => {
      const result = parseLifestyleDeterministically('Currently observing Ramadan fasting during daylight hours');
      expect(result.profileUpdates.isRamadanFastingObserver).toBe(true);
      expect(result.extractedTags).toContain('Ramadan Fasting Observer');
      expect(result.reply.toLowerCase()).toContain('iftar');
    });

    it('detects extreme gulf summer heat sensitivity', () => {
      const result = parseLifestyleDeterministically('Extreme summer heat makes outdoor sessions difficult');
      expect(result.profileUpdates.climateSensitivity).toBe('summer_heat');
      expect(result.extractedTags).toContain('Summer Heat Adaptation');
    });

    it('preserves existing profile tags when merging updates', () => {
      const existingProfile = {
        activeTags: ['Ramadan Fasting Observer'],
        isRamadanFastingObserver: true
      };
      const result = parseLifestyleDeterministically('I also smoke shisha', existingProfile);
      expect(result.profileUpdates.smokingStatus).toBe('shisha_waterpipe');
      expect(result.profileUpdates.activeTags).toContain('Ramadan Fasting Observer');
      expect(result.profileUpdates.activeTags).toContain('Shisha / Waterpipe');
    });

    it('detects diverse cultural rhythms such as late family dinner, dawn rising, and weekly Sabbath rest', () => {
      const result = parseLifestyleDeterministically(
        'We have late dinner at 21:30 with family and observe Sunday rest'
      );
      expect(result.profileUpdates.culturalRhythms).toEqual(
        expect.arrayContaining(['late_family_dinner', 'sabbath_weekly_rest'])
      );
      expect(result.extractedTags).toContain('Late Family Dinner (21:00+)');
    });
  });
});
