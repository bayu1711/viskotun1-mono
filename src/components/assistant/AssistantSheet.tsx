'use client';

import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'sonner';
import { type AssistantMode, useAssistant } from '../../contexts/AssistantContext';
import { ONBOARDING_DISMISSED_KEY } from '../../contexts/AuthContext';
import { useLocale } from '../../contexts/LocaleContext';
import { useRoutine } from '../../contexts/RoutineContext';
import type { RoutineSchedulePreference } from '../../types/schedule';
import { MOTION } from '../../data/config';
import { ROUTES } from '../../data/navigation';
import { PRECALIBRATED_SAMPLE_ROUTINES } from '../../data/samplePapers';
import { useDialogA11y } from '../../hooks/useDialogA11y';
import { useScrollToLatest } from '../../hooks/useScrollToLatest';
import { isPdfFile } from '../../utils/files';
import { isUnrecognizedLinkReason } from '../../utils/rejectionAssistant';
import {
  getQuickRepliesForStage,
  getStagePlaceholder
} from '../../utils/lifestyleInterview';
import { getDynamicSuggestions } from '../../utils/suggestions';
import { formatRoutineTitle } from '../../utils/text';
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
  const router = useRouter();
  const { isOpen, mode, setMode, closeAssistant } = useAssistant();
  const { locale, copy } = useLocale();
  const [selectedChips, setSelectedChips] = useState<string[]>([]);
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
    userProfile,
    updateLifestyleProfile,
    lifestyleMessages,
    isLifestyleTyping,
    lifestyleInterviewStage,
    jumpToLifestyleStage,
    setDoseMode,
    lifestyleSuggestions,
    setLifestyleSuggestions,
    initLifestyleConversation,
    restartLifestyleInterview,
    tuneLifestyle
  } = useRoutine();

  const handleClose = () => {
    if (mode === 'lifestyle' && !lifestyleProfile?.intakeCompleted) {
      try {
        window.sessionStorage.setItem(ONBOARDING_DISMISSED_KEY, '1');
      } catch {}
    }
    closeAssistant();
  };

  const panelRef = useRef<HTMLElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const titleId = useId();

  useDialogA11y(panelRef, { open: isOpen, onClose: handleClose, initialFocusRef: inputRef });

  const isAsk = mode === 'ask';
  const isLifestyle = mode === 'lifestyle';

  const scrollTrigger = isLifestyle
    ? `lifestyle-${lifestyleMessages.length}-${isLifestyleTyping ? 'typing' : 'idle'}`
    : isAsk
      ? `ask-${messages.length}-${assistantTyping ? 'typing' : 'idle'}`
      : `upload-${stagingMessages.length}-${isStagingAssistantTyping ? 'typing' : 'idle'}-${isExtractingPaper ? 'extracting' : 'ready'}`;

  const endRef = useScrollToLatest<HTMLDivElement>(isOpen, scrollTrigger);

  const handleModeChange = (next: AssistantMode) => {
    setMode(next);
    inputRef.current?.focus();
  };

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
    setMode('ask');
  };

  useEffect(() => {
    setSelectedChips([]);
  }, [lifestyleInterviewStage, isOpen]);

  const isMultiSelectStage =
    isLifestyle &&
    (lifestyleInterviewStage === 'availability' ||
      lifestyleInterviewStage === 'age_time' ||
      lifestyleInterviewStage === 'rhythm' ||
      lifestyleInterviewStage === 'cautions');

  const isNoneOption = useCallback(
    (item: string) =>
      item === copy.lifestyleTuning.onboarding.quickNoCautions ||
      item === copy.lifestyleTuning.onboarding.quickStandardRhythm ||
      item === copy.lifestyleTuning.onboarding.quickAnytime ||
      item === copy.lifestyleTuning.onboarding.quickSkipAge,
    [copy]
  );

  const isPrimaryOption = useCallback(
    (item: string) => item === copy.lifestyleTuning.onboarding.quickExploreRoutines,
    [copy]
  );

  const handleToggleChip = useCallback((item: string) => {
    setSelectedChips((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  }, []);

  const handleLifestyleReply = useCallback(
    (input: string) => {
      const trimmed = input.trim();
      if (
        trimmed === copy.lifestyleTuning.onboarding.quickExploreRoutines ||
        /^(?:explore(?:\s+routines?)?|browse(?:\s+routines?)?|find(?:\s+a)?\s+routine|show(?:\s+me)?\s+routines?|استكشاف الروتينات)/i.test(trimmed)
      ) {
        setSelectedChips([]);
        closeAssistant();
        router.push(`${ROUTES.community}?tab=explore`);
        return;
      }
      if (
        trimmed === copy.lifestyleTuning.onboarding.quickDone ||
        /^(?:done|back to routine|view routine|go to routine|العودة للخطة)/i.test(trimmed)
      ) {
        setSelectedChips([]);
        closeAssistant();
        if (routine) {
          router.push(ROUTES.routine);
        } else {
          router.push(`${ROUTES.community}?tab=explore`);
        }
        return;
      }
      if (trimmed === copy.lifestyleTuning.onboarding.quickUpdateProfile) {
        setSelectedChips([]);
        restartLifestyleInterview(copy);
        return;
      }
      if (
        trimmed === copy.lifestyleTuning.onboarding.quickChangeSchedule ||
        /^(?:adjust|change|update)\s+(?:my\s+)?schedule|change\s+availability|change\s+time\s+windows?|تعديل الجدول/i.test(trimmed)
      ) {
        setSelectedChips([]);
        jumpToLifestyleStage('availability', copy, trimmed);
        return;
      }
      if (
        trimmed === copy.lifestyleTuning.onboarding.quickAddCaution ||
        /^(?:add|have)\s+(?:a\s+)?(?:physical\s+)?caution|joint sensitivity|إضافة احتياط/i.test(trimmed)
      ) {
        setSelectedChips([]);
        jumpToLifestyleStage('cautions', copy, trimmed);
        return;
      }
      if (
        trimmed === copy.lifestyleTuning.onboarding.quickChangeRhythm ||
        /^(?:change|update)\s+(?:work|daily|rhythm|pattern)|نمط العمل/i.test(trimmed)
      ) {
        setSelectedChips([]);
        jumpToLifestyleStage('rhythm', copy, trimmed);
        return;
      }
      if (
        trimmed === copy.lifestyleTuning.onboarding.quickLowerIntensity ||
        /^(?:lower|reduce|decrease|gentle|micro)\s+(?:the\s+)?(?:intensity|load|pace|pacing|difficulty)|micro-?dose|تخفيف الشدة/i.test(trimmed)
      ) {
        setSelectedChips([]);
        if (routine) {
          setDoseMode('micro');
        }
        tuneLifestyle(trimmed, { locale, localeCopy: copy });
        return;
      }

      let finalMessage = input;
      if (selectedChips.length > 0 && !isNoneOption(trimmed) && !selectedChips.includes(trimmed)) {
        finalMessage = `${selectedChips.join(', ')}, ${trimmed}`;
      }
      setSelectedChips([]);
      tuneLifestyle(finalMessage, { locale, localeCopy: copy });
    },
    [
      copy,
      closeAssistant,
      router,
      routine,
      selectedChips,
      isNoneOption,
      tuneLifestyle,
      locale,
      restartLifestyleInterview,
      jumpToLifestyleStage,
      setDoseMode
    ]
  );

  const handleConfirmChips = useCallback(() => {
    if (selectedChips.length === 0) return;
    const combined = selectedChips.join(', ');
    setSelectedChips([]);
    tuneLifestyle(combined, { locale, localeCopy: copy });
  }, [selectedChips, tuneLifestyle, locale, copy]);

  const hasAskConversation = messages.length > 0 || assistantTyping;
  const activeMessages = isLifestyle ? lifestyleMessages : isAsk ? messages : stagingMessages;
  const lastEngine = useMemo(
    () => [...activeMessages].reverse().find((m) => m.engine)?.engine,
    [activeMessages]
  );

  const lifestyleQuickReplies = useMemo(
    () =>
      getQuickRepliesForStage({
        stage: lifestyleInterviewStage,
        lifestyleProfile,
        suggestions: lifestyleSuggestions,
        copy,
        hasActiveRoutine: Boolean(routine)
      }),
    [lifestyleInterviewStage, lifestyleProfile, lifestyleSuggestions, copy, routine]
  );

  const lifestylePlaceholder = getStagePlaceholder(lifestyleInterviewStage, copy);

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
              mode={mode}
              routineTitle={routine ? formatRoutineTitle(routine.shortTitle) : copy.assistant.noActiveRoutineForAskTitle}
              customTitle={
                !isAsk && !isLifestyle && stagingRoutine
                  ? copy.assistant.stagingTitle
                  : undefined
              }
              customEyebrow={
                !isAsk && !isLifestyle && stagingRoutine
                  ? copy.assistant.stagingEyebrow
                  : undefined
              }
              titleId={titleId}
              onModeChange={handleModeChange}
              onClose={handleClose}
              lastEngine={lastEngine}
            />

            <div role="log" aria-live="polite" className="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 py-4">
              {isLifestyle ? (
                /* Conversational Adaptive Lifestyle Interview & Ongoing Tuning */
                <LifestyleTuningView
                  lifestyleProfile={lifestyleProfile}
                  userProfile={userProfile}
                  messages={lifestyleMessages}
                  isTyping={isLifestyleTyping}
                  stage={lifestyleInterviewStage}
                  onInitConversation={initLifestyleConversation}
                  onRestartInterview={restartLifestyleInterview}
                  onSuggestionsLoaded={setLifestyleSuggestions}
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
                        title={copy.assistant.emptyTitle}
                        description={copy.assistant.emptyBody}
                      />
                    )}
                    {assistantTyping && <TypingIndicator />}
                  </>
                ) : (
                  <div className="py-8 text-center space-y-4">
                    <EmptyState
                      icon={ChatBubbleOutlineIcon}
                      title={copy.assistant.noActiveRoutineForAskTitle}
                      description={copy.assistant.noActiveRoutineForAskBody}
                    />
                    <button
                      type="button"
                      onClick={() => setMode('upload')}
                      className="rounded-full bg-ink px-4 py-2 text-xs font-medium text-white transition-opacity hover:opacity-90"
                    >
                      {copy.assistant.switchToUpload}
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

                      {!stagingError && (
                        <>
                          <div className="rounded-card border border-ink/10 bg-white p-4 space-y-2">
                            <h3 className="text-sm font-semibold text-ink">
                              {copy.assistant.intakeInstructionTitle}
                            </h3>
                            <p className="text-xs text-ink/65 leading-relaxed">
                              {copy.assistant.intakeInstructionBody}
                            </p>
                          </div>

                          <UploadDropzone onFile={addPaper} />
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}
              <div ref={endRef} />
            </div>

            <footer className="shrink-0 space-y-3 border-t border-ink/10 bg-canvas px-5 pb-5 pt-3">
              {isLifestyle ? (
                <>
                  <FaqSuggestions
                    suggestions={lifestyleQuickReplies}
                    onSelect={handleLifestyleReply}
                    disabled={isLifestyleTyping}
                    isMultiSelect={isMultiSelectStage}
                    selected={selectedChips}
                    onToggle={handleToggleChip}
                    onConfirm={handleConfirmChips}
                    confirmLabel={copy.lifestyleTuning.onboarding.multiSelectContinue(selectedChips.length)}
                    isNoneOption={isNoneOption}
                    isPrimaryOption={isPrimaryOption}
                  />
                  <AssistantComposer
                    ref={inputRef}
                    mode="lifestyle"
                    onAsk={handleLifestyleReply}
                    onAddPaper={addPaper}
                    onFile={handleFile}
                    placeholder={lifestylePlaceholder}
                    ariaLabel={copy.lifestyleTuning.title}
                  />
                </>
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
                <AssistantComposer
                  ref={inputRef}
                  mode="upload"
                  onAsk={askQuestion}
                  onAddPaper={addPaper}
                  onFile={handleFile}
                  placeholder={copy.assistant.placeholderUpload}
                  ariaLabel={copy.assistant.inputUpload}
                />
              )}
            </footer>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}