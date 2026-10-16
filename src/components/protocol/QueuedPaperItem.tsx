import React from 'react';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import type { QueuedPaper } from '../../types/routine';
import { cn } from '../../utils/cn';
import { Icon } from '../ui/Icon';
import { IconTile } from '../ui/IconTile';
import { PaperRowText } from './PaperRowText';

type QueuedVariant = 'menu' | 'card';

const VARIANT_STYLES: Record<QueuedVariant, {row: string;title: string;meta: string;}> = {
  menu: { row: 'p-2.5 text-ink/40', title: '', meta: 'text-current' },
  card: { row: 'border border-dashed border-ink/30 p-2.5 pr-4', title: 'text-ink/55', meta: 'text-ink/40' }
};

interface QueuedPaperItemProps {
  paper: QueuedPaper;
  variant: QueuedVariant;
}

/** A paper still being extracted — non-interactive. In the switcher it renders as a disabled option. */
export function QueuedPaperItem({ paper, variant }: QueuedPaperItemProps) {
  const styles = VARIANT_STYLES[variant];
  const isMenu = variant === 'menu';

  return (
    <li
      role={isMenu ? 'option' : undefined}
      aria-selected={isMenu ? false : undefined}
      aria-disabled="true"
      className={cn('flex items-center gap-3 rounded-tile', styles.row)}>
      
      <IconTile
        variant={isMenu ? 'dashed' : 'muted'}
        shape={isMenu ? 'circle' : 'square'}
        size={40}>
        
        <Icon icon={HourglassEmptyIcon} size={isMenu ? 'sm' : 'md'} />
      </IconTile>
      <PaperRowText title={paper.name} meta={paper.note} titleClassName={styles.title} metaClassName={styles.meta} />
    </li>);

}