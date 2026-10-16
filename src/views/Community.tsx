'use client';

import React, { useEffect, useState } from 'react';
import { DropOffPanel } from '../components/community/DropOffPanel';
import { EfficacyCard } from '../components/community/EfficacyCard';
import { ReviewsPanel } from '../components/community/ReviewsPanel';
import { PageContainer } from '../components/layout/PageContainer';
import { PageHeader } from '../components/layout/PageHeader';
import { useAssistant } from '../contexts/AssistantContext';
import { useRoutine } from '../contexts/RoutineContext';
import { COPY } from '../data/copy';
import { PillButton } from '../components/ui/PillButton';
import type { CommunityInsights } from '../types/routine';

export function CommunityPage() {
  const { routine, openHowTo } = useRoutine();
  const { openAssistant } = useAssistant();
  const [liveMetrics, setLiveMetrics] = useState<CommunityInsights | null>(
    routine?.community || null
  );

  useEffect(() => {
    let isMounted = true;
    if (!routine?.id) return;

    setLiveMetrics(routine.community);

    async function fetchLiveMetrics() {
      try {
        const res = await fetch(`/api/community/metrics?routineId=${encodeURIComponent(routine.id)}`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.metrics) {
            setLiveMetrics((prev) => ({
              ...(prev || routine.community),
              ...data.metrics
            }));
          }
        }
      } catch (err) {
        console.warn('[CommunityPage] Failed to fetch live metrics, using baseline:', err);
      }
    }

    fetchLiveMetrics();

    return () => {
      isMounted = false;
    };
  }, [routine?.id, routine?.community]);

  if (!routine) {
    return (
      <PageContainer>
        <PageHeader eyebrow={COPY.nav.community} title={COPY.nav.community} />
        <div className="mt-8 rounded-card border border-ink/10 bg-white p-8 text-center max-w-md mx-auto space-y-4">
          <p className="text-sm font-medium text-ink">{COPY.onboarding.noActiveRoutine}</p>
          <p className="text-xs text-ink/65 leading-relaxed">
            {COPY.onboarding.noActiveRoutineDesc}
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

  const insights = liveMetrics || routine.community;

  return (
    <PageContainer>
      <PageHeader eyebrow={COPY.community.eyebrow} title={COPY.community.title} />

      {/* Canonical Paper Deduplication & Shared Community Badge */}
      <div className="mt-2 flex items-center gap-2 text-xs text-ink/60">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-mint/30 px-2.5 py-0.5 font-medium text-ink">
          <span className="h-1.5 w-1.5 rounded-full bg-mint ring-1 ring-ink/20" />
          {COPY.community.canonicalPaperBadge}
        </span>
        {routine.paper?.doi ? (
          <span className="font-mono text-ink/50">DOI: {routine.paper.doi}</span>
        ) : (
          <span className="text-ink/40">{routine.title}</span>
        )}
      </div>

      <section aria-label={COPY.community.comparisonLabel} className="mt-6 grid grid-cols-2 gap-2.5">
        <EfficacyCard
          tone="cream"
          label={COPY.community.studyEfficacy}
          value={insights.studyEfficacy}
          caption={COPY.community.studyCaption(routine.paper.sampleSize)}
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