import React from 'react';
import { cn } from '../../utils/cn';

import { useLocale } from '../../contexts/LocaleContext';
type EfficacyTone = 'cream' | 'mint' | 'orange' | 'yellow' | 'sky' | 'lavender' | 'peach';

interface EfficacyStyle {
  card: string;
  percent: string;
  caption: string;
}

const TONES: Record<EfficacyTone, EfficacyStyle> = {
  orange: { card: 'bg-orange text-ink shadow-2xs', percent: 'text-ink/70', caption: 'text-ink/80' },
  yellow: { card: 'bg-yellow text-ink shadow-2xs', percent: 'text-ink/75', caption: 'text-ink/80' },
  sky: { card: 'bg-sky text-ink shadow-2xs', percent: 'text-ink/75', caption: 'text-ink/80' },
  lavender: { card: 'bg-lavender text-ink shadow-2xs', percent: 'text-ink/75', caption: 'text-ink/80' },
  peach: { card: 'bg-peach text-ink shadow-2xs', percent: 'text-ink/75', caption: 'text-ink/80' },
  cream: { card: 'bg-cream text-ink shadow-2xs', percent: 'text-ink/75', caption: 'text-ink/80' },
  mint: { card: 'bg-mint text-ink shadow-2xs', percent: 'text-ink/75', caption: 'text-ink/80' }
};

interface EfficacyCardProps {
  label: string;
  value: number;
  caption: string;
  tone: EfficacyTone;
}

export function EfficacyCard({ label, value, caption, tone }: EfficacyCardProps) {
  const { copy } = useLocale();
  const styles = TONES[tone];
  return (
    <article className={cn('flex min-h-card flex-col rounded-card p-4 sm:p-5', styles.card)}>
      <h2 className="text-body font-medium">{label}</h2>
      <p className="mt-auto pt-6 text-jumbo font-light leading-none tabular-nums sm:text-jumbo-lg">
        {value}
        <span className={styles.percent}>{copy.common.percentSign}</span>
      </p>
      <p className={cn('mt-2 text-xs', styles.caption)}>{caption}</p>
    </article>
  );
}