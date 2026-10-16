'use client';

import React from 'react';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import { COPY } from '../../../data/copy';
import type { DataCollectionField } from '../../../types/routine';
import { cn } from '../../../utils/cn';
import { Icon } from '../../ui/Icon';

interface BooleanWidgetProps {
  field: DataCollectionField;
  value: boolean;
  onChange: (value: boolean) => void;
}

export function BooleanWidget({ field, value, onChange }: BooleanWidgetProps) {
  const currentVal = Boolean(value);

  return (
    <div className="w-full text-center">
      <div className="mt-4 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => onChange(false)}
          className={cn(
            'flex items-center justify-center gap-2 rounded-tile border p-4 text-xs font-medium transition-all',
            !currentVal
              ? 'border-ink bg-cream text-ink shadow-sm'
              : 'border-ink/15 bg-white text-ink/60 hover:bg-ink/5'
          )}
        >
          <Icon icon={CloseIcon} size="sm" />
          <span>{COPY.morphing.widgets.boolean.no}</span>
        </button>

        <button
          type="button"
          onClick={() => onChange(true)}
          className={cn(
            'flex items-center justify-center gap-2 rounded-tile border p-4 text-xs font-medium transition-all',
            currentVal
              ? 'border-ink bg-blush text-ink shadow-sm'
              : 'border-ink/15 bg-white text-ink/60 hover:bg-ink/5'
          )}
        >
          <Icon icon={CheckIcon} size="sm" />
          <span>{COPY.morphing.widgets.boolean.yes}</span>
        </button>
      </div>

      {field.instructions && (
        <p className="mt-4 rounded-tile bg-ink/5 p-3 text-2xs text-ink/75 leading-relaxed text-left">
          <strong className="text-ink font-medium">{COPY.morphing.widgets.evaluationRule}</strong>
          {field.instructions}
        </p>
      )}
    </div>
  );
}
