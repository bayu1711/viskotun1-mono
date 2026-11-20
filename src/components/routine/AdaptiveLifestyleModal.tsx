'use client';

import React, { useId, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import CloseIcon from '@mui/icons-material/Close';
import PublicOutlinedIcon from '@mui/icons-material/PublicOutlined';
import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined';
import ScheduleOutlinedIcon from '@mui/icons-material/ScheduleOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import { AnimatePresence, motion } from 'framer-motion';
import { useAssistant } from '../../contexts/AssistantContext';
import { useLocale } from '../../contexts/LocaleContext';
import { useRoutine } from '../../contexts/RoutineContext';
import { MOTION } from '../../data/config';
import { ROUTES } from '../../data/navigation';
import { useDialogA11y } from '../../hooks/useDialogA11y';
import type { AvailableTimeWindow, RoutineScheduleMode } from '../../types/schedule';
import { cn } from '../../utils/cn';
import {
  evaluateRoutineScheduleCompatibility,
  formatAvailabilitySummary,
  normalizeAvailableWindows,
  resolveProfileAvailability
} from '../../utils/schedule';
import { AIIcon } from '../ui/AIIcon';
import { AvailableWindowsEditor } from '../ui/AvailableWindowsEditor';
import { CircleButton } from '../ui/CircleButton';
import { Icon } from '../ui/Icon';

export function AdaptiveLifestyleModal() {
  const {
    isLifestyleModalOpen,
    closeLifestyleModal,
    routine,
    userProfile,
    routineSchedule,
    setRoutineSchedule,
    excludedStepIds,
    activeAdaptation,
    isAdaptingLifestyle,
    refreshLifestyleAdaptation
  } = useRoutine();
  const { openLifestyleTuning } = useAssistant();
  const { copy, locale, isRtl } = useLocale();
  const sCopy = copy.schedule;

  const titleId = useId();
  const descId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  const [isScheduleEditorOpen, setIsScheduleEditorOpen] = useState(false);

  useDialogA11y(panelRef, { open: isLifestyleModalOpen, onClose: closeLifestyleModal });

  const profileAvail = useMemo(() => resolveProfileAvailability(userProfile), [userProfile]);

  const compatibility = useMemo(
    () =>
      routine
        ? evaluateRoutineScheduleCompatibility(routine, userProfile, routineSchedule, excludedStepIds)
        : activeAdaptation?.scheduleCompatibility,
    [routine, userProfile, routineSchedule, excludedStepIds, activeAdaptation?.scheduleCompatibility]
  );

  const currentMode: RoutineScheduleMode =
    routineSchedule?.mode ?? (profileAvail.mode === 'anytime' ? 'anytime' : 'profile_windows');

  const customWindows: AvailableTimeWindow[] =
    routineSchedule?.customWindows && routineSchedule.customWindows.length > 0
      ? routineSchedule.customWindows
      : profileAvail.windows;

  const handleModeSelect = (mode: RoutineScheduleMode) => {
    if (mode === 'custom_windows') {
      setRoutineSchedule({
        mode: 'custom_windows',
        customWindows: normalizeAvailableWindows(customWindows)
      });
      setIsScheduleEditorOpen(true);
    } else {
      setRoutineSchedule({ mode });
      setIsScheduleEditorOpen(false);
    }
  };

  const handleCustomWindowsChange = (next: AvailableTimeWindow[]) => {
    setRoutineSchedule({
      mode: 'custom_windows',
      customWindows: next
    });
  };

  const handleOpenTune = () => {
    closeLifestyleModal();
    openLifestyleTuning();
  };

  const scheduleSummaryPill = formatAvailabilitySummary(userProfile, routineSchedule, locale);
  const hasConflict = compatibility?.status === 'conflict';

  return (
    <AnimatePresence>
      {isLifestyleModalOpen && (
        <motion.div
          className="fixed inset-0 z-modal flex items-center justify-center p-3 sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={MOTION.fade}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
            onClick={closeLifestyleModal}
            aria-hidden="true"
          />

          {/* Modal Card */}
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descId}
            dir={isRtl ? 'rtl' : 'ltr'}
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={MOTION.dialogSpring}
            className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-card border border-ink/20 bg-canvas p-5 sm:p-6 shadow-popover"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-1.5 mb-1">
                  {activeAdaptation?.regionLabel && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-0.5 text-3xs font-semibold text-ink border border-ink/10">
                      <Icon icon={PublicOutlinedIcon} size="xs" />
                      <span>{activeAdaptation.regionLabel}</span>
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 rounded-full bg-mint/50 px-2.5 py-0.5 text-3xs font-semibold text-ink">
                    <Icon icon={ScheduleOutlinedIcon} size="xs" />
                    <span>
                      {routineSchedule?.mode === 'anytime'
                        ? sCopy.modeLabels.anytime
                        : scheduleSummaryPill || activeAdaptation?.suggestedWindow || 'Adaptive'}
                    </span>
                  </span>
                </div>
                <h2 id={titleId} className="font-serif text-lg font-bold text-ink">
                  {sCopy.modalTitle || 'Adaptive Lifestyle Context'}
                </h2>
              </div>
              <CircleButton label={locale === 'ar' ? 'إغلاق' : 'Close'} onClick={closeLifestyleModal}>
                <Icon icon={CloseIcon} size="sm" />
              </CircleButton>
            </div>

            <p id={descId} className="mt-2 text-xs leading-relaxed text-ink/75">
              {sCopy.modalSubtitle}
            </p>

            {/* Quick Action Toolbar */}
            <div className="mt-4 flex flex-wrap items-center gap-2 border-y border-ink/10 py-2.5">
              <button
                type="button"
                onClick={() => refreshLifestyleAdaptation()}
                disabled={isAdaptingLifestyle}
                className="inline-flex items-center gap-1.5 rounded-full border border-ink/15 bg-white px-3 py-1 text-2xs font-semibold text-ink hover:border-ink transition-colors disabled:opacity-50 cursor-pointer"
                title={locale === 'ar' ? 'تحديث التكييف الذكي' : 'Refresh AI adaptation'}
              >
                <Icon
                  icon={RefreshOutlinedIcon}
                  size="xs"
                  className={isAdaptingLifestyle ? 'animate-spin' : ''}
                />
                <span>{locale === 'ar' ? 'تحديث' : 'Refresh'}</span>
              </button>

              <button
                type="button"
                onClick={handleOpenTune}
                className="inline-flex items-center gap-1.5 rounded-full border border-ink/15 bg-white px-3 py-1 text-2xs font-semibold text-ink hover:border-ink transition-colors cursor-pointer"
              >
                <AIIcon size="xs" />
                <span>{locale === 'ar' ? 'تعديل السياق' : 'Tune with AI'}</span>
              </button>

              <Link
                href={`${ROUTES.profile}?tab=lifestyle`}
                onClick={closeLifestyleModal}
                className="inline-flex items-center gap-1 rounded-full border border-ink/15 bg-white px-3 py-1 text-2xs font-semibold text-ink hover:border-ink transition-colors"
              >
                <span>{locale === 'ar' ? 'الملف الشخصي' : 'Full Profile'}</span>
              </Link>
            </div>

            {/* Schedule Conflict Callout */}
            {hasConflict && compatibility && (
              <div className="mt-4 rounded-xl border border-orange/40 bg-orange/10 p-3.5 text-xs text-ink">
                <div className="flex items-center gap-1.5 font-bold text-orange-950">
                  <Icon icon={WarningAmberOutlinedIcon} size="xs" className="text-orange-600" />
                  <span>{sCopy.statusBadges.conflict}</span>
                </div>
                <p className="mt-1 leading-relaxed text-ink/85">{compatibility.explanation}</p>
              </div>
            )}

            {/* AI Adaptation Guidance */}
            {activeAdaptation && (
              <div className="mt-4 rounded-xl border border-ink/10 bg-white/70 p-3.5">
                <p className="text-xs font-semibold text-ink">{activeAdaptation.bannerTitle}</p>
                <p className="mt-1 text-2xs leading-relaxed text-ink/75">
                  {activeAdaptation.bannerGuidance}
                </p>
              </div>
            )}

            {/* Schedule Configuration Section */}
            <div className="mt-4 rounded-xl border border-ink/15 bg-white/90 p-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-semibold text-ink">{sCopy.routineOverrideTitle}</span>
                <button
                  type="button"
                  onClick={() => setIsScheduleEditorOpen((prev) => !prev)}
                  className="text-3xs font-medium text-ink/70 hover:text-ink underline cursor-pointer"
                >
                  {isScheduleEditorOpen
                    ? locale === 'ar'
                      ? 'إخفاء المحرر'
                      : 'Hide Editor'
                    : locale === 'ar'
                    ? 'تعديل النوافذ'
                    : 'Edit Windows'}
                </button>
              </div>

              {/* Mode Pills */}
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {(['profile_windows', 'anytime', 'custom_windows'] as const).map((modeOption) => (
                  <button
                    key={modeOption}
                    type="button"
                    onClick={() => handleModeSelect(modeOption)}
                    className={cn(
                      'rounded-full border px-3 py-1 text-3xs font-medium transition-colors cursor-pointer',
                      currentMode === modeOption
                        ? 'border-ink bg-ink text-white'
                        : 'border-ink/15 bg-white text-ink/80 hover:border-ink hover:text-ink'
                    )}
                  >
                    {sCopy.modeLabels[modeOption]}
                  </button>
                ))}
              </div>

              {/* Custom Windows Editor */}
              {isScheduleEditorOpen && currentMode === 'custom_windows' && (
                <div className="mt-3 border-t border-ink/10 pt-3">
                  <p className="mb-2 text-3xs text-ink/60">{sCopy.customWindowHint}</p>
                  <AvailableWindowsEditor
                    windows={customWindows}
                    onChange={handleCustomWindowsChange}
                  />
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="mt-5 flex justify-end border-t border-ink/10 pt-3.5">
              <button
                type="button"
                onClick={closeLifestyleModal}
                className="rounded-full bg-ink px-5 py-2 text-xs font-semibold text-white transition-colors hover:bg-ink/90 cursor-pointer"
              >
                {locale === 'ar' ? 'تم' : 'Done'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
