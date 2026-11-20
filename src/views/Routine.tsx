'use client';

import React, { useId, useMemo } from 'react';
import BoltOutlinedIcon from '@mui/icons-material/BoltOutlined';
import FitnessCenterOutlinedIcon from '@mui/icons-material/FitnessCenterOutlined';
import NorthEastIcon from '@mui/icons-material/NorthEast';
import PublicOutlinedIcon from '@mui/icons-material/PublicOutlined';
import ShareOutlinedIcon from '@mui/icons-material/ShareOutlined';
import SpaOutlinedIcon from '@mui/icons-material/SpaOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import { Callout } from '../components/feedback/Callout';
import { PageContainer } from '../components/layout/PageContainer';
import { PageHeader } from '../components/layout/PageHeader';
import { DayActions } from '../components/routine/DayActions';
import { DailyProgressBar } from '../components/routine/DailyProgressBar';
import { FeedbackLogList } from '../components/routine/FeedbackLogList';
import { HistoryCalendar } from '../components/routine/HistoryCalendar';
import { MilestoneBanner } from '../components/routine/MilestoneBanner';
import { TaskGrid } from '../components/routine/TaskGrid';
import { VoiceCoachBar } from '../components/routine/VoiceCoachBar';
import { CircleButton } from '../components/ui/CircleButton';
import { Icon } from '../components/ui/Icon';
import { Panel } from '../components/ui/Panel';
import { SectionHeading } from '../components/ui/SectionHeading';
import { EmptyRoutineView } from '../components/routine/EmptyRoutineView';
import { useLocale } from '../contexts/LocaleContext';
import { useRoutine } from '../contexts/RoutineContext';
import { ROUTES } from '../data/navigation';
import { cn } from '../utils/cn';
import { stopRuleOf } from '../utils/routineMetrics';
import { evaluateRoutineScheduleCompatibility } from '../utils/schedule';

