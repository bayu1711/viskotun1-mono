'use client';

import React from 'react';
import type { DataCollectionField } from '../../types/routine';
import { BooleanWidget } from './widgets/BooleanWidget';
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

export function DynamicFieldRenderer({ field, value, onChange }: DynamicFieldRendererProps) {
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
