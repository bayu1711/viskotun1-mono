import { describe, expect, it } from 'vitest';
import { formatVoiceName, getCuratedNaturalVoices, scoreVoice } from '../voice';

describe('Voice curation utility', () => {
  it('penalizes legacy robotic and novelty voices', () => {
    expect(scoreVoice({ name: 'Albert', lang: 'en-US' })).toBeLessThan(0);
    expect(scoreVoice({ name: 'Fred', lang: 'en-US' })).toBeLessThan(0);
    expect(scoreVoice({ name: 'Zarvox', lang: 'en-US' })).toBeLessThan(0);
    expect(scoreVoice({ name: 'Trinoids', lang: 'en-US' })).toBeLessThan(0);
  });

  it('prioritizes Google neural and natural voices', () => {
    const googleVoice = scoreVoice({ name: 'Google US English', lang: 'en-US' });
    const standardVoice = scoreVoice({ name: 'Samantha', lang: 'en-US' });
    expect(googleVoice).toBeGreaterThan(standardVoice);
  });

  it('filters out novelty voices and ranks by quality', () => {
    const voices = [
      { name: 'Albert', lang: 'en-US' },
      { name: 'Fred', lang: 'en-US' },
      { name: 'Samantha', lang: 'en-US' },
      { name: 'Google US English', lang: 'en-US' },
      { name: 'Samantha (Enhanced)', lang: 'en-US' },
      { name: 'Daniel', lang: 'en-GB' },
      { name: 'Zarvox', lang: 'en-US' }
    ];

    const curated = getCuratedNaturalVoices(voices);
    expect(curated.map((v) => v.name)).toEqual([
      'Google US English',
      'Samantha (Enhanced)',
      'Samantha',
      'Daniel'
    ]);
  });

  it('cleans up voice display names', () => {
    expect(formatVoiceName('Samantha (Enhanced)')).toBe('Samantha');
    expect(formatVoiceName('Daniel (English (United Kingdom))')).toBe('Daniel');
    expect(formatVoiceName('Google US English')).toBe('Google US English');
  });
});
