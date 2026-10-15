'use client';

import React from 'react';
import CheckIcon from '@mui/icons-material/Check';
import { COPY } from '../../../data/copy';
import type { DataCollectionField } from '../../../types/protocol';
import { cn } from '../../../utils/cn';
import { Icon } from '../../ui/Icon';

interface MultiChoiceWidgetProps {
  field: DataCollectionField;
  value: string;
  onChange: (value: string) => void;
}

export function MultiChoiceWidget({ field, value, onChange }: MultiChoiceWidgetProps) {
  const options = field.options && field.options.length > 0
    ? field.options
    : ['Mild', 'Moderate', 'Severe'];

  const currentSelection = typeof value === 'string' ? value : '';

  return (
    <div className="w-full text-left">
      <p className="text-xs text-ink/60 lowercase">
        {COPY.morphing.widgets.multichoice.selectOne}
      </p>

      <div className="mt-3 flex flex-col gap-2">
        {options.map((option) => {
          const isSelected = currentSelection === option;
          return (
            <button
              key={option}
              type="button"
              onClick={() => onChange(option)}
              className={cn(
                'flex items-center justify-between rounded-tile border p-3.5 text-xs text-left transition-all duration-200',
                isSelected
                  ? 'border-ink bg-mint text-ink font-medium shadow-sm'
                  : 'border-ink/15 bg-white text-ink/80 hover:border-ink/30 hover:bg-ink/5'
              )}
            >
              <span className="leading-snug pr-2">{option}</span>
              {isSelected && (
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ink text-white">
                  <Icon icon={CheckIcon} size="sm" />
                </span>
              )}
            </button>
          );
        })}
      </div>

      {field.instructions && (
        <p className="mt-4 rounded-tile bg-ink/5 p-3 text-2xs text-ink/75 leading-relaxed">
          <strong className="text-ink font-medium">Measurement Criteria: </strong>
          {field.instructions}
        </p>
      )}
    </div>
  );
}
