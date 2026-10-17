import React from 'react';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import { COPY } from '../../data/copy';
import type { Tone } from '../../types/routine';
import { cn } from '../../utils/cn';
import { toneStyles } from '../../utils/tones';
import { Icon } from '../ui/Icon';

const STEP_BUTTON =
'relative flex h-8 w-8 items-center justify-center rounded-full transition-colors before:absolute before:-inset-1.5 disabled:opacity-30 focus:outline-none focus-visible:ring-2 focus-visible:ring-current';

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
  const styles = toneStyles[tone];

  return (
    <div className="mt-3 flex items-center justify-between gap-2">
      <span className={cn('truncate text-xs', styles.muted)}>{perSetLabel}</span>
      <div role="group" aria-label={COPY.task.counterLabel(action)} className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={onDecrement}
          disabled={done === 0}
          aria-label={COPY.task.decrease(action)}
          className={cn(STEP_BUTTON, styles.minus)}>
          
          <Icon icon={RemoveIcon} size="sm" />
        </button>
        <button
          type="button"
          onClick={onIncrement}
          disabled={done === max}
          aria-label={COPY.task.increase(action)}
          className={cn(STEP_BUTTON, styles.plus)}>
          
          <Icon icon={AddIcon} size="sm" />
        </button>
      </div>
    </div>);

}