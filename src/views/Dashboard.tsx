'use client';

import React from 'react';
import { BiomarkerTrendChart } from '../components/dashboard/BiomarkerTrendChart';
import { HealthAgeCard } from '../components/dashboard/HealthAgeCard';
import { KeyMetrics } from '../components/dashboard/KeyMetrics';
import { MilestonePhotoComparison } from '../components/dashboard/MilestonePhotoComparison';
import { PapersPanel } from '../components/dashboard/PapersPanel';
import { ProgressionPanel } from '../components/dashboard/ProgressionPanel';
import { ShareableSummaryPanel } from '../components/dashboard/ShareableSummaryPanel';
import { PageContainer } from '../components/layout/PageContainer';
import { PageHeader } from '../components/layout/PageHeader';
import { EmptyRoutineView } from '../components/routine/EmptyRoutineView';
import { useRoutine } from '../contexts/RoutineContext';
import { useLocale } from '../contexts/LocaleContext';
export function DashboardPage() {
  const { copy } = useLocale();
  const { routine, hasHydrated } = useRoutine();

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

  const hasPhotoField = routine.dataCollectionSpec?.some((f) => f.type === 'photo');
  const hasBiomarkerField = routine.dataCollectionSpec?.some(
    (f) => f.type === 'scale' || f.type === 'numeric' || f.type === 'timer'
  );

  return (
    <PageContainer>
      <PageHeader eyebrow={copy.dashboard.eyebrow} title={copy.dashboard.title} />
      <KeyMetrics />
      <div className="mt-2.5 grid grid-cols-1 gap-2.5 xl:grid-cols-main-aside">
        <div className="space-y-2.5">
          <HealthAgeCard />
          {hasBiomarkerField && <BiomarkerTrendChart />}
          {hasPhotoField && <MilestonePhotoComparison />}
          {!hasBiomarkerField && !hasPhotoField && <BiomarkerTrendChart />}
          <PapersPanel />
        </div>
        <aside className="space-y-2.5">
          <ProgressionPanel />
          <ShareableSummaryPanel />
        </aside>
      </div>
    </PageContainer>
  );
}