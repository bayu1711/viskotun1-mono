import React from 'react';
import { COPY } from '../../data/copy';
import { cn } from '../../utils/cn';
import { clamp, toPercent } from '../../utils/math';

type RingSize = 36 | 38 | 40;
type RingTone = 'ink' | 'ink-bare' | 'light' | 'light-bare';
type RingWeight = 'thin' | 'regular';

const VIEWBOX = 40;
const CENTER = VIEWBOX / 2;

const SIZE_CLASS: Record<RingSize, string> = {
  36: 'h-9 w-9',
  38: 'h-cell w-cell',
  40: 'h-10 w-10'
};

const TONE_CLASS: Record<RingTone, {progress: string;track: string;}> = {
  ink: { progress: 'stroke-ink', track: 'stroke-ink/10' },
  'ink-bare': { progress: 'stroke-ink', track: 'stroke-transparent' },
  light: { progress: 'stroke-white', track: 'stroke-white/20' },
  'light-bare': { progress: 'stroke-white', track: 'stroke-transparent' }
};

const STROKE_WIDTH: Record<RingWeight, number> = {
  thin: 1.5,
  regular: 3
};

interface ProgressRingProps {
  /** Completion ratio, 0–1 */
  value: number;
  size?: RingSize;
  tone?: RingTone;
  weight?: RingWeight;
  label?: string;
  /** Hide from assistive tech when a sibling already conveys the value. */
  decorative?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function ProgressRing({
  value,
  size = 40,
  tone = 'ink',
  weight = 'regular',
  label,
  decorative = false,
  className,
  children
}: ProgressRingProps) {
  const stroke = STROKE_WIDTH[weight];
  const radius = (VIEWBOX - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = clamp(value, 0, 1);
  const colors = TONE_CLASS[tone];

  return (
    <div
      role={decorative ? undefined : 'img'}
      aria-hidden={decorative || undefined}
      aria-label={decorative ? undefined : label ?? COPY.common.percentComplete(toPercent(clamped))}
      className={cn('relative inline-flex shrink-0 items-center justify-center', SIZE_CLASS[size], className)}>
      
      <svg viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`} className="absolute inset-0 h-full w-full -rotate-90" aria-hidden="true">
        <circle cx={CENTER} cy={CENTER} r={radius} fill="none" strokeWidth={stroke} className={colors.track} />
        <circle
          cx={CENTER}
          cy={CENTER}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - clamped)}
          className={cn('transition-ring duration-400 ease-out', colors.progress)} />
        
      </svg>
      {children && <span className="relative flex items-center justify-center">{children}</span>}
    </div>);

}