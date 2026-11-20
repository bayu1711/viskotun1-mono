'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';
import LaunchOutlinedIcon from '@mui/icons-material/LaunchOutlined';
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined';
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import TravelExploreOutlinedIcon from '@mui/icons-material/TravelExploreOutlined';
import { useAssistant } from '../../../contexts/AssistantContext';
import { useLocale } from '../../../contexts/LocaleContext';
import { useRoutine } from '../../../contexts/RoutineContext';
import { ROUTES } from '../../../data/navigation';
import { PRECALIBRATED_SAMPLE_ROUTINES, type SamplePaper } from '../../../data/samplePapers';
import { buildExternalSearchLinks, matchCommunityPapers } from '../../../utils/paperQuery';
import { Icon } from '../../ui/Icon';
import { IconTile } from '../../ui/IconTile';
import { PillButton } from '../../ui/PillButton';

interface ExternalSearchResult {
  title: string;
  authors: string;
  journal: string;
  year: number;
  doi: string;
  pmcid?: string;
  pmid?: string;
}

interface PaperGuidanceCardProps {
  content: string;
}

export function PaperGuidanceCard({ content }: PaperGuidanceCardProps) {
  const router = useRouter();
  const { copy } = useLocale();
  const { closeAssistant } = useAssistant();
  const { samplePapers, uploadPaper } = useRoutine();

  let parsed: { reason?: string; source?: string; suggestedQuery?: string } = {};
  try {
    if (content && typeof content === 'string' && content.startsWith('{')) {
      parsed = JSON.parse(content);
    }
  } catch {
    // Keep fallback defaults
  }

  const initialQuery = parsed.suggestedQuery || '';
  const [searchDraft, setSearchDraft] = useState(initialQuery);
  const [activeQuery, setActiveQuery] = useState(initialQuery);
  const [liveResults, setLiveResults] = useState<ExternalSearchResult[]>([]);
  const [isSearchingLive, setIsSearchingLive] = useState(false);

  // Community papers matched against active query
  const communityMatches = useMemo(() => {
    return matchCommunityPapers(activeQuery, samplePapers).slice(0, 3);
  }, [activeQuery, samplePapers]);

  // Pre-filtered external database links
  const externalLinks = useMemo(() => {
    return buildExternalSearchLinks(activeQuery);
  }, [activeQuery]);

  // Fetch live Europe PMC open-access paper search if activeQuery has substance
  useEffect(() => {
    let isCancelled = false;
    const trimmed = activeQuery.trim();

    if (trimmed.length < 3) {
      setLiveResults([]);
      setIsSearchingLive(false);
      return;
    }

    setIsSearchingLive(true);
    const controller = new AbortController();

    async function searchLive() {
      try {
        const res = await fetch(`/api/papers/search?q=${encodeURIComponent(trimmed)}`, {
          signal: controller.signal
        });
        if (res.ok) {
          const data = await res.json();
          if (!isCancelled && Array.isArray(data.externalPapers)) {
            setLiveResults(data.externalPapers.slice(0, 3));
          }
        }
      } catch {
        if (!isCancelled) {
          setLiveResults([]);
        }
      } finally {
        if (!isCancelled) {
          setIsSearchingLive(false);
        }
      }
    }

    const timer = setTimeout(searchLive, 300);

    return () => {
      isCancelled = true;
      controller.abort();
      clearTimeout(timer);
    };
  }, [activeQuery]);

  const handleApplyTopic = (topic: string) => {
    setSearchDraft(topic);
    setActiveQuery(topic);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveQuery(searchDraft.trim());
  };

  const handleClearSearch = () => {
    setSearchDraft('');
    setActiveQuery('');
  };

  const handleLoadCommunityRoutine = (paper: SamplePaper) => {
    const routineId = paper.routineId;
    if (routineId && PRECALIBRATED_SAMPLE_ROUTINES[routineId]) {
      uploadPaper(paper.shortTitle, PRECALIBRATED_SAMPLE_ROUTINES[routineId]);
    } else {
      uploadPaper(paper.doi || paper.title);
    }
  };

  const handleExtractExternalPaper = (doi: string) => {
    if (!doi) return;
    uploadPaper(doi);
  };

  const handleBrowseCommunity = () => {
    closeAssistant();
    router.push(`${ROUTES.community}?tab=explore`);
  };

  const t = copy.assistant.linkGuidance;

  return (
    <article className="space-y-4 rounded-card border border-ink/10 bg-white p-4 sm:p-5 shadow-sm">
      {/* 1. Header Banner */}
      <div className="flex items-start gap-3">
        <IconTile variant="plain" shape="circle" size={40} className="bg-mint">
          <Icon icon={TravelExploreOutlinedIcon} size="md" className="text-ink" />
        </IconTile>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-ink sm:text-base">{t.title}</h3>
          <p className="mt-0.5 text-xs text-ink/70 leading-relaxed">{t.subtitle}</p>
          {parsed.source && (
            <p className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-canvas px-2.5 py-0.5 text-2xs text-ink/60 font-mono truncate max-w-full">
              <span>Link:</span>
              <span className="truncate">{parsed.source}</span>
            </p>
          )}
        </div>
      </div>

      {/* 2. Interactive Discovery Search & Chips */}
      <div className="space-y-2.5 rounded-tile border border-ink/10 bg-canvas/60 p-3 sm:p-3.5">
        <label htmlFor="discovery-query-input" className="block text-xs font-medium text-ink">
          {t.askPrompt}
        </label>
        <form onSubmit={handleSearchSubmit} className="relative flex items-center">
          <input
            id="discovery-query-input"
            type="text"
            value={searchDraft}
            onChange={(e) => setSearchDraft(e.target.value)}
            placeholder={t.customSearchPlaceholder}
            className="w-full rounded-full border border-ink/15 bg-white py-2 pl-9 pr-8 text-xs text-ink placeholder:text-ink/50 focus:border-ink/40 focus:outline-none"
          />
          <SearchOutlinedIcon className="pointer-events-none absolute left-2.5 h-4 w-4 text-ink/50" />
          {searchDraft && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute right-2.5 text-ink/40 hover:text-ink"
              aria-label={t.clearSearch}
            >
              <CloseOutlinedIcon className="h-4 w-4" />
            </button>
          )}
        </form>

        {/* Quick Topic Chips */}
        <div className="flex flex-wrap gap-1.5 pt-0.5">
          {t.suggestions.map((suggestion) => {
            const isSelected = activeQuery.toLowerCase() === suggestion.toLowerCase();
            return (
              <button
                key={suggestion}
                type="button"
                onClick={() => handleApplyTopic(suggestion)}
                className={`rounded-full px-2.5 py-1 text-2xs font-medium transition-colors ${
                  isSelected
                    ? 'bg-ink text-white'
                    : 'bg-white border border-ink/10 text-ink/70 hover:border-ink/30 hover:text-ink'
                }`}
              >
                {suggestion}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Available Community Routines (Pre-Calibrated & Ready) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-xs font-semibold text-ink flex items-center gap-1.5">
              <Icon icon={MenuBookOutlinedIcon} size="xs" className="text-ink/70" />
              {t.communityTitle}
            </h4>
            <p className="text-2xs text-ink/60">{t.communitySubtitle}</p>
          </div>
          <button
            type="button"
            onClick={handleBrowseCommunity}
            className="text-2xs font-medium text-ink underline underline-offset-2 hover:opacity-80 shrink-0"
          >
            {t.browseCommunity}
          </button>
        </div>

        <div className="space-y-2">
          {communityMatches.map((paper) => {
            const hasPrecalibratedRoutine = Boolean(paper.routineId && PRECALIBRATED_SAMPLE_ROUTINES[paper.routineId]);
            return (
              <div
                key={paper.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 rounded-tile border border-ink/10 bg-mint/30 p-3 transition-colors hover:bg-mint/40"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="rounded bg-mint px-1.5 py-0.5 text-3xs font-medium uppercase tracking-wide text-ink/80">
                      {paper.category}
                    </span>
                    {hasPrecalibratedRoutine && (
                      <span className="flex items-center gap-1 text-3xs font-medium text-emerald-800">
                        <CheckCircleOutlineOutlinedIcon className="h-3 w-3" />
                        Verified Routine
                      </span>
                    )}
                  </div>
                  <h5 className="mt-1 text-xs font-semibold text-ink truncate">{paper.shortTitle}</h5>
                  <p className="text-2xs text-ink/65 line-clamp-1">{paper.summary}</p>
                </div>

                <div className="shrink-0 self-end sm:self-center">
                  <PillButton
                    size="sm"
                    variant="primary"
                    onClick={() => handleLoadCommunityRoutine(paper)}
                    className="h-7 px-3 text-2xs"
                  >
                    <Icon icon={AutoAwesomeOutlinedIcon} size="xs" className="mr-1" />
                    {t.loadRoutine}
                  </PillButton>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. External Research Databases (PubMed, Europe PMC, Google Scholar) */}
      <div className="space-y-2 pt-1">
        <div>
          <h4 className="text-xs font-semibold text-ink flex items-center gap-1.5">
            <Icon icon={LaunchOutlinedIcon} size="xs" className="text-ink/70" />
            {t.externalTitle}
          </h4>
          <p className="text-2xs text-ink/60">{t.externalSubtitle}</p>
        </div>

        {/* Direct Database Search Action Links */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <a
            href={externalLinks.pubmed}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between rounded-tile border border-ink/10 bg-canvas p-2.5 text-xs font-medium text-ink transition-colors hover:border-ink/30 hover:bg-white"
          >
            <span>{t.pubmedSearch}</span>
            <LaunchOutlinedIcon className="h-3.5 w-3.5 text-ink/50" />
          </a>
          <a
            href={externalLinks.europePmc}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between rounded-tile border border-ink/10 bg-canvas p-2.5 text-xs font-medium text-ink transition-colors hover:border-ink/30 hover:bg-white"
          >
            <span>{t.europePmcSearch}</span>
            <LaunchOutlinedIcon className="h-3.5 w-3.5 text-ink/50" />
          </a>
          <a
            href={externalLinks.googleScholar}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between rounded-tile border border-ink/10 bg-canvas p-2.5 text-xs font-medium text-ink transition-colors hover:border-ink/30 hover:bg-white"
          >
            <span>{t.googleScholarSearch}</span>
            <LaunchOutlinedIcon className="h-3.5 w-3.5 text-ink/50" />
          </a>
        </div>

        {/* Live Europe PMC Search Results (if available) */}
        {isSearchingLive && (
          <p className="text-2xs text-ink/50 italic py-1">{t.searchingEuropePmc}</p>
        )}

        {liveResults.length > 0 && (
          <div className="mt-2 space-y-1.5 rounded-tile border border-ink/10 bg-canvas/40 p-2.5">
            <p className="text-2xs font-medium text-ink/70">Open-Access Trials on Europe PMC:</p>
            {liveResults.map((res) => (
              <div
                key={res.doi || res.title}
                className="flex items-center justify-between gap-2 border-b border-ink/5 pb-1.5 last:border-b-0 last:pb-0"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-2xs font-medium text-ink truncate">{res.title}</p>
                  <p className="text-3xs text-ink/60 truncate">
                    {res.authors} · {res.journal} ({res.year})
                  </p>
                </div>
                {res.doi && (
                  <button
                    type="button"
                    onClick={() => handleExtractExternalPaper(res.doi)}
                    className="shrink-0 rounded-full bg-ink px-2 py-0.5 text-3xs font-medium text-white transition-opacity hover:opacity-90"
                  >
                    {t.extractRoutine}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 5. DOI Tips Box */}
      <div className="rounded-tile border border-ink/10 bg-cream/50 p-3 text-left">
        <p className="flex items-center gap-1.5 text-2xs font-medium tracking-wide text-ink/80">
          <Icon icon={LightbulbOutlinedIcon} size="xs" className="text-amber-700" />
          {t.doiTipTitle}
        </p>
        <ul className="mt-1.5 space-y-1 text-2xs text-ink/70 leading-relaxed">
          {t.doiTipSteps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ul>
      </div>
    </article>
  );
}
