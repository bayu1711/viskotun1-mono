import React, { type FormEvent, useId, useState } from 'react';
import CloseIcon from '@mui/icons-material/Close';
import { toast } from 'sonner';
import { useProtocol } from '../../contexts/ProtocolContext';
import { PAIN_NOTE_MAX_LENGTH, PAIN_SCORE_DEFAULT } from '../../data/config';
import { COPY } from '../../data/copy';
import { cn } from '../../utils/cn';
import { exceedsPainThreshold } from '../../utils/protocolMetrics';
import { painTone } from '../../utils/tones';
import { Callout } from '../feedback/Callout';
import { CircleButton } from '../ui/CircleButton';
import { Icon } from '../ui/Icon';
import { PillButton } from '../ui/PillButton';
import { PainScoreControl } from './PainScoreControl';

interface PainLogFormProps {
  onClose: () => void;
}

/** Mounted only while the drawer is open, so its state resets naturally on every open. */
export function PainLogForm({ onClose }: PainLogFormProps) {
  const { logPain, currentDay } = useProtocol();
  const [score, setScore] = useState(PAIN_SCORE_DEFAULT);
  const [note, setNote] = useState('');
  const noteId = useId();
  const tone = painTone(score);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    logPain(score, note.trim());
    toast.success(COPY.painDrawer.saved);
    onClose();
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className={cn('px-6 pb-8 pt-6 transition-colors duration-300', tone.panel)}>
        <div className="flex items-center justify-between border-b border-ink pb-4">
          <CircleButton label={COPY.painDrawer.close} onClick={onClose}>
            <Icon icon={CloseIcon} size="md" />
          </CircleButton>
          <h2 className="text-sm lowercase">{COPY.painDrawer.header(currentDay)}</h2>
          <span className="w-10" aria-hidden="true" />
        </div>
        <PainScoreControl score={score} tone={tone} onChange={setScore} />
      </div>

      <div className="px-6 pb-8 pt-6 sm:pb-6">
        {exceedsPainThreshold(score) &&
        <Callout tone="blush" role="status" className="mb-4 rounded-tile px-4 py-3">
            {COPY.safety.escalationAlert}
          </Callout>
        }
        <label htmlFor={noteId} className="sr-only">
          {COPY.painDrawer.notesLabel}
        </label>
        <textarea
          id={noteId}
          rows={2}
          value={note}
          maxLength={PAIN_NOTE_MAX_LENGTH}
          onChange={(event) => setNote(event.target.value)}
          placeholder={COPY.painDrawer.notesPlaceholder}
          className="w-full resize-none rounded-tile border border-ink/15 px-4 py-3 text-sm placeholder:text-ink/35 focus:border-ink focus:outline-none" />
        
        <PillButton type="submit" fullWidth className="mt-4">
          {COPY.painDrawer.save}
        </PillButton>
      </div>
    </form>);

}