export function RoutinePage() {
  const {
    routine,
    currentDay,
    totalDays,
    todayPercent,
    todayFraction,
    escalationPaused,
    feedbackMetric,
    incrementSet,
    isStepExcluded,
    openShareModal,
    hasHydrated,
    doseMode,
    openDoseModeModal,
    activeAdaptation,
    openLifestyleModal,
    pendingReEntryCheckin,
    userProfile,
    routineSchedule,
    excludedStepIds
  } = useRoutine();
  const { copy } = useLocale();
  const historyHeadingId = useId();
  const feedbackHeadingId = useId();

  const compatibility = useMemo(
    () =>
      routine
        ? evaluateRoutineScheduleCompatibility(routine, userProfile, routineSchedule, excludedStepIds)
        : activeAdaptation?.scheduleCompatibility,
    [routine, userProfile, routineSchedule, excludedStepIds, activeAdaptation?.scheduleCompatibility]
  );
  const hasConflict = compatibility?.status === 'conflict';

  const activeVoiceSteps = useMemo(
    () => routine?.steps.filter((s) => !isStepExcluded(s.id)) ?? [],
    [routine?.steps, isStepExcluded]
  );

  if (!hasHydrated) {
    return (
      <PageContainer>
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-ink border-t-transparent" />
        </div>
      </PageContainer>
    );
  }

  if (!routine) {
    return <EmptyRoutineView />;
  }

  const stopRule = stopRuleOf(routine);

  return (
    <PageContainer>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-main-aside xl:gap-10">
        <div>
          <PageHeader
            eyebrow={copy.routine.eyebrow(currentDay, totalDays)}
            title={copy.routine.title(todayPercent)}
            switcherExtra={
              <div className="flex flex-wrap items-center gap-2">
                {/* Adaptive Lifestyle & Location Popup Button */}
                <button
                  type="button"
                  onClick={openLifestyleModal}
                  className={cn(
                    'inline-flex min-h-11 items-center gap-1.5 rounded-full border px-3.5 text-xs font-semibold transition-colors cursor-pointer',
                    hasConflict
                      ? 'border-orange/50 bg-orange/10 text-ink hover:bg-orange/20'
                      : 'border-ink/20 bg-cream/70 hover:bg-cream text-ink'
                  )}
                  title={copy.schedule.modalTitle}
                >
                  <Icon
                    icon={hasConflict ? WarningAmberOutlinedIcon : PublicOutlinedIcon}
                    size="xs"
                    className={hasConflict ? 'text-warning' : ''}
                  />
                  <span>{activeAdaptation?.regionLabel || copy.schedule.lifestyleButton}</span>
                  {hasConflict && (
                    <span className="rounded-full bg-orange/20 px-1.5 py-0.5 text-3xs font-bold text-ink">
                      !
                    </span>
                  )}
                </button>

                {/* Today's Dose Mode Popup Button */}
                <button
                  type="button"
                  onClick={openDoseModeModal}
                  className={cn(
                    'inline-flex min-h-11 items-center gap-1.5 rounded-full border px-3.5 text-xs font-semibold transition-colors cursor-pointer',
                    doseMode === 'micro'
                      ? 'border-amber-500/40 bg-amber-500/10 text-ink hover:bg-amber-500/20'
                      : doseMode === 'rest'
                      ? 'border-mint/60 bg-mint/30 text-ink hover:bg-mint/50'
                      : 'border-ink/20 bg-cream/70 hover:bg-cream text-ink'
                  )}
                  title={copy.doseMode.label}
                >
                  <Icon
                    icon={
                      doseMode === 'micro'
                        ? BoltOutlinedIcon
                        : doseMode === 'rest'
                        ? SpaOutlinedIcon
                        : FitnessCenterOutlinedIcon
                    }
                    size="xs"
                    className={
                      doseMode === 'micro'
                        ? 'text-amber-600'
                        : doseMode === 'rest'
                        ? 'text-emerald-700'
                        : ''
                    }
                  />
                  <span>{copy.doseMode[doseMode]}</span>
                  {pendingReEntryCheckin && (
                    <span
                      className="h-2 w-2 rounded-full bg-orange animate-pulse"
                      title={copy.task.pendingCheckinTitle}
                      aria-label={copy.task.pendingCheckinTitle}
                      role="img"
                    />
                  )}
                </button>

                {/* Share Clinical Routine Button */}
                <button
                  type="button"
                  onClick={openShareModal}
                  className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-ink/20 bg-cream/70 hover:bg-cream px-3.5 text-xs font-semibold text-ink transition-colors cursor-pointer"
                  title={copy.shareModal.openShareTitle}
                >
                  <Icon icon={ShareOutlinedIcon} size="xs" />
                  <span>{copy.shareModal.openShareButton}</span>
                </button>
              </div>
            }
          >
            <DailyProgressBar fraction={todayFraction} percent={todayPercent} />
          </PageHeader>

          <div className="mt-5 space-y-2.5">
            <MilestoneBanner />
            {escalationPaused && (
              <Callout tone="blush" role="alert">
                {copy.safety.dynamicEscalationAlert(feedbackMetric.name, feedbackMetric.escalationMessage)}
              </Callout>
            )}
            <VoiceCoachBar
              key={routine.id}
              steps={activeVoiceSteps}
              safetyRule={stopRule?.text}
              isDayComplete={todayFraction >= 1}
              onStepComplete={(stepIndex) => {
                const step = activeVoiceSteps[stepIndex];
                if (step) {
                  incrementSet(step.id);
                }
              }}
            />
          </div>

          {/* Safety is visible (PRODUCT.md): the stop rule sits right above the work, not under it. */}
          {stopRule && !escalationPaused && (
            <Callout
              tone="cream"
              className="mt-5"
              icon={<Icon icon={WarningAmberOutlinedIcon} size="sm" className="mt-0.5 shrink-0" />}
            >
              {stopRule.text}
            </Callout>
          )}

          <div className={stopRule && !escalationPaused ? 'mt-2.5' : 'mt-5'}>
            <TaskGrid steps={routine.steps} />
          </div>
          <DayActions className="mt-2.5" />
        </div>

        <aside className="space-y-2.5">
          <Panel aria-labelledby={historyHeadingId}>
            <SectionHeading
              id={historyHeadingId}
              eyebrow={copy.routine.historyEyebrow}
              title={copy.routine.historyTitle}
              action={
                <CircleButton label={copy.routine.openDashboard} href={ROUTES.dashboard}>
                  <Icon icon={NorthEastIcon} size="md" className="rtl:-scale-x-100" />
                </CircleButton>
              }
            />

            <div className="mt-5">
              <HistoryCalendar />
            </div>
          </Panel>

          <Panel aria-labelledby={feedbackHeadingId}>
            <SectionHeading
              id={feedbackHeadingId}
              eyebrow={copy.routine.metricEyebrow(feedbackMetric.eyebrow ?? feedbackMetric.name)}
              title={copy.routine.metricTitle(feedbackMetric.logTitle)}
            />
            <FeedbackLogList />
          </Panel>
        </aside>
      </div>
    </PageContainer>
  );
}