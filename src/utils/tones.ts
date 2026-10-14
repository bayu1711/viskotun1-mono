import { PAIN_MILD_MAX, PAIN_MODERATE_MAX } from '../data/config';
import { COPY } from '../data/copy';
import type { Tone } from '../types/protocol';

interface ToneStyle {
  card: string;
  muted: string;
  minus: string;
  plus: string;
  checkOn: string;
  checkOff: string;
  divider: string;
}

const LIGHT_SURFACE: Omit<ToneStyle, 'card'> = {
  muted: 'text-ink/45',
  minus: 'border border-ink text-ink hover:bg-ink/5',
  plus: 'bg-ink text-white hover:bg-ink/85',
  checkOn: 'bg-ink text-white',
  checkOff: 'border border-ink/40 text-transparent hover:text-ink/40',
  divider: 'border-ink/10'
};

export const toneStyles: Record<Tone, ToneStyle> = {
  ink: {
    card: 'bg-ink text-white',
    muted: 'text-white/45',
    minus: 'border border-white/50 text-white hover:bg-white/10',
    plus: 'bg-white text-ink hover:bg-white/90',
    checkOn: 'bg-white text-ink',
    checkOff: 'border border-white/40 text-transparent hover:text-white/50',
    divider: 'border-white/15'
  },
  cream: { card: 'bg-cream text-ink', ...LIGHT_SURFACE },
  mint: { card: 'bg-mint text-ink', ...LIGHT_SURFACE }
};

export type PainLevel = 'mild' | 'moderate' | 'severe';

interface PainToneStyle {
  /** Drawer background */
  panel: string;
  /** Score chip background */
  chip: string;
  /** Text color used for slider fill and thumb ring (via currentColor) */
  accent: string;
}

const PAIN_TONES: Record<PainLevel, PainToneStyle> = {
  mild: { panel: 'bg-mint', chip: 'bg-mint', accent: 'text-success' },
  moderate: { panel: 'bg-cream', chip: 'bg-cream', accent: 'text-warning' },
  severe: { panel: 'bg-blush', chip: 'bg-blush', accent: 'text-danger' }
};

export function painLevel(score: number): PainLevel {
  if (score <= PAIN_MILD_MAX) return 'mild';
  if (score <= PAIN_MODERATE_MAX) return 'moderate';
  return 'severe';
}

export function painTone(score: number) {
  const level = painLevel(score);
  return { level, label: COPY.painLevels[level], ...PAIN_TONES[level] };
}

export type PainTone = ReturnType<typeof painTone>;