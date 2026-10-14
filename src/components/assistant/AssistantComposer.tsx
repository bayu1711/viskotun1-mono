import React, { type FormEvent, forwardRef, useRef, useState } from 'react';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import type { AssistantMode } from '../../contexts/AssistantContext';
import { COPY } from '../../data/copy';
import { isPaperLink } from '../../utils/assistant';
import { CircleButton } from '../ui/CircleButton';
import { Icon } from '../ui/Icon';
import { HiddenPdfInput } from './HiddenPdfInput';

interface AssistantComposerProps {
  mode: AssistantMode;
  onAsk: (question: string) => void;
  onAddPaper: (source: string) => void;
  onFile: (file: File) => void;
}

/** Text input that routes to Q&A or paper upload depending on mode / link detection. */
export const AssistantComposer = forwardRef<HTMLInputElement, AssistantComposerProps>(function AssistantComposer(
{ mode, onAsk, onAddPaper, onFile },
inputRef)
{
  const [draft, setDraft] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const isAsk = mode === 'ask';
  const canSend = draft.trim().length > 0;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const value = draft.trim();
    if (!value) return;
    if (!isAsk || isPaperLink(value)) {
      onAddPaper(value);
    } else {
      onAsk(value);
    }
    setDraft('');
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 rounded-full border border-ink/10 bg-white p-1.5">
      <CircleButton label={COPY.assistant.attach} onClick={() => fileRef.current?.click()} size={38}>
        <Icon icon={AttachFileIcon} size="md" />
      </CircleButton>
      <input
        ref={inputRef}
        type="text"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        aria-label={isAsk ? COPY.assistant.inputAsk : COPY.assistant.inputUpload}
        placeholder={isAsk ? COPY.assistant.placeholderAsk : COPY.assistant.placeholderUpload}
        className="min-w-0 flex-1 bg-transparent py-2 text-sm placeholder:text-ink/35 focus:outline-none" />
      
      <button
        type="submit"
        aria-label={COPY.assistant.send}
        disabled={!canSend}
        className="flex h-cell w-cell shrink-0 items-center justify-center rounded-full bg-ink text-white transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/30 disabled:opacity-30">
        
        <Icon icon={ArrowUpwardIcon} size="md" />
      </button>
      <HiddenPdfInput ref={fileRef} onFile={onFile} />
    </form>);

});