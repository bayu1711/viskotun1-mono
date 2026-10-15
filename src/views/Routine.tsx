'use client';

import React, { useId } from 'react';
import NorthEastIcon from '@mui/icons-material/NorthEast';
import { Callout } from '../components/feedback/Callout';
import { PageContainer } from '../components/layout/PageContainer';
import { PageHeader } from '../components/layout/PageHeader';
import { DayActions } from '../components/protocol/DayActions';
import { MissingDataBanner } from '../components/protocol/MissingDataBanner';
import { DailyProgressBar } from '../components/routine/DailyProgressBar';
import { HistoryCalendar } from '../components/routine/HistoryCalendar';
import { PainLogList } from '../components/routine/PainLogList';
import { TaskGrid } from '../components/routine/TaskGrid';
import { CircleButton } from '../components/ui/CircleButton';
import { Icon } from '../components/ui/Icon';
import { Panel } from '../components/ui/Panel';
import { SectionHeading } from '../components/ui/SectionHeading';
import { useProtocol } from '../contexts/ProtocolContext';
import { COPY } from '../data/copy';
import { ROUTES } from '../data/navigation';
import { stopRuleOf } from '../utils/protocolMetrics';

export function RoutinePage() {
  const { protocol, currentDay, totalDays, todayPercent, todayFraction, escalationPaused, openPainLog } = useProtocol();
  const historyHeadingId = useId();
  const painHeadingId = useId();
  const stopRule = stopRuleOf(protocol);

  return (
    <PageContainer>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-main-aside lg:gap-10">
        <div>
          <PageHeader eyebrow={COPY.routine.eyebrow(currentDay, totalDays)} title={COPY.routine.title(todayPercent)}>
            <DailyProgressBar fraction={todayFraction} percent={todayPercent} />
          </PageHeader>

          <div className="mt-5 space-y-2.5">
            <MissingDataBanner />
            {escalationPaused && (
              <Callout tone="blush" role="alert">
                {COPY.safety.escalationAlert}
              </Callout>
            )}
          </div>

          <TaskGrid steps={protocol.steps} />
          <DayActions className="mt-2.5" onLogPain={openPainLog} />

          {stopRule && (
            <p className="mt-4 px-1 text-sm lowercase text-ink/45">
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

          <Panel aria-labelledby={painHeadingId}>
            <SectionHeading id={painHeadingId} eyebrow={COPY.routine.painEyebrow} title={COPY.routine.painTitle} />
            <PainLogList />
          </Panel>
        </aside>
      </div>
    </PageContainer>
  );
}