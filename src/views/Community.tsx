'use client';

import React from 'react';
import { DropOffPanel } from '../components/community/DropOffPanel';
import { EfficacyCard } from '../components/community/EfficacyCard';
import { ReviewsPanel } from '../components/community/ReviewsPanel';
import { PageContainer } from '../components/layout/PageContainer';
import { PageHeader } from '../components/layout/PageHeader';
import { useAssistant } from '../contexts/AssistantContext';
import { useProtocol } from '../contexts/ProtocolContext';
import { COPY } from '../data/copy';
import { PillButton } from '../components/ui/PillButton';

export function CommunityPage() {
  const { protocol, openHowTo } = useProtocol();
  const { openAssistant } = useAssistant();

  if (!protocol) {
    return (
      <PageContainer>
        <PageHeader eyebrow={COPY.nav.community} title={COPY.nav.community} />
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

  const insights = protocol.community;

  return (
    <PageContainer>
      <PageHeader eyebrow={COPY.community.eyebrow} title={COPY.community.title} />

      <section aria-label={COPY.community.comparisonLabel} className="mt-6 grid grid-cols-2 gap-2.5">
        <EfficacyCard
          tone="cream"
          label={COPY.community.studyEfficacy}
          value={insights.studyEfficacy}
          caption={COPY.community.studyCaption(protocol.paper.sampleSize)}
        />
        <EfficacyCard
          tone="mint"
          label={COPY.community.realWorldEfficacy}
          value={insights.realWorldEfficacy}
          caption={COPY.community.realWorldCaption(insights.userCount.toLocaleString())}
        />
      </section>

      <div className="mt-2.5 grid grid-cols-1 gap-2.5 lg:grid-cols-split">
        <DropOffPanel />
        <ReviewsPanel />
      </div>
    </PageContainer>
  );
}