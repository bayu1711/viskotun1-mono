import React from 'react';
import { COPY } from '../../data/copy';
import { cn } from '../../utils/cn';

type EfficacyTone = 'cream' | 'mint';

const TONES: Record<EfficacyTone, string> = {
  cream: 'bg-cream',
  mint: 'bg-mint'
};

interface EfficacyCardProps {
  label: string;
  value: number;
  caption: string;
  tone: EfficacyTone;
}

export function EfficacyCard({ label, value, caption, tone }: EfficacyCardProps) {
  return (
    <article className={cn('flex min-h-card flex-col rounded-card p-4 sm:p-5', TONES[tone])}>
      <h2 className="text-body lowercase">{label}</h2>
      <p className="mt-auto pt-6 text-jumbo font-light leading-none tabular-nums sm:text-jumbo-lg">
        {value}
        <span className="text-ink/35">{COPY.common.percentSign}</span>
      </p>
      <p className="mt-2 text-xs lowercase text-ink/45">{caption}</p>
    </article>);

}