'use client';

import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import SpaOutlinedIcon from '@mui/icons-material/SpaOutlined';
import TravelExploreOutlinedIcon from '@mui/icons-material/TravelExploreOutlined';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'sonner';
import { useAssistant } from '../../contexts/AssistantContext';
import { ONBOARDING_DISMISSED_KEY } from '../../contexts/AuthContext';
import { useLocale } from '../../contexts/LocaleContext';
import { useRoutine } from '../../contexts/RoutineContext';
import type { RoutineSchedulePreference } from '../../types/schedule';
import { MOTION } from '../../data/config';
import { ROUTES } from '../../data/navigation';
import { useDialogA11y } from '../../hooks/useDialogA11y';
import { useScrollToLatest } from '../../hooks/useScrollToLatest';
import { isPdfFile } from '../../utils/files';
import { isUnrecognizedLinkReason } from '../../utils/rejectionAssistant';
import { getQuickRepliesForStage } from '../../utils/lifestyleInterview';
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
import { HiddenPdfInput } from './HiddenPdfInput';
import { LifestyleTuningView } from './LifestyleTuningView';
import { CandidateRoutineCard } from './messages/CandidateRoutineCard';
import { ProcessingCard } from './ProcessingCard';
import { TypingIndicator } from './TypingIndicator';

