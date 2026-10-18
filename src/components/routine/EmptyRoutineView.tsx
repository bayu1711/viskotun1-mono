'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import UploadFileOutlinedIcon from '@mui/icons-material/UploadFileOutlined';
import { useAssistant } from '../../contexts/AssistantContext';
import { useRoutine } from '../../contexts/RoutineContext';
import { COPY } from '../../data/copy';
import { ROUTES } from '../../data/navigation';
import { SAMPLE_PAPERS, type SamplePaper } from '../../data/samplePapers';
import { TrendingPaperCard } from '../community/TrendingPaperCard';
import { VersionHistoryModal } from '../community/VersionHistoryModal';
import { PageContainer } from '../layout/PageContainer';
import { PageHeader } from '../layout/PageHeader';
import { Icon } from '../ui/Icon';

export function EmptyRoutineView() {
  const { trendingPapers, samplePapers } = useRoutine();
  const { openAssistant } = useAssistant();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewingVersionPaper, setViewingVersionPaper] = useState<SamplePaper | null>(null);

  const availablePapers: SamplePaper[] = useMemo(() => {
    const list = trendingPapers || samplePapers;
    return list && list.length > 0 ? list : SAMPLE_PAPERS;
  }, [trendingPapers, samplePapers]);

  const topTrending = useMemo(() => {
    return availablePapers
      .filter((p) => {
        if (p.isGuardrailRejectionTest) return false;
        if (!(p.routineId || p.protocolId)) return false;
        if (selectedCategory !== 'all' && p.category !== selectedCategory) return false;
        return true;
      })
      .slice(0, 3);
  }, [availablePapers, selectedCategory]);

  const handleOpenUpload = () => {
    openAssistant('upload');
  };

  return (
    <PageContainer>
      <PageHeader
        eyebrow={COPY.onboarding.welcomeEyebrow}
        title={COPY.onboarding.welcomeTitle}
      />

      <div className="mt-5 max-w-3xl space-y-6">
        <p className="text-base leading-relaxed text-ink/70">
          {COPY.onboarding.welcomeSubtitle}
        </p>

        {/* Drag & Drop Prompt Card */}
        <div
          onClick={handleOpenUpload}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleOpenUpload();
            }
          }}
          className="group cursor-pointer rounded-sheet border-2 border-dashed border-ink/20 bg-white/70 p-8 text-center transition-all hover:border-ink hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/30"
        >
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-canvas text-ink/70 transition-transform group-hover:scale-105">
            <Icon icon={UploadFileOutlinedIcon} size="lg" />
          </div>
          <h3 className="mt-4 text-base font-medium text-ink">
            {COPY.onboarding.dropPrompt}
          </h3>
          <p className="mx-auto mt-1 max-w-md text-xs text-ink/60">
            {COPY.onboarding.dropSubtext}
          </p>
        </div>
      </div>

      {/* Quick Trending Paper Starters */}
      <div className="mt-8 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="space-y-2">
            <h3 className="text-xs font-medium text-ink/70">
              {COPY.onboarding.trendingHeading}
            </h3>
            {selectedCategory !== 'all' && (
              <div className="flex items-center gap-1.5 text-2xs">
                <span className="text-ink/60">{COPY.howTo.filterByTopic}</span>
                <button
                  type="button"
                  onClick={() => setSelectedCategory('all')}
                  className="relative inline-flex items-center gap-1 rounded-full bg-ink px-2.5 py-0.5 font-medium text-white transition-opacity hover:opacity-90 before:absolute before:-inset-y-3 before:inset-x-0"
                  title={COPY.howTo.clearFilter}
                >
                  <span>{selectedCategory}</span>
                  <span className="text-white/80">×</span>
                </button>
              </div>
            )}
          </div>
          <Link
            href={`${ROUTES.community}?tab=explore`}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-ink/20 bg-cream/70 px-3 text-xs font-medium text-ink transition-colors hover:border-ink hover:bg-mint"
          >
            <Icon icon={TrendingUpIcon} size="xs" />
            <span>{COPY.howTo.buttonExploreSamples}</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {topTrending.map((paper, index) => (
            <TrendingPaperCard
              key={paper.id}
              paper={paper}
              rank={paper.trendingRank ?? index + 1}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              onViewVersionHistory={setViewingVersionPaper}
            />
          ))}
        </div>
      </div>

      <VersionHistoryModal
        isOpen={Boolean(viewingVersionPaper)}
        onClose={() => setViewingVersionPaper(null)}
        paperTitle={
          viewingVersionPaper?.title ||
          viewingVersionPaper?.shortTitle ||
          COPY.community.defaultProtocolTitle
        }
        currentVersion={viewingVersionPaper?.version || '1.0'}
        changelog={viewingVersionPaper?.changelog || []}
      />
    </PageContainer>
  );
}
