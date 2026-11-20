import React, { type FormEvent, forwardRef, useRef, useState } from 'react';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import type { AssistantMode } from '../../contexts/AssistantContext';
import { isPaperLink } from '../../utils/assistant';
import { CircleButton } from '../ui/CircleButton';
import { Icon } from '../ui/Icon';
import { HiddenPdfInput } from './HiddenPdfInput';

import { useLocale } from '../../contexts/LocaleContext';
interface AssistantComposerProps {
  mode: AssistantMode;
  onAsk: (question: string) => void;
  onAddPaper: (source: string) => void;
  onFile: (file: File) => void;
  placeholder?: string;
  ariaLabel?: string;
}

/** Text input that routes to Q&A or paper upload depending on mode / link detection. */
export const AssistantComposer = forwardRef<HTMLInputElement, AssistantComposerProps>(function AssistantComposer(
{ mode, onAsk, onAddPaper, onFile, placeholder, ariaLabel },
inputRef)
{
  const { copy } = useLocale();
  const [draft, setDraft] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const isAsk = mode === 'ask';
  const canSend = draft.trim().length > 0;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const value = draft.trim();
    if (!value) return;
    if (mode === 'lifestyle') {
      onAsk(value);
    } else if (!isAsk || isPaperLink(value)) {
      onAddPaper(value);
    } else {
      onAsk(value);
    }
    setDraft('');
  };

  const defaultPlaceholder =
    mode === 'lifestyle'
      ? copy.lifestyleTuning.customPromptPlaceholder
      : isAsk
      ? copy.assistant.placeholderAsk
      : copy.assistant.placeholderUpload;
  const defaultAriaLabel =
    mode === 'lifestyle'
      ? copy.lifestyleTuning.title
      : isAsk
      ? copy.assistant.inputAsk
      : copy.assistant.inputUpload;

  const isLifestyle = mode === 'lifestyle';

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 rounded-full border border-ink/10 bg-white p-1.5">
      {!isLifestyle && (
        <CircleButton label={copy.assistant.attach} onClick={() => fileRef.current?.click()} size={38}>
          <Icon icon={AttachFileIcon} size="md" />
        </CircleButton>
      )}
      <input
        ref={inputRef}
        type="text"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        aria-label={ariaLabel || defaultAriaLabel}
        placeholder={placeholder || defaultPlaceholder}
        className={`min-w-0 flex-1 bg-transparent py-2 text-base sm:text-sm placeholder:text-ink/60 focus:outline-none ${
          isLifestyle ? 'ps-3.5' : ''
        }`} />
      
      <button
        type="submit"
        aria-label={copy.assistant.send}
        disabled={!canSend}
        className="flex h-cell w-cell shrink-0 items-center justify-center rounded-full bg-ink text-white transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/30 disabled:opacity-30 cursor-pointer">
        
        <Icon icon={ArrowUpwardIcon} size="md" />
      </button>
      {!isLifestyle && <HiddenPdfInput ref={fileRef} onFile={onFile} />}
    </form>);

});