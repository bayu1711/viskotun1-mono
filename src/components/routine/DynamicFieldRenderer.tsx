'use client';

import React from 'react';
import { COPY } from '../../data/copy';
import type { DataCollectionField } from '../../types/routine';
import { AIIcon } from '../ui/AIIcon';
import { BooleanWidget } from './widgets/BooleanWidget';
import { CustomGeneratedWidget } from './widgets/CustomGeneratedWidget';
import { MultiChoiceWidget } from './widgets/MultiChoiceWidget';
import { NumericWidget } from './widgets/NumericWidget';
import { PhotoWidget } from './widgets/PhotoWidget';
import { ScaleWidget } from './widgets/ScaleWidget';
import { TimerWidget } from './widgets/TimerWidget';

type MorphingValue = number | string | boolean;

interface DynamicFieldRendererProps {
  field: DataCollectionField;
  value: MorphingValue;
  onChange: (value: MorphingValue) => void;
}

function renderBaseWidget({ field, value, onChange }: DynamicFieldRendererProps) {
  switch (field.type) {
    case 'scale':
      return <ScaleWidget field={field} value={Number(value || 0)} onChange={onChange} />;
    case 'numeric':
      return <NumericWidget field={field} value={Number(value || 0)} onChange={onChange} />;
    case 'photo':
      return <PhotoWidget field={field} value={String(value || '')} onChange={onChange} />;
    case 'timer':
      return <TimerWidget field={field} value={Number(value || 0)} onChange={onChange} />;
    case 'multichoice':
      return <MultiChoiceWidget field={field} value={String(value || '')} onChange={onChange} />;
    case 'boolean':
      return <BooleanWidget field={field} value={Boolean(value)} onChange={onChange} />;
    default:
      return null;
  }
}

export function DynamicFieldRenderer({ field, value, onChange }: DynamicFieldRendererProps) {
  if (field.proposedWidget?.status === 'approved') {
    return <CustomGeneratedWidget field={field} value={value} onChange={onChange} />;
  }

  const baseWidget = renderBaseWidget({ field, value, onChange });

  if (field.proposedWidget?.status === 'pending_review') {
    return (
      <div className="space-y-4">
        <div
          role="status"
          className="mt-3 rounded-card border border-ink/15 bg-mint/40 p-3.5 text-left space-y-1.5"
        >
          <div className="flex items-center gap-2">
            <AIIcon size="xs" />
            <p className="text-xs font-semibold text-ink">
              {COPY.morphing.widgets.custom.pendingNotice}
            </p>
          </div>
          <p className="text-2xs text-ink/70 leading-relaxed">
            {COPY.morphing.widgets.custom.pendingSubtext}
          </p>
        </div>
        {baseWidget}
      </div>
    );
  }

  return baseWidget;
}

