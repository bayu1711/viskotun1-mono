'use client';

import React from 'react';
import type { DataCollectionField } from '../../../types/routine';
import { severityTone } from '../../../utils/tones';
import { FeedbackScoreControl } from '../FeedbackScoreControl';

import { useLocale } from '../../../contexts/LocaleContext';
interface ScaleWidgetProps {
  field: DataCollectionField;
  value: number;
  onChange: (value: number) => void;
}

export function ScaleWidget({ field, value, onChange }: ScaleWidgetProps) {
  const { copy } = useLocale();
  const currentScore = typeof value === 'number' ? value : 0;
  const tone = severityTone(currentScore, copy.severityLevels);

  const metricAdapter = {
    name: field.name,
    label: field.label,
    minLabel: `${field.min ?? 0} ${copy.morphing.widgets.scale.minimalSuffix}`,
    maxLabel: `${field.max ?? 10} ${copy.morphing.widgets.scale.severeSuffix}`,
    maxScore: field.max ?? 10,
    escalationThreshold: field.escalationThreshold,
    escalationMessage: field.escalationMessage
  };

  return (
    <div className="w-full">
      <FeedbackScoreControl
        score={currentScore}
        tone={tone}
        onChange={onChange}
        metric={metricAdapter}
      />
    </div>
  );
}
