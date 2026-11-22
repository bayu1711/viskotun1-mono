'use client';

import React, { useCallback, useId, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import TravelExploreOutlinedIcon from '@mui/icons-material/TravelExploreOutlined';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'sonner';
import { useAssistant } from '../../contexts/AssistantContext';
import { useLocale } from '../../contexts/LocaleContext';
import { useRoutine } from '../../contexts/RoutineContext';
import type { RoutineSchedulePreference } from '../../types/schedule';
import { MOTION } from '../../data/config';
import { ROUTES } from '../../data/navigation';
import { useDialogA11y } from '../../hooks/useDialogA11y';
import { useScrollToLatest } from '../../hooks/useScrollToLatest';
import { isPdfFile } from '../../utils/files';
import { isUnrecognizedLinkReason } from '../../utils/rejectionAssistant';
import { getDynamicSuggestions } from '../../utils/suggestions';
import { formatRoutineTitle } from '../../utils/text';
import { Icon } from '../ui/Icon';
import { IconTile } from '../ui/IconTile';
import { EmptyState } from '../feedback/EmptyState';
import { MissingDataBanner } from '../routine/MissingDataBanner';
import { AssistantComposer } from './AssistantComposer';
import { AssistantHeader } from './AssistantHeader';
import { AssistantMessage } from './AssistantMessage';
import { FaqSuggestions } from './FaqSuggestions';
import { CandidateRoutineCard } from './messages/CandidateRoutineCard';
import { ProcessingCard } from './ProcessingCard';
import { TypingIndicator } from './TypingIndicator';
import { UploadDropzone } from './UploadDropzone';

export function AssistantSheet() {
  const router = useRouter();
  const { isOpen, closeAssistant } = useAssistant();
  const { copy } = useLocale();
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
    userProfile
  } = useRoutine();

  const handleClose = () => {
    closeAssistant();
  };

  const panelRef = useRef<HTMLElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const titleId = useId();

  useDialogA11y(panelRef, { open: isOpen, onClose: handleClose, initialFocusRef: inputRef });

  const scrollTrigger = routine
    ? `routine-${messages.length}-${assistantTyping ? 'typing' : 'idle'}`
    : `staging-${stagingMessages.length}-${isStagingAssistantTyping ? 'typing' : 'idle'}-${isExtractingPaper ? 'extracting' : 'ready'}`;

  const endRef = useScrollToLatest<HTMLDivElement>(isOpen, scrollTrigger);

  const addPaper = useCallback((source: string | File) => {
    uploadPaper(source);
  }, [uploadPaper]);

  const handleFile = (file: File) => {
    if (!isPdfFile(file)) {
      toast.error(copy.upload.invalidType);
      return;
    }
    addPaper(file);
  };

  const handleConfirmCandidate = (scheduleOverride?: RoutineSchedulePreference) => {
    confirmStagingRoutine(scheduleOverride);
  };

  const hasAskConversation = messages.length > 0 || assistantTyping;
  const activeMessages = routine ? messages : stagingMessages;
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
      copy.assistant.rejection.suggestions.why,
      copy.assistant.rejection.suggestions.whatToUpload,
      copy.assistant.rejection.suggestions.nonHuman
    ].filter((s) => !asked.has(s.toLowerCase()));
  }, [stagingError, stagingMessages, copy]);

  const isUnrecognizedError = Boolean(stagingError && isUnrecognizedLinkReason(stagingError));

  const guidanceSuggestions = useMemo(() => {
    if (!isUnrecognizedError) return [];
    const asked = new Set(
      stagingMessages
        .filter((m) => m.role === 'user' && m.kind === 'question')
        .map((m) => m.content.trim().toLowerCase())
    );
    const g = copy.assistant.rejection.guidanceSuggestions;
    return [
      g.browseCommunity,
      g.achilles,
      g.hairLoss,
      g.creatine,
      g.searchPubmed
    ].filter((s) => !asked.has(s.toLowerCase()));
  }, [isUnrecognizedError, stagingMessages, copy]);

  const handleGuidanceSelect = useCallback(
    (suggestion: string) => {
      const g = copy.assistant.rejection.guidanceSuggestions;
      if (suggestion === g.browseCommunity) {
        closeAssistant();
        router.push(`${ROUTES.community}?tab=explore`);
        return;
      }
      if (suggestion === g.achilles) {
        addPaper('Achilles Tendinopathy Rehab');
        return;
      }
      if (suggestion === g.hairLoss) {
        addPaper('Alopecia Hair Regrowth');
        return;
      }
      if (suggestion === g.creatine) {
        addPaper('Creatine & Cognitive Fatigue');
        return;
      }
      askStagingQuestion(suggestion);
    },
    [copy, closeAssistant, router, addPaper, askStagingQuestion]
  );

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
            onClick={handleClose}
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
              routineTitle={
                routine
                  ? formatRoutineTitle(routine.shortTitle)
                  : stagingRoutine
                  ? copy.assistant.stagingTitle
                  : undefined
              }
              customTitle={
                stagingRoutine
                  ? copy.assistant.stagingTitle
                  : !routine
                  ? copy.assistant.unifiedTitleNoRoutine
                  : undefined
              }
              customEyebrow={
                stagingRoutine
                  ? copy.assistant.stagingEyebrow
                  : !routine
                  ? copy.assistant.unifiedEyebrowNoRoutine
                  : undefined
              }
              titleId={titleId}
              onClose={handleClose}
              lastEngine={lastEngine}
            />

            <div role="log" aria-live="polite" className="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 py-4">
              {isExtractingPaper ? (
                /* 1. Extraction in progress */
                <div className="py-4">
                  <ProcessingCard source={extractingSourceName} createdAt={Date.now()} />
                </div>
              ) : stagingRoutine ? (
                /* 2. Candidate Routine Staged for Review */
                <div className="space-y-4">
                  <CandidateRoutineCard
                    routine={stagingRoutine}
                    userProfile={userProfile}
                    onConfirm={handleConfirmCandidate}
                    onDiscard={discardStagingRoutine}
                    onToggleExcludeStep={toggleStagingExcludeStep}
                    onAskAboutStep={(step) => {
                      if (step.id === 'improvement') {
                        askStagingQuestion(step.action);
                      } else {
                        askStagingQuestion(copy.task.taskQuestionPrompt(step.action));
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
              ) : routine ? (
                /* 3. Active Routine Q&A & Support */
                <>
                  <MissingDataBanner />
                  {hasAskConversation ? (
                    messages.map((message) => (
                      <AssistantMessage key={message.id} message={message} />
                    ))
                  ) : (
                    <EmptyState
                      icon={ChatBubbleOutlineIcon}
                      title={copy.assistant.emptyTitle}
                      description={copy.assistant.emptyBody}
                    />
                  )}
                  {assistantTyping && <TypingIndicator />}
                </>
              ) : stagingMessages.length > 0 ? (
                /* 4. Pre-routine Research Navigator & Staging Chat */
                <div className="space-y-3">
                  {stagingMessages.map((message) => (
                    <AssistantMessage key={message.id} message={message} />
                  ))}
                  {isStagingAssistantTyping && <TypingIndicator />}
                </div>
              ) : (
                /* 5. Welcome & Health Goal / Symptom Discovery */
                <div className="py-2 space-y-4">
                  <div className="rounded-card border border-ink/10 bg-white p-5 text-start space-y-3 shadow-xs">
                    <div className="flex items-center gap-2.5">
                      <IconTile variant="plain" shape="circle" size={36} className="bg-mint">
                        <Icon icon={TravelExploreOutlinedIcon} size="sm" className="text-ink" />
                      </IconTile>
                      <div>
                        <h3 className="text-sm font-semibold text-ink">
                          {copy.assistant.unifiedWelcomeNoRoutine}
                        </h3>
                        <p className="text-2xs text-ink/60">
                          {copy.assistant.unifiedEyebrowNoRoutine}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-ink/75 leading-relaxed">
                      {copy.assistant.unifiedWelcomeNoRoutineBody}
                    </p>

                    <div className="pt-2 border-t border-ink/5">
                      <p className="text-2xs font-medium text-ink/60 mb-2">
                        {copy.assistant.linkGuidance.communityTitle}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {copy.assistant.problemChips.map((chip) => (
                          <button
                            key={chip}
                            type="button"
                            onClick={() => askQuestion(chip)}
                            className="rounded-full border border-ink/15 bg-canvas px-2.5 py-1 text-2xs font-medium text-ink transition-colors hover:border-ink/30 hover:bg-white cursor-pointer"
                          >
                            {chip}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-card border border-ink/10 bg-white/70 p-4">
                    <UploadDropzone onFile={addPaper} />
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </div>

            <footer className="shrink-0 space-y-3 border-t border-ink/10 bg-canvas px-5 pb-5 pt-3">
              {stagingRoutine ? (
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
                    placeholder={copy.assistant.placeholderStaging}
                    ariaLabel={copy.assistant.inputStaging}
                  />
                </>
              ) : isExtractingPaper ? null : stagingError ? (
                <>
                  <FaqSuggestions
                    suggestions={
                      isUnrecognizedError ? guidanceSuggestions : rejectionSuggestions
                    }
                    onSelect={
                      isUnrecognizedError ? handleGuidanceSelect : askStagingQuestion
                    }
                    disabled={isStagingAssistantTyping}
                  />
                  <AssistantComposer
                    ref={inputRef}
                    mode="ask"
                    onAsk={askStagingQuestion}
                    onAddPaper={addPaper}
                    onFile={handleFile}
                    placeholder={
                      isUnrecognizedError
                        ? copy.assistant.rejection.placeholderGuidance
                        : copy.assistant.rejection.placeholder
                    }
                    ariaLabel={copy.assistant.rejection.inputLabel}
                  />
                </>
              ) : (
                <>
                  <FaqSuggestions
                    suggestions={routine ? askSuggestions : copy.assistant.problemChips}
                    onSelect={askQuestion}
                    disabled={assistantTyping || isStagingAssistantTyping}
                  />
                  <AssistantComposer
                    ref={inputRef}
                    mode="ask"
                    onAsk={stagingRoutine ? askStagingQuestion : askQuestion}
                    onAddPaper={addPaper}
                    onFile={handleFile}
                    placeholder={
                      routine
                        ? copy.assistant.universalPlaceholderWithRoutine
                        : copy.assistant.universalPlaceholderNoRoutine
                    }
                  />
                </>
              )}
            </footer>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
