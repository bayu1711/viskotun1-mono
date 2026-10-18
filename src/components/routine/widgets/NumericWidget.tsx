'use client';

import React, { useState } from 'react';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import { COPY } from '../../../data/copy';
import type { DataCollectionField } from '../../../types/routine';
import { clamp } from '../../../utils/math';
import { CircleButton } from '../../ui/CircleButton';
import { Icon } from '../../ui/Icon';

interface NumericWidgetProps {
  field: DataCollectionField;
  value: number;
  onChange: (value: number) => void;
}

export function NumericWidget({ field, value, onChange }: NumericWidgetProps) {
  const min = field.min ?? 0;
  const max = field.max ?? 1000;
  const step = field.step ?? 1;
  const currentVal = typeof value === 'number' && !isNaN(value) ? value : min;
  // Typed text is kept as a draft so partial input ("1" on the way to "128") is not clamped
  const [draft, setDraft] = useState(String(currentVal));
  const [wasClamped, setWasClamped] = useState(false);

  const commit = (next: number) => {
    onChange(next);
    setDraft(String(next));
  };

  const handleStep = (delta: number) => {
    setWasClamped(false);
    commit(clamp(currentVal + delta, min, max));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDraft(e.target.value);
    const parsed = parseFloat(e.target.value);
    if (!isNaN(parsed) && parsed >= min && parsed <= max) {
      setWasClamped(false);
      onChange(parsed);
    }
  };

  /** Out-of-range or empty input snaps to the nearest valid value when the user leaves the field. */
  const handleCommit = () => {
    const parsed = parseFloat(draft);
    if (isNaN(parsed)) {
      setDraft(String(currentVal));
      return;
    }
    const clamped = clamp(parsed, min, max);
    setWasClamped(clamped !== parsed);
    commit(clamped);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCommit();
    }
  };

  return (
    <div className="w-full text-center">
      <div className="mt-6 flex items-center justify-center gap-6">
        <CircleButton
          label={COPY.morphing.widgets.numeric.decrease(field.name)}
          onClick={() => handleStep(-step)}
          disabled={currentVal <= min}
          size={40}
        >
          <Icon icon={RemoveIcon} size="md" />
        </CircleButton>

        <div className="flex items-baseline justify-center gap-1.5">
          <input
            type="number"
            inputMode="decimal"
            value={draft}
            onChange={handleChange}
            onBlur={handleCommit}
            onKeyDown={handleKeyDown}
            aria-label={field.label}
            aria-invalid={wasClamped}
            min={min}
            max={max}
            step={step}
            className="w-[3.2ch] min-w-0 text-center text-6xl sm:text-giant [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none font-light leading-none tabular-nums bg-transparent border-b border-ink/20 focus:border-ink focus:outline-none"
          />
          {field.unit && (
            <span className="text-xl font-medium text-ink/60">{field.unit}</span>
          )}
        </div>

        <CircleButton
          label={COPY.morphing.widgets.numeric.increase(field.name)}
          variant="solid"
          onClick={() => handleStep(step)}
          disabled={currentVal >= max}
          size={40}
        >
          <Icon icon={AddIcon} size="md" />
        </CircleButton>
      </div>

      <p className="mt-3 text-xs text-ink/60">
        {COPY.morphing.widgets.numeric.referenceRange(min, max, field.unit)}
      </p>
      {wasClamped && (
        <p role="status" className="mt-1 text-xs font-medium text-ink">
          {COPY.morphing.widgets.numeric.outOfRange(min, max, field.unit)}
        </p>
      )}

      {field.instructions && (
        <p className="mt-3 rounded-tile bg-ink/5 p-3 text-2xs text-ink/70 leading-relaxed text-left">
          <strong className="text-ink font-medium">{COPY.morphing.widgets.protocolNote}</strong>
          {field.instructions}
        </p>
      )}
    </div>
  );
}
