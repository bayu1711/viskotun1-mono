'use client';

import React, { useCallback, useId, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'sonner';
import { useAssistant } from '../../contexts/AssistantContext';
import { ONBOARDING_DISMISSED_KEY } from '../../contexts/AuthContext';
import { useLocale } from '../../contexts/LocaleContext';
import { useRoutine } from '../../contexts/RoutineContext';
import { MOTION } from '../../data/config';
import { ROUTES } from '../../data/navigation';
import { PRECALIBRATED_SAMPLE_ROUTINES, type SamplePaper } from '../../data/samplePapers';
import type { UserLifestyleProfile } from '../../types/auth';
import type { RoutineSchedulePreference } from '../../types/schedule';
import { useDialogA11y } from '../../hooks/useDialogA11y';
import { useScrollToLatest } from '../../hooks/useScrollToLatest';
import { detectNewRoutineIntent } from '../../utils/assistant';
import { isPdfFile } from '../../utils/files';
import { getQuickRepliesForStage } from '../../utils/lifestyleInterview';
import { resolveCulturalRhythms, syncLifestyleActiveTags } from '../../utils/profile';
import { isUnrecognizedLinkReason } from '../../utils/rejectionAssistant';
import { getDynamicSuggestions } from '../../utils/suggestions';
import { formatRoutineTitle } from '../../utils/text';
import { Icon } from '../ui/Icon';
import { EmptyState } from '../feedback/EmptyState';
import { MissingDataBanner } from '../routine/MissingDataBanner';
import { AssistantComposer } from './AssistantComposer';
import { AssistantHeader } from './AssistantHeader';
import { AssistantMessage } from './AssistantMessage';
import { FaqSuggestions } from './FaqSuggestions';
import { LifestyleTuningView } from './LifestyleTuningView';
import { CandidateRoutineCard } from './messages/CandidateRoutineCard';
import { ProcessingCard } from './ProcessingCard';
import { RoutineDiscoveryCard } from './RoutineDiscoveryCard';
import { TypingIndicator } from './TypingIndicator';

export function AssistantSheet() {
  const router = useRouter();
  const { isOpen, mode, setMode, closeAssistant } = useAssistant();
  const { locale, copy } = useLocale();
  const {
    messages,
    routine,
    routines,
    samplePapers,
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
    userProfile,
    lifestyleProfile,
    updateLifestyleProfile,
    lifestyleMessages,
    isLifestyleTyping,
    lifestyleInterviewStage,
    lifestyleSuggestions,
    setLifestyleSuggestions,
    initLifestyleConversation,
    restartLifestyleInterview,
    tuneLifestyle
  } = useRoutine();

  const [activeDiscoveryTab, setActiveDiscoveryTab] = useState<'goals' | 'lifestyle'>('goals');

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

  const isLifestyle = mode === 'lifestyle';
  const isDiscoveryMode = mode === 'upload';
  const isPostLifestyleDiscovery =
    isLifestyle && lifestyleInterviewStage === 'complete' && !routine && !isLifestyleTyping;
  const trackedRoutineIds = useMemo(() => routines.map((r) => r.id), [routines]);

  const scrollTrigger = isLifestyle
    ? `lifestyle-${lifestyleMessages.length}-${isLifestyleTyping ? 'typing' : 'idle'}-${lifestyleInterviewStage}`
    : isDiscoveryMode || !routine
    ? `staging-${stagingMessages.length}-${isStagingAssistantTyping ? 'typing' : 'idle'}-${isExtractingPaper ? 'extracting' : 'ready'}`
    : `routine-${messages.length}-${assistantTyping ? 'typing' : 'idle'}`;

  const endRef = useScrollToLatest<HTMLDivElement>(isOpen, scrollTrigger);

  const addPaper = useCallback(
    (source: string | File) => {
      if (mode === 'lifestyle') setMode('ask');
      uploadPaper(source);
    },
    [uploadPaper, mode, setMode]
  );

  const handleFile = useCallback(
    (file: File) => {
      if (!isPdfFile(file)) {
        toast.error(copy.upload.invalidType);
        return;
      }
      addPaper(file);
    },
    [addPaper, copy.upload.invalidType]
  );

  const handleLoadPreset = useCallback(
    (paper: SamplePaper) => {
      setMode('ask');
      const routineId = paper.routineId;
      if (routineId && PRECALIBRATED_SAMPLE_ROUTINES[routineId]) {
        uploadPaper(paper.shortTitle, PRECALIBRATED_SAMPLE_ROUTINES[routineId]);
      } else {
        uploadPaper(paper.doi || paper.title);
      }
    },
    [setMode, uploadPaper]
  );

  const handleConfirmCandidate = (scheduleOverride?: RoutineSchedulePreference) => {
    setMode('ask');
    confirmStagingRoutine(scheduleOverride);
  };

  const handleAskDiscoveryQuestion = useCallback(
    (question: string) => {
      if (!isDiscoveryMode && routine) {
        const intent = detectNewRoutineIntent(question);
        if (intent.isNewRoutine) {
          setMode('upload');
          if (intent.topicQuery) {
            askQuestion(intent.topicQuery, { forceDiscovery: true });
          }
          return;
        }
      }
      const shouldForceDiscovery = isDiscoveryMode || !routine;
      if (mode === 'lifestyle') {
        setMode(routine ? 'upload' : 'ask');
      }
      askQuestion(question, { forceDiscovery: shouldForceDiscovery });
    },
    [mode, isDiscoveryMode, routine, setMode, askQuestion]
  );

  const handleBrowseCommunity = useCallback(() => {
    closeAssistant();
    router.push(`${ROUTES.community}?tab=explore`);
  }, [closeAssistant, router]);

  const handleTuneLifestyle = useCallback(
    (message: string) => {
      return tuneLifestyle(message, { locale, localeCopy: copy });
    },
    [tuneLifestyle, locale, copy]
  );

  const handleLifestyleChipSelect = useCallback(
    (chip: string) => {
      if (updateLifestyleProfile) {
        const base: Partial<UserLifestyleProfile> = { ...(lifestyleProfile || {}) };
        let updates: Partial<UserLifestyleProfile> = {};

        if (chip.includes('Extreme summer heat') || chip.includes('حرارة الصيف')) {
          updates = { climateSensitivity: 'summer_heat' };
        } else if (chip.includes('Ramadan') || chip.includes('رمضان')) {
          const rhythms = Array.from(
            new Set([...resolveCulturalRhythms(lifestyleProfile), 'ramadan_fasting' as const])
          );
          updates = { isRamadanFastingObserver: true, culturalRhythms: rhythms };
        } else if (chip.includes('Shift work') || chip.includes('الورديات')) {
          updates = { workPattern: 'shift_work' };
        } else if (chip.includes('Desk-bound') || chip.includes('المكتبي')) {
          updates = { workPattern: 'desk_sedentary', activityBaseline: 'sedentary' };
        } else if (
          chip.includes('Nicotine') ||
          chip.includes('النيكوتين') ||
          chip.includes('المدواخ')
        ) {
          updates = { smokingStatus: 'midwakh_dokha' };
        } else if (chip.includes('Joint-friendly') || chip.includes('المفاصل')) {
          const existingCautions = lifestyleProfile?.physicalCautions || [];
          updates = {
            physicalCautions: Array.from(new Set([...existingCautions, 'Knee sensitivity']))
          };
        }

        if (Object.keys(updates).length > 0) {
          const merged = { ...base, ...updates };
          updateLifestyleProfile({
            ...updates,
            activeTags: syncLifestyleActiveTags(merged)
          });
        }
      }
      handleAskDiscoveryQuestion(chip);
    },
    [updateLifestyleProfile, lifestyleProfile, handleAskDiscoveryQuestion]
  );

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
      if (suggestion === g.searchPubmed) {
        askStagingQuestion(copy.assistant.universalPlaceholderNoRoutine);
        return;
      }
      askStagingQuestion(suggestion);
    },
    [copy, closeAssistant, router, addPaper, askStagingQuestion]
  );

  const isWelcomeDiscovery =
    (!routine && !isLifestyle && stagingMessages.length === 0) ||
    (isDiscoveryMode && stagingMessages.length === 0);

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
                !isLifestyle && !isDiscoveryMode && routine
                  ? formatRoutineTitle(routine.shortTitle)
                  : stagingRoutine
                  ? copy.assistant.stagingTitle
                  : undefined
              }
              customTitle={
                isLifestyle
                  ? isPostLifestyleDiscovery
                    ? copy.assistant.unifiedTitleNoRoutine
                    : copy.lifestyleTuning.title
                  : stagingRoutine
                  ? copy.assistant.stagingTitle
                  : isDiscoveryMode || !routine
                  ? copy.assistant.unifiedTitleNoRoutine
                  : undefined
              }
              customEyebrow={
                isLifestyle || isDiscoveryMode
                  ? copy.assistant.unifiedEyebrowNoRoutine
                  : stagingRoutine
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
              ) : isLifestyle ? (
                /* 3. Interactive Lifestyle Interview & Post-Completion Routine Suggestions */
                <div className="space-y-4">
                  {routine ? (
                    <div className="flex items-center justify-between pb-1 border-b border-ink/5">
                      <button
                        type="button"
                        onClick={() => setMode('ask')}
                        className="inline-flex items-center gap-1.5 text-2xs font-medium text-ink/70 hover:text-ink transition-colors cursor-pointer"
                      >
                        <Icon icon={ArrowBackIcon} size="xs" />
                        <span>{copy.assistant.backToRoutine}</span>
                      </button>
                    </div>
                  ) : !lifestyleProfile?.intakeCompleted && lifestyleInterviewStage !== 'complete' ? (
                    <div className="flex items-center justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          try {
                            window.sessionStorage.setItem(ONBOARDING_DISMISSED_KEY, '1');
                          } catch {}
                          setMode('ask');
                        }}
                        className="text-2xs font-medium text-ink/60 hover:text-ink underline underline-offset-4 transition-colors cursor-pointer"
                      >
                        {copy.lifestyleTuning.onboarding.skipForNow}
                      </button>
                    </div>
                  ) : null}
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
                  {isPostLifestyleDiscovery && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25, ease: 'easeOut' }}
                    >
                      <RoutineDiscoveryCard
                        variant="post-lifestyle"
                        lifestyleProfile={lifestyleProfile}
                        samplePapers={samplePapers}
                        excludeRoutineIds={trackedRoutineIds}
                        activeTab={activeDiscoveryTab}
                        onTabChange={setActiveDiscoveryTab}
                        onAskQuestion={handleAskDiscoveryQuestion}
                        onSelectLifestyleChip={handleLifestyleChipSelect}
                        onStartLifestyleInterview={() => restartLifestyleInterview(copy)}
                        onLoadPreset={handleLoadPreset}
                        onBrowseCommunity={handleBrowseCommunity}
                        onFile={handleFile}
                      />
                    </motion.div>
                  )}
                </div>
              ) : isDiscoveryMode ? (
                /* 4. New Routine Discovery (triggered via + New routine while a routine is active) */
                <div className="space-y-4">
                  {routine && (
                    <div className="flex items-center justify-between pb-1 border-b border-ink/5">
                      <button
                        type="button"
                        onClick={() => setMode('ask')}
                        className="inline-flex items-center gap-1.5 text-2xs font-medium text-ink/70 hover:text-ink transition-colors cursor-pointer"
                      >
                        <Icon icon={ArrowBackIcon} size="xs" />
                        <span>{copy.assistant.backToRoutine}</span>
                      </button>
                    </div>
                  )}
                  {stagingMessages.length > 0 ? (
                    <div className="space-y-3">
                      {stagingMessages.map((message) => (
                        <AssistantMessage key={message.id} message={message} />
                      ))}
                      {isStagingAssistantTyping && <TypingIndicator />}
                    </div>
                  ) : (
                    <RoutineDiscoveryCard
                      variant={routine ? 'add-another' : 'welcome'}
                      lifestyleProfile={lifestyleProfile}
                      samplePapers={samplePapers}
                      excludeRoutineIds={trackedRoutineIds}
                      activeTab={activeDiscoveryTab}
                      onTabChange={setActiveDiscoveryTab}
                      onAskQuestion={handleAskDiscoveryQuestion}
                      onSelectLifestyleChip={handleLifestyleChipSelect}
                      onStartLifestyleInterview={() => {
                        setMode('lifestyle');
                        initLifestyleConversation(copy);
                      }}
                      onLoadPreset={handleLoadPreset}
                      onBrowseCommunity={handleBrowseCommunity}
                      onFile={handleFile}
                    />
                  )}
                </div>
              ) : routine ? (
                /* 4. Active Routine Q&A & Support */
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
                /* 5. Pre-routine Research Navigator & Staging Chat */
                <div className="space-y-3">
                  {stagingMessages.map((message) => (
                    <AssistantMessage key={message.id} message={message} />
                  ))}
                  {isStagingAssistantTyping && <TypingIndicator />}
                </div>
              ) : (
                /* 6. Welcome & Routine Discovery (Health Goals, Lifestyle, & Single PDF Chip) */
                <div className="py-2">
                  <RoutineDiscoveryCard
                    variant="welcome"
                    lifestyleProfile={lifestyleProfile}
                    samplePapers={samplePapers}
                    activeTab={activeDiscoveryTab}
                    onTabChange={setActiveDiscoveryTab}
                    onAskQuestion={handleAskDiscoveryQuestion}
                    onSelectLifestyleChip={handleLifestyleChipSelect}
                    onStartLifestyleInterview={() => {
                      setMode('lifestyle');
                      initLifestyleConversation(copy);
                    }}
                    onLoadPreset={handleLoadPreset}
                    onFile={handleFile}
                  />
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
              ) : isPostLifestyleDiscovery ? (
                /* Post-lifestyle interview: composer transitions seamlessly to routine discovery with PDF attach icon */
                <AssistantComposer
                  ref={inputRef}
                  mode="ask"
                  onAsk={handleAskDiscoveryQuestion}
                  onAddPaper={addPaper}
                  onFile={handleFile}
                  placeholder={copy.assistant.universalPlaceholderNoRoutine}
                />
              ) : isLifestyle ? (
                <>
                  <FaqSuggestions
                    suggestions={getQuickRepliesForStage({
                      stage: lifestyleInterviewStage,
                      lifestyleProfile,
                      suggestions: lifestyleSuggestions,
                      copy,
                      hasActiveRoutine: Boolean(routine)
                    })}
                    onSelect={(reply) => {
                      if (reply === copy.lifestyleTuning.onboarding.quickExploreRoutines) {
                        setMode('ask');
                        const query = lifestyleProfile?.isRamadanFastingObserver
                          ? 'Ramadan fasting & metabolic stability'
                          : lifestyleProfile?.climateSensitivity === 'summer_heat'
                          ? 'Extreme summer heat & hydration'
                          : lifestyleProfile?.smokingStatus &&
                            lifestyleProfile.smokingStatus !== 'non_smoker'
                          ? 'Nicotine & Dokha harm reduction'
                          : lifestyleProfile?.physicalCautions?.length
                          ? 'Achilles & knee tendon rehab'
                          : copy.lifestyleTuning.onboarding.quickExploreRoutines;
                        askQuestion(query);
                        return;
                      }
                      if (reply === copy.lifestyleTuning.onboarding.quickDone && routine) {
                        setMode('ask');
                        return;
                      }
                      handleTuneLifestyle(reply);
                    }}
                    disabled={isLifestyleTyping}
                  />
                  <AssistantComposer
                    ref={inputRef}
                    mode="lifestyle"
                    onAsk={handleTuneLifestyle}
                    onAddPaper={addPaper}
                    onFile={handleFile}
                    placeholder={copy.lifestyleTuning.customPromptPlaceholder}
                    ariaLabel={copy.lifestyleTuning.title}
                  />
                </>
              ) : (
                <>
                  {!isWelcomeDiscovery && (
                    <FaqSuggestions
                      suggestions={
                        !isDiscoveryMode && routine ? askSuggestions : copy.assistant.problemChips
                      }
                      onSelect={handleAskDiscoveryQuestion}
                      disabled={assistantTyping || isStagingAssistantTyping}
                    />
                  )}
                  <AssistantComposer
                    ref={inputRef}
                    mode="ask"
                    onAsk={handleAskDiscoveryQuestion}
                    onAddPaper={addPaper}
                    onFile={handleFile}
                    placeholder={
                      !isDiscoveryMode && routine
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
