'use client';

import React, { useId } from 'react';
import NorthEastIcon from '@mui/icons-material/NorthEast';
import { Callout } from '../components/feedback/Callout';
import { PageContainer } from '../components/layout/PageContainer';
import { PageHeader } from '../components/layout/PageHeader';
import { DayActions } from '../components/protocol/DayActions';
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
import { useRoutine } from '../contexts/RoutineContext';
import { COPY } from '../data/copy';
import { ROUTES } from '../data/navigation';
import { stopRuleOf } from '../utils/routineMetrics';

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
    hasHydrated
  } = useRoutine();
  const historyHeadingId = useId();
  const feedbackHeadingId = useId();

  const activeVoiceSteps = React.useMemo(
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
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-main-aside lg:gap-10">
        <div>
          <PageHeader eyebrow={COPY.routine.eyebrow(currentDay, totalDays)} title={COPY.routine.title(todayPercent)}>
            <DailyProgressBar fraction={todayFraction} percent={todayPercent} />
          </PageHeader>

          <div className="mt-5 space-y-2.5">
            <MilestoneBanner />
            {escalationPaused && (
              <Callout tone="blush" role="alert">
                {COPY.safety.dynamicEscalationAlert(feedbackMetric.name, feedbackMetric.escalationMessage)}
              </Callout>
            )}
            <VoiceCoachBar
              steps={activeVoiceSteps}
              safetyRule={stopRule?.text}
              onStepComplete={(stepIndex) => {
                const step = activeVoiceSteps[stepIndex];
                if (step) {
                  incrementSet(step.id);
                }
              }}
            />
          </div>

          <TaskGrid steps={routine.steps} />
          <DayActions className="mt-2.5" />

          {stopRule && (
            <p className="mt-4 px-1 text-sm text-ink/60">
              {COPY.common.warningPrefix} {stopRule.text}
            </p>
          )}
        </div>

        <aside className="space-y-2.5">
          <Panel aria-labelledby={historyHeadingId}>
            <SectionHeading
              id={historyHeadingId}
              eyebrow={COPY.routine.historyEyebrow}
              title={COPY.routine.historyTitle}
              action={
                <CircleButton label={COPY.routine.openDashboard} href={ROUTES.dashboard}>
                  <Icon icon={NorthEastIcon} size="md" />
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
              eyebrow={COPY.routine.metricEyebrow(feedbackMetric.eyebrow ?? feedbackMetric.name)}
              title={COPY.routine.metricTitle(feedbackMetric.logTitle)}
            />
            <FeedbackLogList />
          </Panel>
        </aside>
      </div>
    </PageContainer>
  );
}