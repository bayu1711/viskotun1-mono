'use client';

import React, { useMemo, useState } from 'react';
import { useRoutine } from '../../contexts/RoutineContext';
import { COPY } from '../../data/copy';
import { SAMPLE_PAPERS, type SamplePaper } from '../../data/samplePapers';
import { TrendingPaperCard } from './TrendingPaperCard';
import { VersionHistoryModal } from './VersionHistoryModal';

export function TrendingPapersExplore() {
  const { samplePapers, trendingPapers } = useRoutine();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewingVersionPaper, setViewingVersionPaper] = useState<SamplePaper | null>(null);

  const availablePapers: SamplePaper[] = useMemo(() => {
    const list = trendingPapers || samplePapers;
    return list && list.length > 0 ? list : SAMPLE_PAPERS;
  }, [trendingPapers, samplePapers]);

  const filteredPapers = useMemo(() => {
    return availablePapers.filter((paper) => {
      if (paper.isGuardrailRejectionTest) return false;
      if (selectedCategory !== 'all' && paper.category !== selectedCategory) return false;
      return true;
    });
  }, [availablePapers, selectedCategory]);

  return (
    <div className="mt-5 space-y-6">
      {/* Intro Subtitle */}
      <div className="max-w-3xl space-y-3">
        <p className="text-base leading-relaxed text-ink/70">
          {COPY.howTo.trendingSubtitle}
        </p>

        {selectedCategory !== 'all' && (
          <div className="flex items-center gap-1.5 pt-1 text-2xs">
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

      {/* Grid of Trending Paper Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredPapers.map((paper, index) => (
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
    </div>
  );
}
