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
import { useAssistant } from '../contexts/AssistantContext';
import { useProtocol } from '../contexts/ProtocolContext';
import { COPY } from '../data/copy';
import { PillButton } from '../components/ui/PillButton';

export function DashboardPage() {
  const { protocol, openHowTo } = useProtocol();
  const { openAssistant } = useAssistant();

  if (!protocol) {
    return (
      <PageContainer>
        <PageHeader eyebrow={COPY.dashboard.eyebrow} title={COPY.dashboard.title} />
        <div className="mt-8 rounded-card border border-ink/10 bg-white p-8 text-center max-w-md mx-auto space-y-4">
          <p className="text-sm font-medium lowercase text-ink">{COPY.onboarding.noActiveProtocol}</p>
          <p className="text-xs lowercase text-ink/65 leading-relaxed">
            {COPY.onboarding.noActiveProtocolDesc}
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <PillButton size="sm" onClick={openHowTo}>
              {COPY.howTo.buttonShort}
            </PillButton>
            <PillButton size="sm" variant="outline" onClick={() => openAssistant('upload')}>
              {COPY.onboarding.ctaUpload}
            </PillButton>
          </div>
        </div>
      </PageContainer>
    );
  }

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