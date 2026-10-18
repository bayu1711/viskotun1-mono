'use client';

import React from 'react';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import VerifiedOutlinedIcon from '@mui/icons-material/VerifiedOutlined';
import { COPY } from '../../../data/copy';
import type { DataCollectionField } from '../../../types/routine';
import { clamp } from '../../../utils/math';
import { AIIcon } from '../../ui/AIIcon';
import { CircleButton } from '../../ui/CircleButton';
import { Icon } from '../../ui/Icon';

type MorphingValue = number | string | boolean;

interface CustomGeneratedWidgetProps {
  field: DataCollectionField;
  value: MorphingValue;
  onChange: (value: MorphingValue) => void;
}

export function CustomGeneratedWidget({
  field,
  value,
  onChange
}: CustomGeneratedWidgetProps) {
  const proposed = field.proposedWidget;
  const min = proposed?.min ?? field.min ?? 0;
  const max = proposed?.max ?? field.max ?? 100;
  const step = proposed?.step ?? field.step ?? 5;
  const unit = proposed?.unit ?? field.unit ?? '';
  const options = proposed?.options ?? field.options;

  const numericVal =
    typeof value === 'number' && !isNaN(value) ? clamp(value, min, max) : min;

  const presets = [
    min,
    Math.round(min + (max - min) * 0.25),
    Math.round(min + (max - min) * 0.5),
    Math.round(min + (max - min) * 0.75),
    max
  ];

  return (
    <div className="mt-4 w-full rounded-card border border-ink/15 bg-white p-4 text-left shadow-2xs space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink/10 pb-2.5">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-mint px-2.5 py-0.5 text-3xs font-semibold text-ink">
          <AIIcon size="xs" />
          <Icon icon={VerifiedOutlinedIcon} size="xs" />
          {COPY.morphing.widgets.custom.approvedBadge}
        </span>
        {proposed?.requestedType && (
          <span className="text-3xs font-mono text-ink/60">
            {COPY.morphing.widgets.custom.proposedTypeLabel(proposed.requestedType)}
          </span>
        )}
      </div>

      <div>
        <p className="text-xs font-semibold text-ink">
          {proposed?.title || field.label}
        </p>
        {proposed?.description && (
          <p className="mt-0.5 text-2xs text-ink/65">{proposed.description}</p>
        )}
      </div>

      {options && options.length > 0 ? (
        <div className="grid grid-cols-1 gap-2 pt-1">
          {options.map((opt) => {
            const isSelected = String(value) === opt;
            return (
              <button
                key={opt}
                type="button"
                onClick={() => onChange(opt)}
                className={`rounded-tile border px-3 py-2 text-left text-xs transition-colors ${
                  isSelected
                    ? 'border-ink bg-ink text-white font-medium'
                    : 'border-ink/15 bg-canvas text-ink hover:bg-ink/5'
                }`}
              >
                {opt}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-center gap-5">
            <CircleButton
              label={COPY.morphing.widgets.numeric.decrease(field.name)}
              onClick={() => onChange(clamp(numericVal - step, min, max))}
              disabled={numericVal <= min}
              size={36}
            >
              <Icon icon={RemoveIcon} size="sm" />
            </CircleButton>

            <div className="flex items-baseline gap-1.5">
              <span className="text-4xl font-light tabular-nums text-ink">
                {numericVal}
              </span>
              {unit && (
                <span className="text-xs font-medium text-ink/60">{unit}</span>
              )}
            </div>

            <CircleButton
              label={COPY.morphing.widgets.numeric.increase(field.name)}
              variant="solid"
              onClick={() => onChange(clamp(numericVal + step, min, max))}
              disabled={numericVal >= max}
              size={36}
            >
              <Icon icon={AddIcon} size="sm" />
            </CircleButton>
          </div>

          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={numericVal}
            aria-label={proposed?.title || field.label}
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-full accent-ink cursor-pointer"
          />

          <div className="flex items-center justify-between gap-1.5">
            {presets.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => onChange(preset)}
                className={`flex-1 rounded-full border py-1 text-3xs font-mono transition-colors ${
                  numericVal === preset
                    ? 'border-ink bg-ink text-white font-semibold'
                    : 'border-ink/15 bg-canvas text-ink/70 hover:bg-ink/5'
                }`}
              >
                {preset}
                {unit ? ` ${unit}` : ''}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
