'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import CheckIcon from '@mui/icons-material/Check';
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import NorthEastIcon from '@mui/icons-material/NorthEast';
import PlayArrowOutlinedIcon from '@mui/icons-material/PlayArrowOutlined';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { toast } from 'sonner';
import { useAssistant } from '../../contexts/AssistantContext';
import { useRoutine } from '../../contexts/RoutineContext';
import { COPY } from '../../data/copy';
import { ROUTES } from '../../data/navigation';
import { PRECALIBRATED_SAMPLE_PROTOCOLS, SAMPLE_PAPERS, type SamplePaper } from '../../data/samplePapers';
import type { StepIconKey } from '../../types/routine';
import { cn } from '../../utils/cn';
import { isRoutineCompleted } from '../../utils/routineMetrics';
import { Icon } from '../ui/Icon';
import { PillButton } from '../ui/PillButton';
import { StepIcon } from '../ui/StepIcon';
import { VersionHistoryModal } from './VersionHistoryModal';

export function TrendingPapersExplore() {
  const router = useRouter();
  const { openAssistant } = useAssistant();
  const {
    routine,
    routines,
    activeRoutineId,
    activeProtocolId,
    dayIsComplete,
    todayFraction,
    currentDay,
    totalDays,
    loadSampleRoutine,
    loadSampleProtocol,
    redoRoutine,
    samplePapers,
    trendingPapers
  } = useRoutine();

  const loadRoutine = loadSampleRoutine || loadSampleProtocol;
  const currentActiveId = routine?.id || activeRoutineId || activeProtocolId;

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

  const getIconForRoutine = (targetId?: string, category?: string): StepIconKey => {
    if (targetId) {
      const matched = PRECALIBRATED_SAMPLE_PROTOCOLS[targetId];
      if (matched?.icon) return matched.icon;
      if (targetId === 'achilles') return 'straight-knee';
      if (targetId === 'hair-loss') return 'serum';
      if (targetId === 'creatine-sleep') return 'sleep';
      if (targetId === 'zone2-cardio') return 'fitness';
    }
    if (category) {
      const cat = category.toLowerCase();
      if (cat.includes('metabol') || cat.includes('fasting')) return 'timer';
      if (cat.includes('circadian') || cat.includes('sleep') || cat.includes('light')) return 'sun';
      if (cat.includes('derma') || cat.includes('hair')) return 'serum';
      if (cat.includes('nutrition')) return 'diet';
      if (cat.includes('rehab')) return 'stretch';
    }
    return 'pill';
  };

  const getCategoryBadgeClass = (category: string) => {
    const cat = category.toLowerCase();
    if (cat.includes('rehab') || cat.includes('ortho')) {
      return 'bg-orange/15 text-ink hover:bg-orange/25 border border-orange/30';
    }
    if (cat.includes('cognit') || cat.includes('focus')) {
      return 'bg-yellow/30 text-ink hover:bg-yellow/45 border border-yellow/50';
    }
    if (cat.includes('sleep') || cat.includes('circadian')) {
      return 'bg-lavender/30 text-ink hover:bg-lavender/45 border border-lavender/50';
    }
    if (cat.includes('derma') || cat.includes('hair') || cat.includes('skin')) {
      return 'bg-sky/20 text-ink hover:bg-sky/35 border border-sky/40';
    }
    if (cat.includes('cardio') || cat.includes('metabol')) {
      return 'bg-mint/40 text-ink hover:bg-mint/60 border border-mint/60';
    }
    if (cat.includes('nutrit') || cat.includes('fasting')) {
      return 'bg-peach/30 text-ink hover:bg-peach/45 border border-peach/50';
    }
    return 'bg-canvas text-ink/70 hover:bg-ink/10 border border-ink/10';
  };

  const handleStartRoutine = (targetId?: string, isRedo = false) => {
    if (targetId) {
      if (isRedo) {
        redoRoutine(targetId);
      } else {
        loadRoutine(targetId);
      }
    } else {
      openAssistant('upload');
    }
  };

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
        {filteredPapers.map((paper, index) => {
          const targetId = paper.routineId || paper.protocolId;
          const rank = paper.trendingRank ?? index + 1;
          const trackers = paper.activeTrackersCount;
          const logs = paper.totalLogsCount;
          const isActive = Boolean(targetId && currentActiveId === targetId);

          const matchedSummary = targetId ? routines.find((r) => r.id === targetId) : undefined;
          const isCompleted = targetId
            ? isActive
              ? isRoutineCompleted(
                  routine ?? matchedSummary ?? { currentDay, totalDays },
                  dayIsComplete || todayFraction >= 1
                )
              : matchedSummary
              ? isRoutineCompleted(matchedSummary, matchedSummary.todayFraction >= 1)
              : false
            : false;

          return (
            <div
              key={paper.id}
              className={cn(
                'flex flex-col justify-between rounded-card border bg-white p-5 transition-all',
                isActive
                  ? 'border-orange ring-2 ring-orange/30'
                  : 'border-ink/10 hover:border-ink/30'
              )}
            >
              <div>
                {/* Header row: Icon, Rank, Category inside the card */}
                <div className="flex items-center justify-between gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-orange/10 text-orange">
                    <StepIcon icon={getIconForRoutine(targetId, paper.category)} size="xs" />
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={cn(
                        'rounded-full px-2.5 py-0.5 text-2xs',
                        rank === 1
                          ? 'bg-orange text-ink font-semibold'
                          : rank === 2
                          ? 'bg-yellow text-ink font-semibold'
                          : rank === 3
                          ? 'bg-mint text-ink font-semibold'
                          : 'bg-canvas text-ink/75 font-medium border border-ink/10'
                      )}
                    >
                      {COPY.howTo.trendingRankBadge(rank)}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedCategory(selectedCategory === paper.category ? 'all' : paper.category)
                      }
                      className={cn(
                        'relative rounded-full px-2.5 py-0.5 text-2xs font-semibold transition-colors before:absolute before:-inset-y-3 before:inset-x-0',
                        selectedCategory === paper.category
                          ? 'bg-ink text-white'
                          : getCategoryBadgeClass(paper.category)
                      )}
                      title={`${COPY.howTo.filterByTopic} ${paper.category}`}
                    >
                      {paper.category}
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewingVersionPaper(paper)}
                      className="rounded-full bg-cream border border-ink/15 px-2 py-0.5 text-3xs font-semibold text-ink hover:bg-mint/40 hover:border-ink transition-colors"
                      title={COPY.community.versionHistoryTitle}
                    >
                      {paper.version ? `v${paper.version}` : 'v1.0'}
                    </button>
                  </div>
                </div>

                {/* Title & Meta */}
                <h3 className="mt-3.5 text-sm font-medium leading-snug text-ink">
                  {paper.shortTitle || paper.title}
                </h3>
                <p className="mt-1 text-2xs text-ink/60 line-clamp-1">
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
                <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-ink/5 pt-2 text-2xs text-ink/60">
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
                    onClick={() => {
                      if (isActive && !isCompleted) {
                        router.push(ROUTES.routine);
                      } else if (isCompleted) {
                        handleStartRoutine(targetId, true);
                      } else {
                        handleStartRoutine(targetId);
                      }
                    }}
                    className="min-h-11 flex-1 justify-center gap-1.5"
                  >
                    <Icon
                      icon={isCompleted ? RestartAltIcon : isActive ? CheckIcon : PlayArrowOutlinedIcon}
                      size="xs"
                    />
                    <span>
                      {isCompleted
                        ? COPY.howTo.redoButton
                        : isActive
                        ? COPY.howTo.inProgressButton
                        : COPY.onboarding.quickLoadButton}
                    </span>
                  </PillButton>

                  {isActive && (
                    <Link
                      href={ROUTES.routine}
                      className="inline-flex min-h-11 items-center gap-1 rounded-full border border-ink/20 bg-cream/70 px-3 text-2xs font-semibold text-ink transition-colors hover:bg-mint"
                      title={COPY.community.goToRoutine}
                    >
                      <span>Track</span>
                      <Icon icon={ArrowForwardIcon} size="xs" />
                    </Link>
                  )}
                </div>

                {/* External DOI and PDF links */}
                <div className="flex items-center justify-between gap-2 pt-1 text-2xs text-ink/60">
                  {paper.pdfUrl ? (
                    <a
                      href={paper.pdfUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex min-h-11 items-center gap-1 hover:text-ink underline-offset-2 hover:underline"
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
                      className="inline-flex min-h-11 items-center gap-1 hover:text-ink underline-offset-2 hover:underline"
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

      <VersionHistoryModal
        isOpen={Boolean(viewingVersionPaper)}
        onClose={() => setViewingVersionPaper(null)}
        paperTitle={viewingVersionPaper?.title || viewingVersionPaper?.shortTitle || 'Research Protocol'}
        currentVersion={viewingVersionPaper?.version || '1.0'}
        changelog={viewingVersionPaper?.changelog || []}
      />
    </div>
  );
}