export function AssistantSheet() {
  const router = useRouter();
  const { isOpen, mode, setMode, closeAssistant } = useAssistant();
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
  const [showAttachHint, setShowAttachHint] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const hintTimerRef = useRef<NodeJS.Timeout | null>(null);

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

  const scrollTrigger = isLifestyle
    ? `lifestyle-${lifestyleMessages.length}-${isLifestyleTyping ? 'typing' : 'idle'}`
    : routine
    ? `routine-${messages.length}-${assistantTyping ? 'typing' : 'idle'}`
    : `staging-${stagingMessages.length}-${isStagingAssistantTyping ? 'typing' : 'idle'}-${isExtractingPaper ? 'extracting' : 'ready'}`;

  const endRef = useScrollToLatest<HTMLDivElement>(isOpen, scrollTrigger);

  const addPaper = useCallback(
    (source: string | File) => {
      uploadPaper(source);
    },
    [uploadPaper]
  );

  const handleFile = (file: File) => {
    if (!isPdfFile(file)) {
      toast.error(copy.upload.invalidType);
      return;
    }
    addPaper(file);
  };

  const triggerPdfUpload = useCallback(() => {
    uploadInputRef.current?.click();
    setShowAttachHint(true);
    if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    hintTimerRef.current = setTimeout(() => {
      setShowAttachHint(false);
    }, 5000);
  }, []);

  useEffect(() => {
    return () => {
      if (hintTimerRef.current) {
        clearTimeout(hintTimerRef.current);
        hintTimerRef.current = null;
      }
    };
  }, []);

  const handleConfirmCandidate = (scheduleOverride?: RoutineSchedulePreference) => {
    confirmStagingRoutine(scheduleOverride);
  };

  const handleLifestyleChipSelect = useCallback(
    (chip: string) => {
      if (updateLifestyleProfile) {
        if (chip.includes('Extreme summer heat') || chip.includes('حرارة الصيف')) {
          updateLifestyleProfile({ climateSensitivity: 'summer_heat' });
        } else if (chip.includes('Ramadan') || chip.includes('رمضان')) {
          updateLifestyleProfile({ isRamadanFastingObserver: true });
        } else if (chip.includes('Shift work') || chip.includes('الورديات')) {
          updateLifestyleProfile({ workPattern: 'shift_work' });
        } else if (chip.includes('Desk-bound') || chip.includes('المكتبي')) {
          updateLifestyleProfile({ workPattern: 'desk_sedentary', activityBaseline: 'sedentary' });
        } else if (
          chip.includes('Nicotine') ||
          chip.includes('النيكوتين') ||
          chip.includes('المدواخ')
        ) {
          updateLifestyleProfile({ smokingStatus: 'midwakh_dokha' });
        } else if (chip.includes('Joint-friendly') || chip.includes('المفاصل')) {
          updateLifestyleProfile({ physicalCautions: ['knee_sensitivity'] });
        }
      }
      askQuestion(chip);
    },
    [updateLifestyleProfile, askQuestion]
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
                mode === 'lifestyle'
                  ? copy.lifestyleTuning.title
                  : stagingRoutine
                  ? copy.assistant.stagingTitle
                  : !routine
                  ? copy.assistant.unifiedTitleNoRoutine
                  : undefined
              }
              customEyebrow={
                mode === 'lifestyle'
                  ? copy.lifestyleTuning.badge
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
              ) : mode === 'lifestyle' ? (
                /* 4. Interactive Lifestyle Interview & Tuning */
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-1 border-b border-ink/5">
                    <button
                      type="button"
                      onClick={() => setMode('ask')}
                      className="inline-flex items-center gap-1.5 text-2xs font-medium text-ink/70 hover:text-ink transition-colors cursor-pointer"
                    >
                      <Icon icon={ArrowBackIcon} size="xs" />
                      <span>{copy.assistant.backToDiscovery}</span>
                    </button>
                  </div>
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
                </div>
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
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragOver(true);
                  }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragOver(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) handleFile(file);
                  }}
                  className={`py-2 space-y-4 transition-colors rounded-card ${
                    isDragOver ? 'ring-2 ring-ink ring-offset-2 bg-mint/20' : ''
                  }`}
                >
                  <div className="rounded-card border border-ink/10 bg-white p-5 text-start space-y-3.5 shadow-xs">
                    <div className="flex items-start gap-2.5">
                      <IconTile variant="plain" shape="circle" size={36} className="bg-mint shrink-0 mt-0.5">
                        <Icon icon={TravelExploreOutlinedIcon} size="sm" className="text-ink" />
                      </IconTile>
                      <div>
                        <h3 className="text-sm font-semibold text-ink leading-snug">
                          {copy.assistant.unifiedWelcomeNoRoutine}
                        </h3>
                        <p className="text-2xs text-ink/60 mt-0.5">
                          {copy.assistant.unifiedEyebrowNoRoutine}
                        </p>
                      </div>
                    </div>

                    <p className="text-xs text-ink/75 leading-relaxed">
                      {activeDiscoveryTab === 'lifestyle'
                        ? copy.assistant.lifestyleDiscoveryBody
                        : copy.assistant.unifiedWelcomeNoRoutineBody}
                    </p>

                    {/* Discovery Category Pill Switcher */}
                    <div className="flex items-center gap-1.5 p-1 rounded-full bg-canvas border border-ink/10 text-2xs font-medium">
                      <button
                        type="button"
                        onClick={() => setActiveDiscoveryTab('goals')}
                        className={`flex-1 py-1 px-2.5 rounded-full text-center transition-all cursor-pointer ${
                          activeDiscoveryTab === 'goals'
                            ? 'bg-white text-ink font-semibold shadow-xs'
                            : 'text-ink/65 hover:text-ink'
                        }`}
                      >
                        {copy.assistant.discoveryTabs.healthGoals}
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveDiscoveryTab('lifestyle')}
                        className={`flex-1 py-1 px-2.5 rounded-full text-center transition-all cursor-pointer flex items-center justify-center gap-1 ${
                          activeDiscoveryTab === 'lifestyle'
                            ? 'bg-white text-ink font-semibold shadow-xs'
                            : 'text-ink/65 hover:text-ink'
                        }`}
                      >
                        <Icon icon={AutoAwesomeOutlinedIcon} size="xs" className="text-ink/70" />
                        <span>{copy.assistant.discoveryTabs.lifestyle}</span>
                      </button>
                    </div>

                    {/* Tab Options */}
                    {activeDiscoveryTab === 'goals' ? (
                      <div className="pt-2 border-t border-ink/5 space-y-2">
                        <p className="text-2xs font-medium text-ink/60">
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
                    ) : (
                      <div className="pt-2 border-t border-ink/5 space-y-3">
                        <button
                          type="button"
                          onClick={() => {
                            setMode('lifestyle');
                            initLifestyleConversation(copy);
                          }}
                          className="w-full flex items-center justify-between p-3 rounded-tile border border-mint bg-mint/25 hover:bg-mint/40 text-start transition-colors cursor-pointer group"
                        >
                          <div className="flex items-center gap-2.5">
                            <IconTile variant="plain" shape="circle" size={32} className="bg-mint">
                              <Icon icon={SpaOutlinedIcon} size="xs" className="text-ink" />
                            </IconTile>
                            <div>
                              <p className="text-xs font-semibold text-ink">
                                {copy.assistant.answerLifestyleQuestionsBtn}
                              </p>
                              <p className="text-3xs text-ink/65">
                                Region · Daily Schedule · Circadian Rhythms · Cautions
                              </p>
                            </div>
                          </div>
                          <span className="text-xs font-medium text-ink/60 group-hover:translate-x-0.5 transition-transform">→</span>
                        </button>

                        <div>
                          <p className="text-2xs font-medium text-ink/60 mb-2">
                            {copy.assistant.orPickLifestylePreset}
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {copy.assistant.lifestyleChips.map((chip) => (
                              <button
                                key={chip}
                                type="button"
                                onClick={() => handleLifestyleChipSelect(chip)}
                                className="rounded-full border border-ink/15 bg-canvas px-2.5 py-1 text-2xs font-medium text-ink transition-colors hover:border-ink/30 hover:bg-white cursor-pointer"
                              >
                                {chip}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Single Chip Option for Research PDF Upload */}
                    <div className="pt-2.5 border-t border-ink/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={triggerPdfUpload}
                        className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-ink/30 bg-mint/35 hover:bg-mint/60 px-3 py-1 text-2xs font-medium text-ink transition-colors cursor-pointer shrink-0"
                      >
                        <Icon icon={AttachFileIcon} size="xs" className="text-ink/75 rotate-45" />
                        <span>{copy.assistant.attachPdfChip}</span>
                      </button>

                      <AnimatePresence>
                        {showAttachHint && (
                          <motion.span
                            initial={{ opacity: 0, x: -4 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0 }}
                            className="text-3xs text-ink/70 flex items-center gap-1"
                          >
                            <span>↓</span>
                            <span>{copy.assistant.attachPdfHint}</span>
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </div>

                    <HiddenPdfInput ref={uploadInputRef} onFile={handleFile} />
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
                          : lifestyleProfile?.smokingStatus && lifestyleProfile.smokingStatus !== 'non_smoker'
                          ? 'Nicotine & Dokha harm reduction'
                          : lifestyleProfile?.physicalCautions?.includes('knee_sensitivity')
                          ? 'Achilles & knee tendon rehab'
                          : copy.lifestyleTuning.onboarding.quickExploreRoutines;
                        askQuestion(query);
                        return;
                      }
                      tuneLifestyle(reply);
                    }}
                    disabled={isLifestyleTyping}
                  />
                  <AssistantComposer
                    ref={inputRef}
                    mode="lifestyle"
                    onAsk={tuneLifestyle}
                    onAddPaper={addPaper}
                    onFile={handleFile}
                    placeholder={copy.lifestyleTuning.customPromptPlaceholder}
                    ariaLabel={copy.lifestyleTuning.title}
                  />
                </>
              ) : (
                <>
                  <FaqSuggestions
                    suggestions={
                      routine
                        ? askSuggestions
                        : activeDiscoveryTab === 'lifestyle'
                        ? copy.assistant.lifestyleChips
                        : copy.assistant.problemChips
                    }
                    onSelect={activeDiscoveryTab === 'lifestyle' ? handleLifestyleChipSelect : askQuestion}
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
