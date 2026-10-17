'use client';

import React from 'react';
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

  const handleStep = (delta: number) => {
    const next = clamp(currentVal + delta, min, max);
    onChange(next);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const parsed = parseFloat(e.target.value);
    if (!isNaN(parsed)) {
      onChange(clamp(parsed, min, max));
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
            value={currentVal}
            onChange={handleChange}
            min={min}
            max={max}
            step={step}
            className="w-28 text-center text-giant font-light leading-none tabular-nums bg-transparent border-b border-ink/20 focus:border-ink focus:outline-none"
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

      {field.instructions && (
        <p className="mt-3 rounded-tile bg-ink/5 p-3 text-2xs text-ink/70 leading-relaxed text-left">
          <strong className="text-ink font-medium">{COPY.morphing.widgets.protocolNote}</strong>
          {field.instructions}
        </p>
      )}
    </div>
  );
}
