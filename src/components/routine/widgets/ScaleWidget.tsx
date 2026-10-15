'use client';

import React from 'react';
import type { DataCollectionField } from '../../../types/protocol';
import { severityTone } from '../../../utils/tones';
import { FeedbackScoreControl } from '../FeedbackScoreControl';

interface ScaleWidgetProps {
  field: DataCollectionField;
  value: number;
  onChange: (value: number) => void;
}

export function ScaleWidget({ field, value, onChange }: ScaleWidgetProps) {
  const currentScore = typeof value === 'number' ? value : 0;
  const tone = severityTone(currentScore);

  const metricAdapter = {
    name: field.name,
    label: field.label,
    minLabel: `${field.min ?? 0} · minimal`,
    maxLabel: `${field.max ?? 10} · severe`,
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
