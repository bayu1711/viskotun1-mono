'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import SpaOutlinedIcon from '@mui/icons-material/SpaOutlined';
import TravelExploreOutlinedIcon from '@mui/icons-material/TravelExploreOutlined';
import { AnimatePresence, motion } from 'framer-motion';
import { useLocale } from '../../contexts/LocaleContext';
import { SAMPLE_PAPERS, type SamplePaper } from '../../data/samplePapers';
import type { UserLifestyleProfile } from '../../types/auth';
import { getLifestyleMatchedPresets } from '../../utils/paperQuery';
import { Icon } from '../ui/Icon';
import { IconTile } from '../ui/IconTile';
import { PillButton } from '../ui/PillButton';
import { HiddenPdfInput } from './HiddenPdfInput';

export interface RoutineDiscoveryCardProps {
  variant?: 'welcome' | 'post-lifestyle';
  lifestyleProfile?: UserLifestyleProfile;
  samplePapers?: SamplePaper[];
  activeTab: 'goals' | 'lifestyle';
  onTabChange: (tab: 'goals' | 'lifestyle') => void;
  onAskQuestion: (query: string) => void;
  onSelectLifestyleChip: (chip: string) => void;
  onStartLifestyleInterview: () => void;
  onLoadPreset: (paper: SamplePaper) => void;
  onFile: (file: File) => void;
}

