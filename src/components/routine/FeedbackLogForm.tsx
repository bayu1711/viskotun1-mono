'use client';

import React, { type FormEvent, useEffect, useId, useMemo, useState } from 'react';
import CloseIcon from '@mui/icons-material/Close';
import { toast } from 'sonner';
import { useRoutine } from '../../contexts/RoutineContext';
import {
  FEEDBACK_ESCALATION_THRESHOLD,
  FEEDBACK_NOTE_MAX_LENGTH,
  FEEDBACK_SCORE_DEFAULT
} from '../../data/config';
import { COPY } from '../../data/copy';
import type { DataCollectionField } from '../../types/routine';
import { cn } from '../../utils/cn';
import { exceedsFeedbackThreshold } from '../../utils/routineMetrics';
import { severityTone } from '../../utils/tones';
import { Callout } from '../feedback/Callout';
import { CircleButton } from '../ui/CircleButton';
import { Icon } from '../ui/Icon';
import { PillButton } from '../ui/PillButton';
import { DynamicFieldRenderer } from './DynamicFieldRenderer';

interface FeedbackLogFormProps {
  onClose: () => void;
}

type MorphingValue = number | string | boolean;

function getInitialValueForField(field: DataCollectionField): MorphingValue {
  switch (field.type) {
    case 'scale':
      return FEEDBACK_SCORE_DEFAULT;
    case 'numeric':
      return field.min ?? 0;
    case 'timer':
      return 0;
    case 'boolean':
      return false;
    case 'multichoice':
      return field.options?.[0] ?? '';
    case 'photo':
      return '';
    default:
      return 0;
  }
}

/** Mounted only while the drawer is open, so its state resets naturally on every open. */
export function FeedbackLogForm({ onClose }: FeedbackLogFormProps) {
  const {
    currentDay,
    scheduledFields,
    activeFieldId,
    setActiveFieldId,
    logMorphingData,
    feedbackMetric,
    dataCollectionSpec
  } = useRoutine();

  const activeField = useMemo(
    () =>
      dataCollectionSpec.find((f) => f.id === activeFieldId) ??
      scheduledFields.find((f) => f.id === activeFieldId) ??
      scheduledFields[0] ??
      dataCollectionSpec[0] ?? {
        id: 'default-scale',
        name: feedbackMetric.name,
        label: feedbackMetric.label,
        type: 'scale' as const,
        frequency: 'daily' as const,
        min: 0,
        max: feedbackMetric.maxScore ?? 10,
        step: 1,
        escalationThreshold: feedbackMetric.escalationThreshold,
        escalationMessage: feedbackMetric.escalationMessage
      },
    [dataCollectionSpec, scheduledFields, activeFieldId, feedbackMetric]
  );

  const availableFields = useMemo(() => {
    const baseList = scheduledFields.length > 0 ? scheduledFields : dataCollectionSpec;
    if (activeField && !baseList.some((f) => f.id === activeField.id)) {
      return [...baseList, activeField];
    }
    return baseList;
  }, [scheduledFields, dataCollectionSpec, activeField]);

  const [value, setValue] = useState<MorphingValue>(() => getInitialValueForField(activeField));
  const [note, setNote] = useState('');
  const noteId = useId();

  // Reset value when activeField changes
  useEffect(() => {
    setValue(getInitialValueForField(activeField));
  }, [activeField]);

  const numericScore = typeof value === 'number' ? value : 0;
  const tone = severityTone(numericScore);
  const threshold = activeField.escalationThreshold ?? FEEDBACK_ESCALATION_THRESHOLD;
  const isExceeded = typeof value === 'number' && exceedsFeedbackThreshold(value, threshold);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    logMorphingData(activeField.id, value, note.trim());
    toast.success(COPY.morphing.savedToast(activeField.name));
    onClose();
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Field Switcher Tabs (if protocol has multiple measures) */}
      {availableFields.length > 1 && (
        <div className="flex border-b border-ink/15 bg-canvas px-6 pt-4 pb-2 gap-2 overflow-x-auto">
          {availableFields.map((field) => {
            const isSelected = field.id === activeField.id;
            return (
              <button
                key={field.id}
                type="button"
                onClick={() => setActiveFieldId(field.id)}
                className={cn(
                  'rounded-full px-3 py-1 text-2xs font-medium whitespace-nowrap transition-colors',
                  isSelected
                    ? 'bg-ink text-white shadow-sm'
                    : 'bg-white text-ink/65 border border-ink/15 hover:bg-ink/5'
                )}
              >
                {field.name}
                {field.frequency === 'milestone' && COPY.morphing.milestoneSuffix}
              </button>
            );
          })}
        </div>
      )}

      {/* Top Banner & Control Area */}
      <div
        className={cn(
          'px-6 pb-6 pt-5 transition-colors duration-300',
          activeField.type === 'scale' ? tone.panel : 'bg-canvas'
        )}
      >
        <div className="flex items-center justify-between border-b border-ink/20 pb-3">
          <CircleButton label={COPY.feedbackDrawer.close} onClick={onClose}>
            <Icon icon={CloseIcon} size="md" />
          </CircleButton>
          <div className="text-center">
            <h2 className="text-sm font-medium">
              {COPY.morphing.dialogTitle(activeField.name, currentDay)}
            </h2>
            <span className="text-3xs uppercase tracking-wider text-ink/50">
              {activeField.frequency === 'milestone'
                ? COPY.morphing.milestoneTag
                : COPY.morphing.dailyTag}
            </span>
          </div>
          <span className="w-10" aria-hidden="true" />
        </div>

        {/* Polymorphic Dynamic Widget Renderer */}
        <div className="pt-2">
          <DynamicFieldRenderer
            field={activeField}
            value={value}
            onChange={setValue}
          />
        </div>
      </div>

      {/* Bottom Notes & Submit Action */}
      <div className="px-6 pb-8 pt-5 sm:pb-6">
        {isExceeded && (
          <Callout tone="blush" role="status" className="mb-4 rounded-tile px-4 py-3">
            {COPY.safety.dynamicEscalationAlert(activeField.name, activeField.escalationMessage)}
          </Callout>
        )}

        <label htmlFor={noteId} className="sr-only">
          {COPY.feedbackDrawer.notesLabel}
        </label>
        <textarea
          id={noteId}
          rows={2}
          value={note}
          maxLength={FEEDBACK_NOTE_MAX_LENGTH}
          onChange={(event) => setNote(event.target.value)}
          placeholder={COPY.feedbackDrawer.notesPlaceholder}
          className="w-full resize-none rounded-tile border border-ink/15 px-4 py-3 text-sm placeholder:text-ink/35 focus:border-ink focus:outline-none"
        />

        <PillButton type="submit" fullWidth className="mt-4">
          {COPY.morphing.saveEntry}
        </PillButton>
      </div>
    </form>
  );
}
