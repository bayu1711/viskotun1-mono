'use client';

import React from 'react';
import { BiomarkerTrendChart } from '../components/dashboard/BiomarkerTrendChart';
import { KeyMetrics } from '../components/dashboard/KeyMetrics';
import { MilestonePhotoComparison } from '../components/dashboard/MilestonePhotoComparison';
import { PapersPanel } from '../components/dashboard/PapersPanel';
import { ProgressionPanel } from '../components/dashboard/ProgressionPanel';
import { ShareableSummaryPanel } from '../components/dashboard/ShareableSummaryPanel';
import { PageContainer } from '../components/layout/PageContainer';
import { PageHeader } from '../components/layout/PageHeader';
import { useProtocol } from '../contexts/ProtocolContext';
import { COPY } from '../data/copy';

export function DashboardPage() {
  const { protocol } = useProtocol();
  const hasPhotoField = protocol.dataCollectionSpec?.some((f) => f.type === 'photo');

  return (
    <PageContainer>
      <PageHeader eyebrow={COPY.dashboard.eyebrow} title={COPY.dashboard.title} />
      <KeyMetrics />
      <div className="mt-2.5 grid grid-cols-1 gap-2.5 lg:grid-cols-main-aside">
        <div className="space-y-2.5">
          {hasPhotoField ? <MilestonePhotoComparison /> : <BiomarkerTrendChart />}
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