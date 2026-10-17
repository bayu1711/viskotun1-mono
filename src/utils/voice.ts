export interface SimpleVoice {
  name: string;
  lang: string;
  default?: boolean;
}

/**
 * Score a speech synthesis voice based on naturalness and human fidelity.
 * Heavily penalizes legacy robotic synthesizer gag voices that frequently default on older OSes.
 */
export function scoreVoice(v: SimpleVoice): number {
  const name = v.name.toLowerCase();

  // Explicitly penalize novelty / robotic synthesizer gag voices common on older desktop OSes
  const isNovelty = [
    'albert',
    'bad news',
    'bahh',
    'bells',
    'boing',
    'bubbles',
    'cellos',
    'fred',
    'good news',
    'jester',
    'junior',
    'organ',
    'superstar',
    'ralph',
    'trinoids',
    'whisper',
    'zarvox',
    'wobble'
  ].some((novelty) => name.includes(novelty));

  if (isNovelty) return -100;

  // Google neural / natural voices (built into Chrome, Android)
  if (name.includes('google') && (name.includes('us english') || name.includes('natural'))) return 100;
  if (name.includes('google') && name.includes('uk english')) return 92;
  if (name.includes('google')) return 88;

  // Microsoft Natural online voices (Edge, Windows)
  if (name.includes('natural')) return 85;

  // Apple Enhanced or Premium voices (macOS, iOS)
  if (name.includes('enhanced') || name.includes('premium')) return 80;
  if (name.includes('siri')) return 78;

  // High-fidelity standard human voices
  if (
    ['samantha', 'ava', 'daniel', 'karen', 'victoria', 'serena', 'oliver', 'kate', 'allison'].some((n) =>
      name.includes(n)
    )
  ) {
    return 70;
  }

  // Good standard English default
  if (v.lang === 'en-US' && v.default) return 50;
  if (v.lang === 'en-US') return 40;
  if (v.lang.startsWith('en')) return 30;

  return 10;
}

/**
 * Filters out low-quality/robotic voices and sorts remaining voices by naturalness.
 */
export function getCuratedNaturalVoices<T extends SimpleVoice>(voices: T[]): T[] {
  if (!voices || voices.length === 0) return [];
  const english = voices.filter((v) => v.lang.startsWith('en'));
  const pool = english.length > 0 ? english : voices;

  return [...pool]
    .filter((v) => scoreVoice(v) > 0)
    .sort((a, b) => scoreVoice(b) - scoreVoice(a));
}

/**
 * Formats a raw TTS voice name into a clean, human-readable display string.
 */
export function formatVoiceName(name: string): string {
  if (!name) return 'Natural Coach';
  return name.replace(/\s*\(.*/, '').trim();
}
