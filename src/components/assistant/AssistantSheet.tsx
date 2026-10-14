import React, { useId, useRef, useState } from 'react';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'sonner';
import { type AssistantMode, useAssistant } from '../../contexts/AssistantContext';
import { useProtocol } from '../../contexts/ProtocolContext';
import { MOTION } from '../../data/config';
import { COPY } from '../../data/copy';
import { useDialogA11y } from '../../hooks/useDialogA11y';
import { useScrollToLatest } from '../../hooks/useScrollToLatest';
import { isPdfFile } from '../../utils/files';
import { EmptyState } from '../feedback/EmptyState';
import { MissingDataBanner } from '../protocol/MissingDataBanner';
import { PainLogDrawer } from '../routine/PainLogDrawer';
import { AssistantComposer } from './AssistantComposer';
import { AssistantHeader } from './AssistantHeader';
import { AssistantMessage } from './AssistantMessage';
import { FaqSuggestions } from './FaqSuggestions';
import { TypingIndicator } from './TypingIndicator';
import { UploadDropzone } from './UploadDropzone';

export function AssistantSheet() {
  const { isOpen, mode, setMode, closeAssistant } = useAssistant();
  const { messages, protocol, assistantTyping, askQuestion, uploadPaper } = useProtocol();
  const [isPainLogOpen, setIsPainLogOpen] = useState(false);
  const panelRef = useRef<HTMLElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const titleId = useId();

  useDialogA11y(panelRef, { open: isOpen, onClose: closeAssistant, initialFocusRef: inputRef });
  const endRef = useScrollToLatest<HTMLDivElement>(isOpen, `${messages.length}-${assistantTyping}`);

  const handleModeChange = (next: AssistantMode) => {
    setMode(next);
    inputRef.current?.focus();
  };

  const addPaper = (source: string) => {
    uploadPaper(source);
    setMode('ask');
  };

  const handleFile = (file: File) => {
    if (!isPdfFile(file)) {
      toast.error(COPY.upload.invalidType);
      return;
    }
    addPaper(file.name);
  };

  const hasConversation = messages.length > 0 || assistantTyping;

  return (
    <>
      <AnimatePresence>
        {isOpen &&
        <>
            <motion.div
            key="assistant-backdrop"
            className="fixed inset-0 z-sheet bg-ink/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeAssistant}
            aria-hidden="true" />
          
            <motion.aside
            key="assistant-panel"
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
            initial={{ y: MOTION.sheetOffsetY, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: MOTION.sheetOffsetY, opacity: 0 }}
            transition={MOTION.sheetSpring}
            className="fixed inset-x-0 bottom-0 z-sheet flex h-sheet flex-col overflow-hidden rounded-t-sheet bg-canvas font-sans text-ink focus:outline-none lg:inset-y-3 lg:left-auto lg:right-3 lg:h-auto lg:w-sheet lg:rounded-sheet">
            
              <AssistantHeader
              mode={mode}
              protocolTitle={protocol.shortTitle}
              titleId={titleId}
              onModeChange={handleModeChange}
              onClose={closeAssistant} />
            

              <div role="log" aria-live="polite" className="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 py-4">
                <MissingDataBanner />
                {hasConversation ?
              messages.map((message) =>
              <AssistantMessage key={message.id} message={message} onLogPain={() => setIsPainLogOpen(true)} />
              ) :

              <EmptyState
                icon={ChatBubbleOutlineIcon}
                title={COPY.assistant.emptyTitle}
                description={COPY.assistant.emptyBody} />

              }
                {assistantTyping && <TypingIndicator />}
                <div ref={endRef} />
              </div>

              <footer className="shrink-0 space-y-3 border-t border-ink/10 bg-canvas px-5 pb-5 pt-3">
                {mode === 'upload' ?
              <UploadDropzone onFile={addPaper} /> :

              <FaqSuggestions faqs={protocol.faqs} onSelect={askQuestion} />
              }
                <AssistantComposer
                ref={inputRef}
                mode={mode}
                onAsk={askQuestion}
                onAddPaper={addPaper}
                onFile={handleFile} />
              
              </footer>
            </motion.aside>
          </>
        }
      </AnimatePresence>
      <PainLogDrawer open={isPainLogOpen} onClose={() => setIsPainLogOpen(false)} />
    </>);

}