import React, { type FormEvent, useId, useState } from 'react';
import CloseIcon from '@mui/icons-material/Close';
import { toast } from 'sonner';
import { useProtocol } from '../../contexts/ProtocolContext';
import {
  FEEDBACK_ESCALATION_THRESHOLD,
  FEEDBACK_NOTE_MAX_LENGTH,
  FEEDBACK_SCORE_DEFAULT
} from '../../data/config';
import { COPY } from '../../data/copy';
import { cn } from '../../utils/cn';
import { exceedsFeedbackThreshold } from '../../utils/protocolMetrics';
import { severityTone } from '../../utils/tones';
import { Callout } from '../feedback/Callout';
import { CircleButton } from '../ui/CircleButton';
import { Icon } from '../ui/Icon';
import { PillButton } from '../ui/PillButton';
import { FeedbackScoreControl } from './FeedbackScoreControl';

interface FeedbackLogFormProps {
  onClose: () => void;
}

/** Mounted only while the drawer is open, so its state resets naturally on every open. */
export function FeedbackLogForm({ onClose }: FeedbackLogFormProps) {
  const { logFeedback, currentDay, feedbackMetric } = useProtocol();
  const [score, setScore] = useState(FEEDBACK_SCORE_DEFAULT);
  const [note, setNote] = useState('');
  const noteId = useId();
  const tone = severityTone(score);
  const threshold = feedbackMetric.escalationThreshold ?? FEEDBACK_ESCALATION_THRESHOLD;
  const isExceeded = exceedsFeedbackThreshold(score, threshold);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    logFeedback(score, note.trim());
    toast.success(COPY.feedbackDrawer.savedMetric(feedbackMetric.name));
    onClose();
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className={cn('px-6 pb-8 pt-6 transition-colors duration-300', tone.panel)}>
        <div className="flex items-center justify-between border-b border-ink pb-4">
          <CircleButton label={COPY.feedbackDrawer.close} onClick={onClose}>
            <Icon icon={CloseIcon} size="md" />
          </CircleButton>
          <h2 className="text-sm lowercase">
            {COPY.feedbackDrawer.metricHeader(feedbackMetric.name, currentDay)}
          </h2>
          <span className="w-10" aria-hidden="true" />
        </div>
        <FeedbackScoreControl score={score} tone={tone} onChange={setScore} metric={feedbackMetric} />
      </div>

      <div className="px-6 pb-8 pt-6 sm:pb-6">
        {isExceeded && (
          <Callout tone="blush" role="status" className="mb-4 rounded-tile px-4 py-3">
            {COPY.safety.dynamicEscalationAlert(feedbackMetric.name, feedbackMetric.escalationMessage)}
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
          {COPY.feedbackDrawer.save}
        </PillButton>
      </div>
    </form>
  );
}