export function RoutineDiscoveryCard({
  variant = 'welcome',
  lifestyleProfile,
  samplePapers,
  activeTab,
  onTabChange,
  onAskQuestion,
  onSelectLifestyleChip,
  onStartLifestyleInterview,
  onLoadPreset,
  onFile
}: RoutineDiscoveryCardProps) {
  const { copy } = useLocale();
  const [showAttachHint, setShowAttachHint] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const hintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const papersPool = samplePapers && samplePapers.length > 0 ? samplePapers : SAMPLE_PAPERS;
  const isPostLifestyle = variant === 'post-lifestyle';

  const matchedPresets = useMemo(
    () => getLifestyleMatchedPresets(lifestyleProfile, papersPool, isPostLifestyle ? 3 : 2),
    [lifestyleProfile, papersPool, isPostLifestyle]
  );

  const triggerPdfUpload = useCallback(() => {
    uploadInputRef.current?.click();
    setShowAttachHint(true);
    if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    hintTimerRef.current = setTimeout(() => {
      setShowAttachHint(false);
    }, 5000);
  }, []);

  useEffect(() => {
    return () => {
      if (hintTimerRef.current) {
        clearTimeout(hintTimerRef.current);
        hintTimerRef.current = null;
      }
    };
  }, []);

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file) onFile(file);
      }}
      className={`transition-colors rounded-card ${
        isDragOver ? 'ring-2 ring-ink ring-offset-2 bg-mint/20' : ''
      }`}
    >
      <div className="rounded-card border border-ink/10 bg-white p-5 text-start space-y-3.5 shadow-xs">
        <div className="flex items-start gap-2.5">
          <IconTile variant="plain" shape="circle" size={36} className="bg-mint shrink-0 mt-0.5">
            <Icon icon={TravelExploreOutlinedIcon} size="sm" className="text-ink" />
          </IconTile>
          <div>
            <h3 className="text-sm font-semibold text-ink leading-snug">
              {copy.assistant.unifiedWelcomeNoRoutine}
            </h3>
            <p className="text-2xs text-ink/60 mt-0.5">
              {isPostLifestyle
                ? copy.assistant.lifestyleMatchedTitle
                : copy.assistant.unifiedEyebrowNoRoutine}
            </p>
          </div>
        </div>

        <p className="text-xs text-ink/75 leading-relaxed">
          {isPostLifestyle
            ? copy.assistant.lifestyleMatchedSubtitle
            : activeTab === 'lifestyle'
            ? copy.assistant.lifestyleDiscoveryBody
            : copy.assistant.unifiedWelcomeNoRoutineBody}
        </p>

        {isPostLifestyle ? (
          <>
            {/* Personalized Lifestyle-Matched Presets */}
            {matchedPresets.length > 0 && (
              <div className="space-y-2 pt-1">
                {matchedPresets.map(({ paper, reasonKey }) => (
                  <div
                    key={paper.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 rounded-tile border border-ink/10 bg-mint/25 p-3 transition-colors hover:bg-mint/40"
                  >
                    <div className="min-w-0 flex-1">
                      <span className="inline-flex items-center gap-1 rounded-full bg-white/80 px-2 py-0.5 text-3xs font-medium text-ink/80">
                        <Icon icon={AutoAwesomeOutlinedIcon} size="xs" className="text-ink/70" />
                        {copy.assistant.lifestyleMatchReasons[reasonKey]}
                      </span>
                      <h4 className="mt-1 text-xs font-semibold text-ink truncate">
                        {paper.shortTitle}
                      </h4>
                      <p className="text-2xs text-ink/65 line-clamp-1">{paper.summary}</p>
                    </div>
                    <div className="shrink-0 self-end sm:self-center">
                      <PillButton
                        size="sm"
                        variant="primary"
                        onClick={() => onLoadPreset(paper)}
                        className="h-7 px-3 text-2xs"
                      >
                        {copy.assistant.linkGuidance.loadRoutine}
                      </PillButton>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Health Goals & Conditions Quick Chips */}
            <div className="pt-2 border-t border-ink/5 space-y-2">
              <p className="text-2xs font-medium text-ink/60">{copy.assistant.orExploreGoals}</p>
              <div className="flex flex-wrap gap-1.5">
                {copy.assistant.problemChips.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => onAskQuestion(chip)}
                    className="rounded-full border border-ink/15 bg-canvas px-2.5 py-1 text-2xs font-medium text-ink transition-colors hover:border-ink/30 hover:bg-white cursor-pointer"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Discovery Category Pill Switcher */}
            <div className="flex items-center gap-1.5 p-1 rounded-full bg-canvas border border-ink/10 text-2xs font-medium">
              <button
                type="button"
                onClick={() => onTabChange('goals')}
                className={`flex-1 py-1 px-2.5 rounded-full text-center transition-all cursor-pointer ${
                  activeTab === 'goals'
                    ? 'bg-white text-ink font-semibold shadow-xs'
                    : 'text-ink/65 hover:text-ink'
                }`}
              >
                {copy.assistant.discoveryTabs.healthGoals}
              </button>
              <button
                type="button"
                onClick={() => onTabChange('lifestyle')}
                className={`flex-1 py-1 px-2.5 rounded-full text-center transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  activeTab === 'lifestyle'
                    ? 'bg-white text-ink font-semibold shadow-xs'
                    : 'text-ink/65 hover:text-ink'
                }`}
              >
                <Icon icon={AutoAwesomeOutlinedIcon} size="xs" className="text-ink/70" />
                <span>{copy.assistant.discoveryTabs.lifestyle}</span>
              </button>
            </div>

            {/* Tab Options */}
            {activeTab === 'goals' ? (
              <div className="pt-2 border-t border-ink/5 space-y-2">
                <p className="text-2xs font-medium text-ink/60">
                  {copy.assistant.linkGuidance.communityTitle}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {copy.assistant.problemChips.map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => onAskQuestion(chip)}
                      className="rounded-full border border-ink/15 bg-canvas px-2.5 py-1 text-2xs font-medium text-ink transition-colors hover:border-ink/30 hover:bg-white cursor-pointer"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="pt-2 border-t border-ink/5 space-y-3">
                {lifestyleProfile?.intakeCompleted && matchedPresets.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-2xs font-medium text-ink/60">
                      {copy.assistant.lifestyleMatchedTitle}
                    </p>
                    {matchedPresets.map(({ paper, reasonKey }) => (
                      <div
                        key={paper.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-tile border border-ink/10 bg-mint/25 p-2.5 transition-colors hover:bg-mint/40"
                      >
                        <div className="min-w-0 flex-1">
                          <span className="inline-flex items-center gap-1 rounded-full bg-white/80 px-2 py-0.5 text-3xs font-medium text-ink/80">
                            {copy.assistant.lifestyleMatchReasons[reasonKey]}
                          </span>
                          <h4 className="mt-0.5 text-xs font-semibold text-ink truncate">
                            {paper.shortTitle}
                          </h4>
                        </div>
                        <PillButton
                          size="sm"
                          variant="primary"
                          onClick={() => onLoadPreset(paper)}
                          className="h-7 px-3 text-2xs shrink-0 self-end sm:self-center"
                        >
                          {copy.assistant.linkGuidance.loadRoutine}
                        </PillButton>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  type="button"
                  onClick={onStartLifestyleInterview}
                  className="w-full flex items-center justify-between p-3 rounded-tile border border-mint bg-mint/25 hover:bg-mint/40 text-start transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5">
                    <IconTile variant="plain" shape="circle" size={32} className="bg-mint">
                      <Icon icon={SpaOutlinedIcon} size="xs" className="text-ink" />
                    </IconTile>
                    <div>
                      <p className="text-xs font-semibold text-ink">
                        {copy.assistant.answerLifestyleQuestionsBtn}
                      </p>
                      <p className="text-3xs text-ink/65">
                        Region · Daily Schedule · Circadian Rhythms · Cautions
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-ink/60 group-hover:translate-x-0.5 transition-transform">
                    →
                  </span>
                </button>

                <div>
                  <p className="text-2xs font-medium text-ink/60 mb-2">
                    {copy.assistant.orPickLifestylePreset}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {copy.assistant.lifestyleChips.map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => onSelectLifestyleChip(chip)}
                        className="rounded-full border border-ink/15 bg-canvas px-2.5 py-1 text-2xs font-medium text-ink transition-colors hover:border-ink/30 hover:bg-white cursor-pointer"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Single Chip Option for Research PDF Upload */}
        <div className="pt-2.5 border-t border-ink/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <button
            type="button"
            onClick={triggerPdfUpload}
            className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-ink/30 bg-mint/35 hover:bg-mint/60 px-3 py-1 text-2xs font-medium text-ink transition-colors cursor-pointer shrink-0"
          >
            <Icon icon={AttachFileIcon} size="xs" className="text-ink/75 rotate-45" />
            <span>{copy.assistant.attachPdfChip}</span>
          </button>

          <AnimatePresence>
            {showAttachHint && (
              <motion.span
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="text-3xs text-ink/70 flex items-center gap-1"
              >
                <span>↓</span>
                <span>{copy.assistant.attachPdfHint}</span>
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        <HiddenPdfInput ref={uploadInputRef} onFile={onFile} />
      </div>
    </div>
  );
}
