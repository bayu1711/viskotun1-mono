'use client';

import React, { useId, useRef } from 'react';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'sonner';
import { type AssistantMode, useAssistant } from '../../contexts/AssistantContext';
import { useRoutine } from '../../contexts/RoutineContext';
import { MOTION } from '../../data/config';
import { COPY } from '../../data/copy';
import { useDialogA11y } from '../../hooks/useDialogA11y';
import { useScrollToLatest } from '../../hooks/useScrollToLatest';
import { isPdfFile } from '../../utils/files';
import { EmptyState } from '../feedback/EmptyState';
import { MissingDataBanner } from '../protocol/MissingDataBanner';
import { AssistantComposer } from './AssistantComposer';
import { AssistantHeader } from './AssistantHeader';
import { AssistantMessage } from './AssistantMessage';
import { FaqSuggestions } from './FaqSuggestions';
import { AlertCard } from './messages/AlertCard';
import { CandidateProtocolCard } from './messages/CandidateProtocolCard';
import { ProcessingCard } from './ProcessingCard';
import { TypingIndicator } from './TypingIndicator';
import { UploadDropzone } from './UploadDropzone';

export function AssistantSheet() {
  const { isOpen, mode, setMode, closeAssistant } = useAssistant();
  const {
    messages,
    routine,
    protocol = routine,
    assistantTyping,
    askQuestion,
    uploadPaper,
    stagingProtocol,
    isExtractingPaper,
    extractingSourceName,
    stagingMessages,
    stagingError,
    isStagingAssistantTyping,
    confirmStagingProtocol,
    discardStagingProtocol,
    askStagingQuestion
  } = useRoutine();

  const panelRef = useRef<HTMLElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const titleId = useId();

  useDialogA11y(panelRef, { open: isOpen, onClose: closeAssistant, initialFocusRef: inputRef });

  const currentMessageCount =
    mode === 'ask'
      ? messages.length + (assistantTyping ? 1 : 0)
      : stagingMessages.length +
        (isStagingAssistantTyping ? 1 : 0) +
        (isExtractingPaper ? 1 : 0);

  const endRef = useScrollToLatest<HTMLDivElement>(isOpen, `${mode}-${currentMessageCount}`);

  const handleModeChange = (next: AssistantMode) => {
    setMode(next);
    inputRef.current?.focus();
  };

  const addPaper = (source: string | File) => {
    uploadPaper(source);
  };

  const handleFile = (file: File) => {
    if (!isPdfFile(file)) {
      toast.error(COPY.upload.invalidType);
      return;
    }
    addPaper(file);
  };

  const handleConfirmCandidate = () => {
    confirmStagingProtocol();
    setMode('ask');
  };

  const hasAskConversation = messages.length > 0 || assistantTyping;
  const isAsk = mode === 'ask';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="assistant-backdrop"
            className="fixed inset-0 z-sheet bg-ink/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeAssistant}
            aria-hidden="true"
          />

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
            className="fixed inset-x-0 bottom-0 z-sheet flex h-sheet flex-col overflow-hidden rounded-t-sheet bg-canvas font-sans text-ink focus:outline-none lg:inset-y-3 lg:left-auto lg:right-3 lg:h-auto lg:w-sheet lg:rounded-sheet"
          >
            <AssistantHeader
              mode={mode}
              protocolTitle={protocol ? protocol.shortTitle : COPY.assistant.noActiveProtocolForAskTitle}
              customTitle={
                !isAsk && stagingProtocol
                  ? COPY.assistant.stagingTitle
                  : undefined
              }
              customEyebrow={
                !isAsk && stagingProtocol
                  ? COPY.assistant.stagingEyebrow
                  : undefined
              }
              titleId={titleId}
              onModeChange={handleModeChange}
              onClose={closeAssistant}
            />

            <div role="log" aria-live="polite" className="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 py-4">
              {isAsk ? (
                /* Ask Mode: Contextual to Active Routine */
                protocol ? (
                  <>
                    <MissingDataBanner />
                    {hasAskConversation ? (
                      messages.map((message) => (
                        <AssistantMessage key={message.id} message={message} />
                      ))
                    ) : (
                      <EmptyState
                        icon={ChatBubbleOutlineIcon}
                        title={COPY.assistant.emptyTitle}
                        description={COPY.assistant.emptyBody}
                      />
                    )}
                    {assistantTyping && <TypingIndicator />}
                  </>
                ) : (
                  <div className="py-8 text-center space-y-4">
                    <EmptyState
                      icon={ChatBubbleOutlineIcon}
                      title={COPY.assistant.noActiveProtocolForAskTitle}
                      description={COPY.assistant.noActiveProtocolForAskBody}
                    />
                    <button
                      type="button"
                      onClick={() => setMode('upload')}
                      className="rounded-full bg-ink px-4 py-2 text-xs font-medium text-white transition-opacity hover:opacity-90"
                    >
                      {COPY.assistant.switchToUpload}
                    </button>
                  </div>
                )
              ) : (
                /* Add Paper Mode: Intake, Staging & Pre-Confirmation Discussion */
                <div className="space-y-4">
                  {isExtractingPaper ? (
                    <div className="py-4">
                      <ProcessingCard source={extractingSourceName} createdAt={Date.now()} />
                    </div>
                  ) : stagingProtocol ? (
                    <div className="space-y-4">
                      <CandidateProtocolCard
                        protocol={stagingProtocol}
                        onConfirm={handleConfirmCandidate}
                        onDiscard={discardStagingProtocol}
                      />

                      {/* Pre-confirmation Q&A messages */}
                      {stagingMessages
                        .filter((m) => m.kind !== 'candidate' && m.kind !== 'file')
                        .map((message) => (
                          <AssistantMessage key={message.id} message={message} />
                        ))}

                      {isStagingAssistantTyping && <TypingIndicator />}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="rounded-card border border-ink/10 bg-white p-4 space-y-2">
                        <h3 className="text-sm font-semibold text-ink">
                          {COPY.assistant.intakeInstructionTitle}
                        </h3>
                        <p className="text-xs text-ink/65 leading-relaxed">
                          {COPY.assistant.intakeInstructionBody}
                        </p>
                      </div>

                      <UploadDropzone onFile={addPaper} />

                      {stagingError && <AlertCard content={stagingError} />}
                    </div>
                  )}
                </div>
              )}
              <div ref={endRef} />
            </div>

            <footer className="shrink-0 space-y-3 border-t border-ink/10 bg-canvas px-5 pb-5 pt-3">
              {isAsk ? (
                <>
                  <FaqSuggestions faqs={protocol?.faqs ?? []} onSelect={askQuestion} />
                  <AssistantComposer
                    ref={inputRef}
                    mode="ask"
                    onAsk={askQuestion}
                    onAddPaper={addPaper}
                    onFile={handleFile}
                  />
                </>
              ) : stagingProtocol ? (
                <AssistantComposer
                  ref={inputRef}
                  mode="ask"
                  onAsk={askStagingQuestion}
                  onAddPaper={addPaper}
                  onFile={handleFile}
                  placeholder={COPY.assistant.placeholderStaging}
                  ariaLabel={COPY.assistant.inputStaging}
                />
              ) : isExtractingPaper ? null : (
                <AssistantComposer
                  ref={inputRef}
                  mode="upload"
                  onAsk={askQuestion}
                  onAddPaper={addPaper}
                  onFile={handleFile}
                  placeholder={COPY.assistant.placeholderUpload}
                  ariaLabel={COPY.assistant.inputUpload}
                />
              )}
            </footer>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}