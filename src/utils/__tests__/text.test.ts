import { describe, expect, it } from 'vitest';
import {
  capitalizeWord,
  formatPhaseLabel,
  formatRoutineTitle,
  formatStatLabel,
  toSentenceCase,
  toTitleCase
} from '../text';

describe('UI Defensive Text Normalization Utilities', () => {
  describe('capitalizeWord', () => {
    it('capitalizes a single lowercase word', () => {
      expect(capitalizeWord('achilles')).toBe('Achilles');
      expect(capitalizeWord('rehab')).toBe('Rehab');
      expect(capitalizeWord('week')).toBe('Week');
    });

    it('handles hyphenated compound words', () => {
      expect(capitalizeWord('n-back')).toBe('N-Back');
      expect(capitalizeWord('full-body')).toBe('Full-Body');
    });

    it('preserves existing acronyms and all-caps words', () => {
      expect(capitalizeWord('IMST')).toBe('IMST');
      expect(capitalizeWord('RCT')).toBe('RCT');
      expect(capitalizeWord('N1')).toBe('N1');
    });

    it('handles strings with numbers or special suffixes', () => {
      expect(capitalizeWord('12RM')).toBe('12RM');
      expect(capitalizeWord('1')).toBe('1');
    });

    it('handles empty and nullish inputs safely', () => {
      expect(capitalizeWord('')).toBe('');
    });
  });

  describe('toTitleCase', () => {
    it('converts multi-word lowercase strings to title case', () => {
      expect(toTitleCase('achilles rehab')).toBe('Achilles Rehab');
      expect(toTitleCase('week 1')).toBe('Week 1');
      expect(toTitleCase('plantar fasciitis')).toBe('Plantar Fasciitis');
      expect(toTitleCase('warm bath sleep')).toBe('Warm Bath Sleep');
      expect(toTitleCase('hair regrowth')).toBe('Hair Regrowth');
    });

    it('preserves acronyms within multi-word strings', () => {
      expect(toTitleCase('IMST breathing')).toBe('IMST Breathing');
      expect(toTitleCase('dual n-back')).toBe('Dual N-Back');
    });

    it('handles already capitalized strings idempotently', () => {
      expect(toTitleCase('Achilles Tendinopathy Rehab')).toBe('Achilles Tendinopathy Rehab');
      expect(toTitleCase('Heat Resilience')).toBe('Heat Resilience');
    });

    it('handles whitespace, empty, and nullish inputs safely', () => {
      expect(toTitleCase('')).toBe('');
      expect(toTitleCase('   ')).toBe('');
      expect(toTitleCase(null)).toBe('');
      expect(toTitleCase(undefined)).toBe('');
    });
  });

  describe('toSentenceCase', () => {
    it('capitalizes only the first character', () => {
      expect(toSentenceCase('week 1')).toBe('Week 1');
      expect(toSentenceCase('achilles rehab')).toBe('Achilles rehab');
      expect(toSentenceCase('active recovery')).toBe('Active recovery');
    });

    it('handles empty and nullish inputs safely', () => {
      expect(toSentenceCase('')).toBe('');
      expect(toSentenceCase(null)).toBe('');
      expect(toSentenceCase(undefined)).toBe('');
    });
  });

  describe('formatRoutineTitle', () => {
    it('formats routine titles defensively', () => {
      expect(formatRoutineTitle('achilles rehab')).toBe('Achilles Rehab');
      expect(formatRoutineTitle('hair regrowth')).toBe('Hair Regrowth');
      expect(formatRoutineTitle('patellar rehab')).toBe('Patellar Rehab');
      expect(formatRoutineTitle('creatine sleep')).toBe('Creatine Sleep');
      expect(formatRoutineTitle(undefined)).toBe('');
      expect(formatRoutineTitle(null)).toBe('');
    });
  });

  describe('formatPhaseLabel', () => {
    it('formats phase labels defensively', () => {
      expect(formatPhaseLabel('week 1')).toBe('Week 1');
      expect(formatPhaseLabel('day 1')).toBe('Day 1');
      expect(formatPhaseLabel('loading')).toBe('Loading');
      expect(formatPhaseLabel('Phase 1: Week 1–2')).toBe('Phase 1: Week 1–2');
      expect(formatPhaseLabel(undefined)).toBe('');
      expect(formatPhaseLabel(null)).toBe('');
    });
  });

  describe('formatStatLabel', () => {
    it('capitalizes stat labels while preserving punctuation', () => {
      expect(formatStatLabel('dose:')).toBe('Dose:');
      expect(formatStatLabel('tempo:')).toBe('Tempo:');
      expect(formatStatLabel('resistance:')).toBe('Resistance:');
      expect(formatStatLabel('Hold:')).toBe('Hold:');
      expect(formatStatLabel('Target:')).toBe('Target:');
      expect(formatStatLabel(undefined)).toBe('');
      expect(formatStatLabel(null)).toBe('');
    });
  });
});
