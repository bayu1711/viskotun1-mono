import React from 'react';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import type { Tone } from '../../types/routine';
import { cn } from '../../utils/cn';
import { toneStyles } from '../../utils/tones';
import { Icon } from '../ui/Icon';

import { useLocale } from '../../contexts/LocaleContext';
const STEP_BUTTON =
'relative flex h-11 w-11 items-center justify-center rounded-full transition-[color,background-color,transform] duration-150 active:scale-95 disabled:opacity-30 focus:outline-none focus-visible:ring-2 focus-visible:ring-current';

interface SetCounterProps {
  action: string;
  done: number;
  max: number;
  perSetLabel: string;
  tone: Tone;
  onIncrement: () => void;
  onDecrement: () => void;
}

export function SetCounter({ action, done, max, perSetLabel, tone, onIncrement, onDecrement }: SetCounterProps) {
  const { copy } = useLocale();
  const styles = toneStyles[tone];

  return (
    <div className="mt-3 flex items-center justify-between gap-2">
      <span className={cn('truncate text-xs', styles.muted)}>{perSetLabel}</span>
      <div role="group" aria-label={copy.task.counterLabel(action)} className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={onDecrement}
          disabled={done === 0}
          aria-label={copy.task.decrease(action)}
          className={cn(STEP_BUTTON, styles.minus)}>
          
          <Icon icon={RemoveIcon} size="sm" />
        </button>
        <button
          type="button"
          onClick={onIncrement}
          disabled={done === max}
          aria-label={copy.task.increase(action)}
          className={cn(STEP_BUTTON, styles.plus)}>
          
          <Icon icon={AddIcon} size="sm" />
        </button>
      </div>
    </div>);

}