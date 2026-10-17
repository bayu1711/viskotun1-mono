'use client';

import React from 'react';
import Link from 'next/link';
import PlayArrowOutlinedIcon from '@mui/icons-material/PlayArrowOutlined';
import UploadFileOutlinedIcon from '@mui/icons-material/UploadFileOutlined';
import { useAssistant } from '../../contexts/AssistantContext';
import { useRoutine } from '../../contexts/RoutineContext';
import { COPY } from '../../data/copy';
import { ROUTES } from '../../data/navigation';
import { PageContainer } from '../layout/PageContainer';
import { PageHeader } from '../layout/PageHeader';
import { Icon } from '../ui/Icon';
import { PillButton } from '../ui/PillButton';
import { StepIcon } from '../ui/StepIcon';

export function EmptyRoutineView() {
  const { loadSampleRoutine, loadSampleProtocol, trendingPapers, samplePapers } = useRoutine();
  const { openAssistant } = useAssistant();
  const loadRoutine = loadSampleRoutine || loadSampleProtocol;
  const availablePapers = trendingPapers || samplePapers || [];
  const topTrending = availablePapers.filter((p) => !p.isGuardrailRejectionTest && (p.routineId || p.protocolId)).slice(0, 3);

  const handleOpenUpload = () => {
    openAssistant('upload');
  };

  const getIconForRoutine = (targetId?: string, category?: string) => {
    if (targetId === 'achilles') return 'straight-knee' as const;
    if (targetId === 'hair-loss') return 'serum' as const;
    if (targetId === 'creatine-sleep') return 'sleep' as const;
    if (category?.includes('metabol') || category?.includes('fasting')) return 'timer' as const;
    if (category?.includes('circadian') || category?.includes('sleep') || category?.includes('light')) return 'sun' as const;
    return 'pill' as const;
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

        {/* Quick Trending Paper Starters */}
        <div className="space-y-3 pt-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-medium text-ink/70">
              {COPY.onboarding.trendingHeading}
            </h3>
            <Link
              href={`${ROUTES.community}?tab=explore`}
              className="text-2xs font-medium text-ink/60 hover:text-ink transition-colors underline"
            >
              {COPY.howTo.buttonExploreSamples}
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {topTrending.map((paper, index) => {
              const targetId = paper.routineId || paper.protocolId;
              const rank = paper.trendingRank ?? index + 1;
              const trackers = paper.activeTrackersCount;
              const logs = paper.totalLogsCount;

              return (
                <div
                  key={paper.id}
                  className="flex flex-col justify-between rounded-card border border-ink/10 bg-white p-4 transition-all hover:border-ink/30"
                >
                  <div>
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-canvas text-ink">
                        <StepIcon icon={getIconForRoutine(targetId, paper.category)} size="xs" />
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="rounded-full bg-mint/30 border border-mint/60 px-2 py-0.5 text-2xs font-semibold text-ink">
                          {COPY.howTo.trendingRankBadge(rank)}
                        </span>
                        <span className="rounded-full bg-canvas px-2 py-0.5 text-2xs font-semibold text-ink/70">
                          {paper.category}
                        </span>
                      </div>
                    </div>

                    <h4 className="mt-3 text-sm font-medium text-ink leading-snug">
                      {paper.shortTitle || paper.title}
                    </h4>
                    <p className="mt-1 text-2xs text-ink/60 line-clamp-2">
                      {paper.summary}
                    </p>

                    <div className="mt-2.5 flex items-center gap-1.5 text-2xs text-ink/60">
                      <span>{COPY.howTo.activeTrackersBadge(trackers ?? 0)}</span>
                      <span>·</span>
                      <span>{COPY.howTo.totalLogsBadge(logs ?? 0)}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-ink/10">
                    <PillButton
                      size="sm"
                      variant="outline"
                      onClick={() => (targetId ? loadRoutine(targetId) : handleOpenUpload())}
                      className="w-full justify-center gap-1.5"
                    >
                      <Icon icon={PlayArrowOutlinedIcon} size="xs" />
                      <span>{COPY.onboarding.quickLoadButton}</span>
                    </PillButton>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
