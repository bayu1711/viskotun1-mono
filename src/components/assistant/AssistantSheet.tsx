'use client';

import React, { useId, useMemo, useRef } from 'react';
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
import { getDynamicSuggestions } from '../../utils/suggestions';
import { EmptyState } from '../feedback/EmptyState';
import { MissingDataBanner } from '../routine/MissingDataBanner';
import { AssistantComposer } from './AssistantComposer';
import { AssistantHeader } from './AssistantHeader';
import { AssistantMessage } from './AssistantMessage';
import { FaqSuggestions } from './FaqSuggestions';
import { LifestyleTuningView } from './LifestyleTuningView';
import { CandidateRoutineCard } from './messages/CandidateRoutineCard';
import { ProcessingCard } from './ProcessingCard';
import { TypingIndicator } from './TypingIndicator';
import { UploadDropzone } from './UploadDropzone';

export function AssistantSheet() {
  const { isOpen, mode, setMode, closeAssistant } = useAssistant();
  const {
    messages,
    routine,
    assistantTyping,
    askQuestion,
    uploadPaper,
    stagingRoutine,
    isExtractingPaper,
    extractingSourceName,
    stagingMessages,
    stagingError,
    isStagingAssistantTyping,
    confirmStagingRoutine,
    discardStagingRoutine,
    askStagingQuestion,
    toggleStagingExcludeStep,
    lifestyleProfile,
    confirmRegion,
    updateLifestyleProfile,
    tuneLifestyle
  } = useRoutine();

  const panelRef = useRef<HTMLElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const titleId = useId();

  useDialogA11y(panelRef, { open: isOpen, onClose: closeAssistant, initialFocusRef: inputRef });

  const currentMessageCount =
    mode === 'ask' || mode === 'lifestyle'
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
    confirmStagingRoutine();
    setMode('ask');
  };

  const hasAskConversation = messages.length > 0 || assistantTyping;
  const isAsk = mode === 'ask';
  const isLifestyle = mode === 'lifestyle';
  const activeMessages = isAsk || isLifestyle ? messages : stagingMessages;
  const lastEngine = useMemo(
    () => [...activeMessages].reverse().find((m) => m.engine)?.engine,
    [activeMessages]
  );

  const askSuggestions = useMemo(
    () => getDynamicSuggestions(routine, messages),
    [routine, messages]
  );

  const stagingSuggestions = useMemo(
    () => getDynamicSuggestions(stagingRoutine, stagingMessages),
    [stagingRoutine, stagingMessages]
  );

  const rejectionSuggestions = useMemo(() => {
    if (!stagingError) return [];
    const asked = new Set(
      stagingMessages
        .filter((m) => m.role === 'user' && m.kind === 'question')
        .map((m) => m.content.trim().toLowerCase())
    );
    return [
      COPY.assistant.rejection.suggestions.why,
      COPY.assistant.rejection.suggestions.whatToUpload,
      COPY.assistant.rejection.suggestions.nonHuman
    ].filter((s) => !asked.has(s.toLowerCase()));
  }, [stagingError, stagingMessages]);

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
              routineTitle={routine ? routine.shortTitle : (COPY.assistant.noActiveRoutineForAskTitle || COPY.assistant.noActiveProtocolForAskTitle)}
              customTitle={
                !isAsk && stagingRoutine
                  ? COPY.assistant.stagingTitle
                  : undefined
              }
              customEyebrow={
                !isAsk && stagingRoutine
                  ? COPY.assistant.stagingEyebrow
                  : undefined
              }
              titleId={titleId}
              onModeChange={handleModeChange}
              onClose={closeAssistant}
              lastEngine={lastEngine}
            />

            <div role="log" aria-live="polite" className="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 py-4">
              {isLifestyle ? (
                /* Lifestyle Tuning Mode */
                <LifestyleTuningView
                  lifestyleProfile={lifestyleProfile}
                  messages={messages}
                  isTyping={assistantTyping}
                  onTune={tuneLifestyle}
                  onConfirmRegion={confirmRegion}
                  onUpdateProfile={updateLifestyleProfile}
                />
              ) : isAsk ? (
                /* Ask Mode: Contextual to Active Routine */
                routine || messages.length > 0 ? (
                  <>
                    {routine && <MissingDataBanner />}
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
                      title={COPY.assistant.noActiveRoutineForAskTitle || COPY.assistant.noActiveProtocolForAskTitle}
                      description={COPY.assistant.noActiveRoutineForAskBody || COPY.assistant.noActiveProtocolForAskBody}
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
                  ) : stagingRoutine ? (
                    <div className="space-y-4">
                      <CandidateRoutineCard
                        routine={stagingRoutine}
                        onConfirm={handleConfirmCandidate}
                        onDiscard={discardStagingRoutine}
                        onToggleExcludeStep={toggleStagingExcludeStep}
                        onAskAboutStep={(step) => {
                          if (step.id === 'improvement') {
                            askStagingQuestion(step.action);
                          } else {
                            askStagingQuestion(COPY.task.taskQuestionPrompt(step.action));
                          }
                        }}
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
                      {stagingMessages.length > 0 && (
                        <div className="space-y-3">
                          {stagingMessages.map((message) => (
                            <AssistantMessage key={message.id} message={message} />
                          ))}
                          {isStagingAssistantTyping && <TypingIndicator />}
                        </div>
                      )}

                      <div className="rounded-card border border-ink/10 bg-white p-4 space-y-2">
                        <h3 className="text-sm font-semibold text-ink">
                          {COPY.assistant.intakeInstructionTitle}
                        </h3>
                        <p className="text-xs text-ink/65 leading-relaxed">
                          {COPY.assistant.intakeInstructionBody}
                        </p>
                      </div>

                      <UploadDropzone onFile={addPaper} />
                    </div>
                  )}
                </div>
              )}
              <div ref={endRef} />
            </div>

            <footer className="shrink-0 space-y-3 border-t border-ink/10 bg-canvas px-5 pb-5 pt-3">
              {isLifestyle ? (
                <AssistantComposer
                  ref={inputRef}
                  mode="lifestyle"
                  onAsk={tuneLifestyle}
                  onAddPaper={addPaper}
                  onFile={handleFile}
                  placeholder={COPY.lifestyleTuning.customPromptPlaceholder}
                  ariaLabel={COPY.lifestyleTuning.title}
                />
              ) : isAsk ? (
                <>
                  <FaqSuggestions
                    suggestions={askSuggestions}
                    onSelect={askQuestion}
                    disabled={assistantTyping}
                  />
                  <AssistantComposer
                    ref={inputRef}
                    mode="ask"
                    onAsk={askQuestion}
                    onAddPaper={addPaper}
                    onFile={handleFile}
                  />
                </>
              ) : stagingRoutine ? (
                <>
                  <FaqSuggestions
                    suggestions={stagingSuggestions}
                    onSelect={askStagingQuestion}
                    disabled={isStagingAssistantTyping}
                  />
                  <AssistantComposer
                    ref={inputRef}
                    mode="ask"
                    onAsk={askStagingQuestion}
                    onAddPaper={addPaper}
                    onFile={handleFile}
                    placeholder={COPY.assistant.placeholderStaging}
                    ariaLabel={COPY.assistant.inputStaging}
                  />
                </>
              ) : isExtractingPaper ? null : stagingError ? (
                <>
                  <FaqSuggestions
                    suggestions={rejectionSuggestions}
                    onSelect={askStagingQuestion}
                    disabled={isStagingAssistantTyping}
                  />
                  <AssistantComposer
                    ref={inputRef}
                    mode="ask"
                    onAsk={askStagingQuestion}
                    onAddPaper={addPaper}
                    onFile={handleFile}
                    placeholder={COPY.assistant.rejection.placeholder}
                    ariaLabel={COPY.assistant.rejection.inputLabel}
                  />
                </>
              ) : (
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