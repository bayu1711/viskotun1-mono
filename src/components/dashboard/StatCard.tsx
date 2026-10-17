import React from 'react';
import type { SvgIconComponent } from '@mui/icons-material';
import { cn } from '../../utils/cn';
import { Icon } from '../ui/Icon';

export type StatTone = 'ink' | 'cream' | 'mint' | 'white' | 'orange' | 'yellow' | 'sky' | 'lavender' | 'peach';

const TONES: Record<StatTone, {card: string;muted: string;}> = {
  ink: { card: 'bg-ink text-white', muted: 'text-white/60' },
  orange: { card: 'bg-orange text-white', muted: 'text-white/80' },
  yellow: { card: 'bg-yellow text-ink', muted: 'text-ink/65' },
  sky: { card: 'bg-sky text-ink', muted: 'text-ink/65' },
  lavender: { card: 'bg-lavender text-ink', muted: 'text-ink/65' },
  peach: { card: 'bg-peach text-ink', muted: 'text-ink/65' },
  cream: { card: 'bg-cream text-ink', muted: 'text-ink/60' },
  mint: { card: 'bg-mint text-ink', muted: 'text-ink/60' },
  white: { card: 'bg-white text-ink border border-ink/10', muted: 'text-ink/55' }
};

export interface StatCardProps {
  label: string;
  value: string;
  caption: string;
  tone: StatTone;
  icon: SvgIconComponent;
}

export function StatCard({ label, value, caption, tone, icon }: StatCardProps) {
  const styles = TONES[tone];
  return (
    <article className={cn('flex min-h-stat flex-col rounded-card p-4 transition-colors sm:p-5', styles.card)}>
      <h2 className="flex items-center gap-2 text-body">
        <Icon icon={icon} size="sm" />
        {label}
      </h2>
      <p className="mt-auto pt-6 text-display-sm font-light leading-none tracking-tight sm:text-display">
        {value}
      </p>
      <p className={cn('mt-2 text-xs', styles.muted)}>{caption}</p>
    </article>);

}