import React from 'react';
import { COPY } from '../../data/copy';
import type { EvidenceBadge } from '../../types/protocol';
import { cn } from '../../utils/cn';

const BADGE_CONFIG: Record<EvidenceBadge, {label: string;className: string;}> = {
  rct: { label: COPY.badges.rct, className: 'border border-ink text-ink' },
  pilot: { label: COPY.badges.pilot, className: 'border border-ink/25 text-ink/55' },
  'missing-parameters': { label: COPY.badges.missingParameters, className: 'bg-cream text-ink' }
};

interface EvidenceBadgeChipProps {
  badge: EvidenceBadge;
}

export function EvidenceBadgeChip({ badge }: EvidenceBadgeChipProps) {
  const { label, className } = BADGE_CONFIG[badge];
  return <span className={cn('inline-flex items-center rounded-full px-3 py-1 text-xs', className)}>{label}</span>;
}