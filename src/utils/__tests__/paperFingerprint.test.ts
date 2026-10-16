import { describe, expect, it } from 'vitest';
import {
  normalizeDoi,
  normalizeTitle,
  sanitizeDocId,
  getCanonicalPaperId
} from '../paperFingerprint';

describe('paperFingerprint', () => {
  describe('normalizeDoi', () => {
    it('normalizes standard DOI strings', () => {
      expect(normalizeDoi('10.1016/j.jsr.2023.04.017')).toBe('10.1016/j.jsr.2023.04.017');
    });

    it('strips https://doi.org/ prefix', () => {
      expect(normalizeDoi('https://doi.org/10.1016/j.jsr.2023.04.017')).toBe('10.1016/j.jsr.2023.04.017');
    });

    it('strips doi: scheme prefix', () => {
      expect(normalizeDoi('doi: 10.1038/s41598-024-54249-9')).toBe('10.1038/s41598-024-54249-9');
    });

    it('handles empty or null inputs', () => {
      expect(normalizeDoi(undefined)).toBeNull();
      expect(normalizeDoi('')).toBeNull();
      expect(normalizeDoi('   ')).toBeNull();
    });
  });

  describe('normalizeTitle', () => {
    it('produces clean URL-safe and Firestore-safe slugs', () => {
      expect(normalizeTitle('Eccentric Loading for Mid-Portion Achilles Tendinopathy: A RCT'))
        .toBe('eccentric-loading-for-mid-portion-achilles-tendinopathy-a-rct');
    });
  });

  describe('sanitizeDocId', () => {
    it('replaces slashes and punctuation with underscores for Firestore document safety', () => {
      expect(sanitizeDocId('10.1016/j.jsr.2023.04.017')).toBe('10_1016_j_jsr_2023_04_017');
    });
  });

  describe('getCanonicalPaperId', () => {
    it('preserves known preset aliases for built-in sample protocols', () => {
      expect(getCanonicalPaperId({ id: 'achilles' })).toBe('achilles');
      expect(getCanonicalPaperId({ doi: '10.1016/j.jsr.2023.04.017' })).toBe('achilles');
      expect(getCanonicalPaperId({ doi: '10.4103/0974-7753.114700' })).toBe('hair-loss');
    });

    it('generates deterministic doi__ id for newly extracted papers with DOI', () => {
      const canonical = getCanonicalPaperId({
        doi: '10.1136/bjsports-2022-106000',
        title: 'Exercise Therapy for Patellar Tendinopathy'
      });
      expect(canonical).toBe('doi__10_1136_bjsports-2022-106000');
    });

    it('falls back to title slug and year when paper lacks DOI', () => {
      const canonical = getCanonicalPaperId({
        title: 'Cognitive Behavioral Therapy for Insomnia in Adults',
        year: 2024
      });
      expect(canonical).toBe('paper__cognitive-behavioral-therapy-for-insomnia-in-adults_2024');
    });
  });
});
