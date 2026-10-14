import React from 'react';
import { DropOffPanel } from '../components/community/DropOffPanel';
import { EfficacyCard } from '../components/community/EfficacyCard';
import { ReviewsPanel } from '../components/community/ReviewsPanel';
import { PageContainer } from '../components/layout/PageContainer';
import { PageHeader } from '../components/layout/PageHeader';
import { useProtocol } from '../contexts/ProtocolContext';
import { COPY } from '../data/copy';

export function CommunityPage() {
  const { protocol } = useProtocol();
  const insights = protocol.community;

  return (
    <PageContainer>
      <PageHeader eyebrow={COPY.community.eyebrow} title={COPY.community.title} />

      <section aria-label={COPY.community.comparisonLabel} className="mt-6 grid grid-cols-2 gap-2.5">
        <EfficacyCard
          tone="cream"
          label={COPY.community.studyEfficacy}
          value={insights.studyEfficacy}
          caption={COPY.community.studyCaption(protocol.paper.sampleSize)} />
        
        <EfficacyCard
          tone="mint"
          label={COPY.community.realWorldEfficacy}
          value={insights.realWorldEfficacy}
          caption={COPY.community.realWorldCaption(insights.userCount.toLocaleString())} />
        
      </section>

      <div className="mt-2.5 grid grid-cols-1 gap-2.5 lg:grid-cols-split">
        <DropOffPanel />
        <ReviewsPanel />
      </div>
    </PageContainer>);

}