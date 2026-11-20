'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import PublicOutlinedIcon from '@mui/icons-material/PublicOutlined';
import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined';
import ScheduleOutlinedIcon from '@mui/icons-material/ScheduleOutlined';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import { useAssistant } from '../../contexts/AssistantContext';
import { useLocale } from '../../contexts/LocaleContext';
import { useRoutine } from '../../contexts/RoutineContext';
import { ROUTES } from '../../data/navigation';
import type { AvailableTimeWindow, RoutineScheduleMode } from '../../types/schedule';
import { cn } from '../../utils/cn';
import {
  DEFAULT_AVAILABLE_WINDOWS,
  evaluateRoutineScheduleCompatibility,
  formatAvailabilitySummary,
  normalizeAvailableWindows,
  resolveProfileAvailability
} from '../../utils/schedule';
import { AvailableWindowsEditor } from '../ui/AvailableWindowsEditor';
import { Icon } from '../ui/Icon';

/**
 * Surfaces the guardrail-validated Global AI Lifestyle Adaptation spec & per-routine schedule controls on /routine,
 * mirroring how extracted paper methods adapt the routine view dynamically.
 */
export function AdaptiveLifestyleBanner({ className }: { className?: string }) {
  const {
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
  const pCopy = copy.profile;

  const [isScheduleEditorOpen, setIsScheduleEditorOpen] = useState(false);

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
      : profileAvail.windows.length > 0
        ? profileAvail.windows
        : [...DEFAULT_AVAILABLE_WINDOWS];

  const handleModeSelect = (mode: RoutineScheduleMode) => {
    if (mode === 'custom_windows') {
      setRoutineSchedule({
        mode: 'custom_windows',
        customWindows: normalizeAvailableWindows(customWindows)
      });
    } else {
      setRoutineSchedule({ mode });
    }
  };

  const handleCustomWindowsChange = (next: AvailableTimeWindow[]) => {
    setRoutineSchedule({
      mode: 'custom_windows',
      customWindows: next
    });
  };

  if (!activeAdaptation && !isAdaptingLifestyle && !compatibility) return null;

  const scheduleSummaryPill = formatAvailabilitySummary(userProfile, routineSchedule, locale);
  const hasConflict = compatibility?.status === 'conflict';

  return (
    <section
      dir={isRtl ? 'rtl' : 'ltr'}
      aria-label="Adaptive Lifestyle Context"
      className={cn(
        'rounded-card border p-3.5 sm:p-4 transition-colors',
        hasConflict ? 'border-orange/40 bg-orange/10' : 'border-ink/15 bg-cream/65',
        className
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {activeAdaptation?.regionLabel && (
            <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-0.5 text-3xs font-semibold text-ink border border-ink/10">
              <Icon icon={PublicOutlinedIcon} size="xs" />
              <span>{activeAdaptation.regionLabel}</span>
            </span>
          )}

          <button
            type="button"
            onClick={() => setIsScheduleEditorOpen((prev) => !prev)}
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-3xs font-semibold text-ink transition-colors cursor-pointer',
              hasConflict
                ? 'border border-orange/50 bg-white text-ink hover:border-ink'
                : 'bg-mint/50 hover:bg-mint'
            )}
            title={sCopy.routineOverrideTitle}
          >
            <Icon icon={hasConflict ? WarningAmberOutlinedIcon : ScheduleOutlinedIcon} size="xs" />
            <span>
              {hasConflict
                ? sCopy.statusBadges.conflict
                : routineSchedule?.mode === 'anytime'
                  ? sCopy.modeLabels.anytime
                  : scheduleSummaryPill || activeAdaptation?.suggestedWindow}
            </span>
          </button>

          {activeAdaptation?.guardrailVerified && (
            <span
              title={activeAdaptation.safetyGuardrailNote}
              className="inline-flex items-center gap-1 rounded-full border border-ink/15 bg-white/80 px-2 py-0.5 text-3xs font-medium text-ink/75"
            >
              <Icon icon={VerifiedUserOutlinedIcon} size="xs" />
              <span>
                {locale === 'ar' ? 'موثق بضوابط السلامة' : 'Guardrail verified'}
              </span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => refreshLifestyleAdaptation()}
            disabled={isAdaptingLifestyle}
            title={locale === 'ar' ? 'تحديث التكييف الذكي' : 'Refresh AI adaptation'}
            aria-label="Refresh AI lifestyle adaptation"
            className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-ink/15 bg-white text-ink/70 hover:border-ink hover:text-ink disabled:opacity-40 cursor-pointer"
          >
            <Icon icon={RefreshOutlinedIcon} size="xs" className={isAdaptingLifestyle ? 'animate-spin' : ''} />
          </button>

          <button
            type="button"
            onClick={() => setIsScheduleEditorOpen((prev) => !prev)}
            className={cn(
              'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-3xs font-semibold transition-colors cursor-pointer',
              isScheduleEditorOpen
                ? 'border-ink bg-ink text-white'
                : 'border-ink/15 bg-white text-ink hover:border-ink'
            )}
          >
            <Icon icon={ScheduleOutlinedIcon} size="xs" />
            <span>{locale === 'ar' ? 'الجدول' : 'Schedule'}</span>
          </button>

          <button
            type="button"
            onClick={openLifestyleTuning}
            className="inline-flex items-center gap-1 rounded-full border border-ink/15 bg-white px-2.5 py-1 text-3xs font-semibold text-ink hover:border-ink cursor-pointer"
          >
            <Icon icon={AutoAwesomeOutlinedIcon} size="xs" />
            <span>{locale === 'ar' ? 'تعديل' : 'Tune'}</span>
          </button>

          <Link
            href={`${ROUTES.profile}?tab=lifestyle`}
            className="inline-flex items-center rounded-full border border-ink/15 bg-white px-2.5 py-1 text-3xs font-semibold text-ink hover:border-ink"
          >
            {locale === 'ar' ? 'الملف' : 'Profile'}
          </Link>
        </div>
      </div>

      {hasConflict && compatibility && (
        <p className="mt-2 text-xs leading-relaxed text-ink">
          <span className="font-semibold">{sCopy.statusBadges.conflict}: </span>
          {compatibility.explanation}
        </p>
      )}

      {!hasConflict && activeAdaptation && (
        <div className="mt-2">
          <p className="text-xs font-semibold text-ink">{activeAdaptation.bannerTitle}</p>
          <p className="mt-0.5 text-xs leading-relaxed text-ink/75">{activeAdaptation.bannerGuidance}</p>
        </div>
      )}

      {isScheduleEditorOpen && (
        <div className="mt-3 space-y-2.5 rounded-xl border border-ink/15 bg-white/90 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-2xs font-semibold text-ink">{sCopy.routineOverrideTitle}</span>
            <div className="flex flex-wrap gap-1">
              {(['profile_windows', 'anytime', 'custom_windows'] as const).map((modeOption) => (
                <button
                  key={modeOption}
                  type="button"
                  onClick={() => handleModeSelect(modeOption)}
                  className={cn(
                    'rounded-full border px-2.5 py-1 text-3xs font-medium transition-colors cursor-pointer',
                    currentMode === modeOption
                      ? 'border-ink bg-ink text-white'
                      : 'border-ink/15 bg-canvas text-ink/80 hover:border-ink'
                  )}
                >
                  {sCopy.modeLabels[modeOption]}
                </button>
              ))}
            </div>
          </div>

          {currentMode === 'custom_windows' && (
            <AvailableWindowsEditor
              windows={customWindows}
              onChange={handleCustomWindowsChange}
              presets={pCopy.availabilityPresets}
              addLabel={pCopy.addWindowBtn}
              labelPlaceholder={pCopy.windowLabelPlaceholder}
              removeAria={pCopy.removeWindowAria}
              compact
            />
          )}

          <p className="text-3xs text-ink/60">{sCopy.customWindowHint}</p>
        </div>
      )}
    </section>
  );
}
