import React from 'react';
import CheckIcon from '@mui/icons-material/Check';
import { COPY } from '../../data/copy';
import type { Tone } from '../../types/routine';
import { cn } from '../../utils/cn';
import { toneStyles } from '../../utils/tones';
import { Icon } from './Icon';

interface CheckToggleProps {
  checked: boolean;
  onToggle: () => void;
  /** Name of the item being toggled, used for the accessible label. */
  itemLabel: string;
  tone?: Tone;
}

export function CheckToggle({ checked, onToggle, itemLabel, tone = 'cream' }: CheckToggleProps) {
  const styles = toneStyles[tone];
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={checked}
      aria-label={checked ? COPY.task.uncheck(itemLabel) : COPY.task.complete(itemLabel)}
      className={cn(
        'relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors before:absolute before:-inset-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-current',
        checked ? styles.checkOn : styles.checkOff
      )}>
      
      <Icon icon={CheckIcon} size="xs" />
    </button>);

}