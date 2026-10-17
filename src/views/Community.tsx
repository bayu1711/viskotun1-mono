'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import BarChartOutlinedIcon from '@mui/icons-material/BarChartOutlined';
import { DropOffPanel } from '../components/community/DropOffPanel';
import { EfficacyCard } from '../components/community/EfficacyCard';
import { ReviewsPanel } from '../components/community/ReviewsPanel';
import { TrendingPapersExplore } from '../components/community/TrendingPapersExplore';
import { PageContainer } from '../components/layout/PageContainer';
import { PageHeader } from '../components/layout/PageHeader';
import { Icon } from '../components/ui/Icon';
import { useRoutine } from '../contexts/RoutineContext';
import { COPY } from '../data/copy';
import type { CommunityInsights } from '../types/routine';

export function CommunityPage() {
  const { routine } = useRoutine();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');

  const [activeTab, setActiveTab] = useState<'active' | 'explore'>(() => {
    if (tabParam === 'explore' || !routine) return 'explore';
    return 'active';
  });

  // Sync tab with URL search parameter if user navigates via link
  useEffect(() => {
    if (tabParam === 'explore') {
      setActiveTab('explore');
    }
  }, [tabParam]);

  // If there's no active routine, default to explore
  useEffect(() => {
    if (!routine && activeTab !== 'explore') {
      setActiveTab('explore');
    }
  }, [routine, activeTab]);

  const [liveMetrics, setLiveMetrics] = useState<CommunityInsights | null>(
    routine?.community || null
  );

  const routineId = routine?.id;
  const routineCommunity = routine?.community;

  useEffect(() => {
    let isMounted = true;
    if (!routineId) return;

    setLiveMetrics(routineCommunity || null);

    async function fetchLiveMetrics() {
      try {
        const res = await fetch(`/api/community/metrics?routineId=${encodeURIComponent(routineId!)}`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.metrics) {
            setLiveMetrics((prev) => ({
              ...(prev || routineCommunity || null),
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
  }, [routineId, routineCommunity]);

  const insights = liveMetrics || routine?.community;

  // Header switcher button right beside the Routine Switcher dropdown
  const switcherAction = routine ? (
    activeTab === 'explore' ? (
      <button
        type="button"
        onClick={() => setActiveTab('active')}
        className="inline-flex items-center gap-1.5 rounded-full border border-ink/20 bg-cream/70 px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:border-ink hover:bg-mint"
      >
        <Icon icon={BarChartOutlinedIcon} size="xs" />
        <span>{COPY.community.activeTab}</span>
      </button>
    ) : (
      <button
        type="button"
        onClick={() => setActiveTab('explore')}
        className="inline-flex items-center gap-1.5 rounded-full border border-ink/20 bg-cream/70 px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:border-ink hover:bg-mint"
      >
        <Icon icon={AutoAwesomeOutlinedIcon} size="xs" />
        <span>{COPY.howTo.buttonExploreSamples}</span>
      </button>
    )
  ) : (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-ink/20 bg-mint/40 px-3 py-1.5 text-xs font-semibold text-ink">
      <Icon icon={AutoAwesomeOutlinedIcon} size="xs" />
      <span>{COPY.howTo.buttonExploreSamples}</span>
    </span>
  );

  const isExplore = activeTab === 'explore' || !routine;

  return (
    <PageContainer>
      <PageHeader
        eyebrow={isExplore ? COPY.howTo.eyebrow : COPY.community.eyebrow}
        title={isExplore ? COPY.howTo.trendingTitle : COPY.community.title}
        switcherExtra={switcherAction}
      />

      {isExplore ? (
        <TrendingPapersExplore />
      ) : (
        <>
          {/* Canonical Paper Deduplication & Shared Community Badge */}
          <div className="mt-2 flex items-center gap-2 text-xs text-ink/60">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-mint/30 px-2.5 py-0.5 font-medium text-ink">
              <span className="h-1.5 w-1.5 rounded-full bg-mint ring-1 ring-ink/20" />
              {COPY.community.canonicalPaperBadge}
            </span>
            {routine?.paper?.doi ? (
              <span className="font-mono text-ink/50">DOI: {routine.paper.doi}</span>
            ) : (
              <span className="text-ink/40">{routine?.title}</span>
            )}
          </div>

          {insights && (
            <section aria-label={COPY.community.comparisonLabel} className="mt-6 grid grid-cols-2 gap-2.5">
              <EfficacyCard
                tone="cream"
                label={COPY.community.studyEfficacy}
                value={insights.studyEfficacy}
                caption={COPY.community.studyCaption(routine?.paper?.sampleSize || 120)}
              />
              <EfficacyCard
                tone="mint"
                label={COPY.community.realWorldEfficacy}
                value={insights.realWorldEfficacy}
                caption={COPY.community.realWorldCaption((insights.userCount || 100).toLocaleString())}
              />
            </section>
          )}

          <div className="mt-2.5 grid grid-cols-1 gap-2.5 lg:grid-cols-split">
            <DropOffPanel />
            <ReviewsPanel />
          </div>
        </>
      )}
    </PageContainer>
  );
}