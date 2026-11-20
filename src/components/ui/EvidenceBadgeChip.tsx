import React from 'react';
import type { SvgIconComponent } from '@mui/icons-material';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import { COPY } from '../../data/copy';
import type { EvidenceBadge } from '../../types/routine';
import { cn } from '../../utils/cn';
import { Icon } from './Icon';

const BADGE_CONFIG: Record<EvidenceBadge, { label: string; className: string; icon?: SvgIconComponent }> = {
  rct: { label: COPY.badges.rct, className: 'bg-mint/80 border border-mint text-ink font-medium shadow-2xs' },
  pilot: { label: COPY.badges.pilot, className: 'bg-sky/30 border border-sky/40 text-ink font-medium shadow-2xs' },
  'missing-parameters': {
    label: COPY.badges.missingParameters,
    className: 'bg-yellow/40 border border-yellow/50 text-ink font-medium shadow-2xs',
    icon: WarningAmberOutlinedIcon
  }
};

interface EvidenceBadgeChipProps {
  badge: EvidenceBadge;
}

export function EvidenceBadgeChip({ badge }: EvidenceBadgeChipProps) {
  const { label, className, icon } = BADGE_CONFIG[badge];
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs', className)}>
      {icon && <Icon icon={icon} size="xs" />}
      <span>{label}</span>
    </span>
  );
}