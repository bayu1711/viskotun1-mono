'use client';

import React from 'react';
import { KeyMetrics } from '../components/dashboard/KeyMetrics';
import { PapersPanel } from '../components/dashboard/PapersPanel';
import { PhysicianSummaryPanel } from '../components/dashboard/PhysicianSummaryPanel';
import { ProgressionPanel } from '../components/dashboard/ProgressionPanel';
import { PageContainer } from '../components/layout/PageContainer';
import { PageHeader } from '../components/layout/PageHeader';
import { COPY } from '../data/copy';

interface DashboardPageProps {
  simulateExportFailure?: boolean;
}

export function DashboardPage({ simulateExportFailure = false }: DashboardPageProps) {
  return (
    <PageContainer>
      <PageHeader eyebrow={COPY.dashboard.eyebrow} title={COPY.dashboard.title} />
      <KeyMetrics />
      <div className="mt-2.5 grid grid-cols-1 gap-2.5 lg:grid-cols-main-aside">
        <PapersPanel />
        <aside className="space-y-2.5">
          <ProgressionPanel />
          <PhysicianSummaryPanel simulateFailure={simulateExportFailure} />
        </aside>
      </div>
    </PageContainer>
  );
}