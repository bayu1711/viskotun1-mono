'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import CheckIcon from '@mui/icons-material/Check';
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import NorthEastIcon from '@mui/icons-material/NorthEast';
import PlayArrowOutlinedIcon from '@mui/icons-material/PlayArrowOutlined';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { toast } from 'sonner';
import { useRoutine } from '../../contexts/RoutineContext';
import { COPY } from '../../data/copy';
import { ROUTES } from '../../data/navigation';
import { PRECALIBRATED_SAMPLE_PROTOCOLS, SAMPLE_PAPERS, type SamplePaper } from '../../data/samplePapers';
import type { StepIconKey } from '../../types/routine';
import { cn } from '../../utils/cn';
import { Icon } from '../ui/Icon';
import { PillButton } from '../ui/PillButton';
import { StepIcon } from '../ui/StepIcon';

export function TrendingPapersExplore() {
  const {
    routine,
    activeRoutineId,
    activeProtocolId,
    loadSampleRoutine,
    loadSampleProtocol,
    samplePapers,
    trendingPapers,
    sampleSource
  } = useRoutine();

  const loadRoutine = loadSampleRoutine || loadSampleProtocol;
  const currentActiveId = routine?.id || activeRoutineId || activeProtocolId;

  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const availablePapers: SamplePaper[] = useMemo(() => {
    const list = trendingPapers || samplePapers;
    return list && list.length > 0 ? list : SAMPLE_PAPERS;
  }, [trendingPapers, samplePapers]);

  // Extract categories for filter
  const categories = useMemo(() => {
    const set = new Set<string>();
    availablePapers.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return ['all', ...Array.from(set)];
  }, [availablePapers]);

  const filteredPapers = useMemo(() => {
    return availablePapers.filter((paper) => {
      if (paper.isGuardrailRejectionTest) return false;
      if (selectedCategory !== 'all' && paper.category !== selectedCategory) return false;
      return true;
    });
  }, [availablePapers, selectedCategory]);

  const getIconForRoutine = (targetId: string): StepIconKey => {
    const matched = PRECALIBRATED_SAMPLE_PROTOCOLS[targetId];
    if (matched?.icon) return matched.icon;
    if (targetId === 'achilles') return 'straight-knee';
    if (targetId === 'hair-loss') return 'serum';
    if (targetId === 'creatine-sleep') return 'sleep';
    if (targetId === 'zone2-cardio') return 'fitness';
    return 'pill';
  };

  const handleStartRoutine = (targetId: string, paperTitle: string) => {
    loadRoutine(targetId);
    toast.success(COPY.howTo.loadedToast(paperTitle));
  };

  return (
    <div className="space-y-6">
      {/* Intro & Source Badge */}
      <div className="rounded-sheet border border-ink/10 bg-white/70 p-5 backdrop-blur-xs sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <h2 className="text-base font-medium text-ink">
              {COPY.howTo.trendingTitle}
            </h2>
            <p className="max-w-2xl text-xs leading-relaxed text-ink/65">
              {COPY.howTo.trendingSubtitle}
            </p>
          </div>

          <span
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-2xs font-medium border',
              sampleSource === 'firestore-live'
                ? 'border-mint/60 bg-mint/20 text-ink'
                : 'border-ink/10 bg-canvas text-ink/60'
            )}
          >
            <span
              className={cn(
                'h-1.5 w-1.5 rounded-full',
                sampleSource === 'firestore-live' ? 'bg-mint ring-1 ring-ink/20' : 'bg-ink/40'
              )}
            />
            {sampleSource === 'firestore-live'
              ? COPY.howTo.firestoreSyncLive
              : COPY.howTo.firestoreSyncLocal}
          </span>
        </div>

        {/* Category Filters */}
        <div className="mt-4 flex flex-wrap items-center gap-1.5 border-t border-ink/10 pt-4">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  'rounded-full px-3 py-1 text-2xs font-medium transition-colors',
                  isSelected
                    ? 'bg-ink text-white shadow-xs'
                    : 'border border-ink/15 bg-white text-ink/65 hover:border-ink/40 hover:text-ink'
                )}
              >
                {cat === 'all' ? 'All research topics' : cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid of Trending Paper Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredPapers.map((paper, index) => {
          const targetId = paper.routineId || paper.protocolId || 'achilles';
          const rank = paper.trendingRank ?? index + 1;
          const trackers = paper.activeTrackersCount;
          const logs = paper.totalLogsCount;
          const isActive = currentActiveId === targetId;

          return (
            <div
              key={paper.id}
              className={cn(
                'flex flex-col justify-between rounded-card border bg-white p-5 transition-all',
                isActive
                  ? 'border-ink shadow-sm ring-1 ring-ink/15'
                  : 'border-ink/10 hover:border-ink/30 hover:shadow-xs'
              )}
            >
              <div>
                {/* Header row: Icon, Rank, Category */}
                <div className="flex items-center justify-between gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-canvas text-ink">
                    <StepIcon icon={getIconForRoutine(targetId)} size="xs" />
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="rounded-full bg-mint/30 border border-mint/60 px-2.5 py-0.5 text-2xs font-semibold text-ink">
                      {COPY.howTo.trendingRankBadge(rank)}
                    </span>
                    <span className="rounded-full bg-canvas px-2.5 py-0.5 text-2xs font-semibold text-ink/70">
                      {paper.category}
                    </span>
                  </div>
                </div>

                {/* Title & Meta */}
                <h3 className="mt-3.5 text-sm font-medium leading-snug text-ink">
                  {paper.shortTitle || paper.title}
                </h3>
                <p className="mt-1 text-2xs text-ink/50 line-clamp-1">
                  {paper.authors} · <em>{paper.journal}</em> ({paper.year})
                </p>

                {/* Summary */}
                <p className="mt-2 text-xs leading-relaxed text-ink/65 line-clamp-3">
                  {paper.summary}
                </p>

                {/* Trial Endpoints / Features Tested */}
                {paper.featuresTested && paper.featuresTested.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {paper.featuresTested.slice(0, 2).map((feat, i) => (
                      <span
                        key={i}
                        className="rounded bg-canvas px-2 py-0.5 text-3xs font-medium text-ink/65"
                      >
                        {feat}
                      </span>
                    ))}
                  </div>
                )}

                {/* Community Telemetry Badges */}
                <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-ink/5 pt-2 text-2xs text-ink/50">
                  <span>{COPY.howTo.activeTrackersBadge(trackers ?? 0)}</span>
                  <span>·</span>
                  <span>{COPY.howTo.totalLogsBadge(logs ?? 0)}</span>
                </div>
              </div>

              {/* Bottom Actions: Start Routine Button & External Links */}
              <div className="mt-4 border-t border-ink/10 pt-3.5 space-y-2">
                <div className="flex items-center gap-2">
                  <PillButton
                    size="sm"
                    variant={isActive ? 'outline' : 'primary'}
                    onClick={() => handleStartRoutine(targetId, paper.shortTitle || paper.title)}
                    className="flex-1 justify-center gap-1.5"
                  >
                    <Icon icon={isActive ? CheckIcon : PlayArrowOutlinedIcon} size="xs" />
                    <span>{isActive ? COPY.howTo.loadedButton : COPY.onboarding.quickLoadButton}</span>
                  </PillButton>

                  {isActive && (
                    <Link
                      href={ROUTES.routine}
                      className="inline-flex items-center gap-1 rounded-full border border-ink/20 bg-cream/70 px-3 py-1.5 text-2xs font-semibold text-ink transition-colors hover:bg-mint"
                      title={COPY.community.goToRoutine}
                    >
                      <span>Track</span>
                      <Icon icon={ArrowForwardIcon} size="xs" />
                    </Link>
                  )}
                </div>

                {/* External DOI and PDF links */}
                <div className="flex items-center justify-between gap-2 pt-1 text-2xs text-ink/55">
                  {paper.pdfUrl ? (
                    <a
                      href={paper.pdfUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 hover:text-ink underline-offset-2 hover:underline"
                    >
                      <Icon icon={DownloadOutlinedIcon} size="xs" />
                      <span>{COPY.howTo.downloadPdfButton}</span>
                    </a>
                  ) : <span />}

                  {paper.openAccessUrl && (
                    <a
                      href={paper.openAccessUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 hover:text-ink underline-offset-2 hover:underline"
                    >
                      <span>{COPY.howTo.doiLabel}</span>
                      <Icon icon={NorthEastIcon} size="xs" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
