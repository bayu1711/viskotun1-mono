'use client';

import React from 'react';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import HelpOutlineOutlinedIcon from '@mui/icons-material/HelpOutlineOutlined';
import PlayArrowOutlinedIcon from '@mui/icons-material/PlayArrowOutlined';
import UploadFileOutlinedIcon from '@mui/icons-material/UploadFileOutlined';
import { useAssistant } from '../../contexts/AssistantContext';
import { useProtocol } from '../../contexts/ProtocolContext';
import { COPY } from '../../data/copy';
import { PageContainer } from '../layout/PageContainer';
import { PageHeader } from '../layout/PageHeader';
import { Icon } from '../ui/Icon';
import { PillButton } from '../ui/PillButton';
import { StepIcon } from '../ui/StepIcon';

export function EmptyRoutineView() {
  const { openHowTo, loadSampleProtocol } = useProtocol();
  const { openAssistant } = useAssistant();

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
        <p className="text-base leading-relaxed lowercase text-ink/70">
          {COPY.onboarding.welcomeSubtitle}
        </p>

        {/* Primary Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <PillButton size="lg" onClick={handleOpenUpload} className="gap-2">
            <Icon icon={UploadFileOutlinedIcon} size="sm" />
            <span>{COPY.onboarding.ctaUpload}</span>
          </PillButton>

          <PillButton size="lg" variant="outline" onClick={openHowTo} className="gap-2">
            <Icon icon={HelpOutlineOutlinedIcon} size="sm" />
            <span>{COPY.onboarding.ctaHowTo}</span>
          </PillButton>
        </div>

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
          <h3 className="mt-4 text-base font-medium lowercase text-ink">
            {COPY.onboarding.dropPrompt}
          </h3>
          <p className="mx-auto mt-1 max-w-md text-xs lowercase text-ink/55">
            {COPY.onboarding.dropSubtext}
          </p>
        </div>

        {/* Quick Sample Loaders */}
        <div className="space-y-3 pt-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-medium lowercase text-ink/70">
              {COPY.onboarding.samplesHeading}
            </h3>
            <button
              type="button"
              onClick={openHowTo}
              className="text-2xs font-medium lowercase text-ink/50 hover:text-ink transition-colors underline"
            >
              {COPY.howTo.buttonExploreSamples}
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {/* Sample 1: Achilles */}
            <div className="flex flex-col justify-between rounded-card border border-ink/10 bg-white p-4 transition-all hover:border-ink/30">
              <div>
                <div className="flex items-center justify-between">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-canvas text-ink">
                    <StepIcon icon="straight-knee" size="xs" />
                  </span>
                  <span className="rounded-full bg-mint px-2 py-0.5 text-2xs font-semibold lowercase text-ink">
                    rehab
                  </span>
                </div>
                <h4 className="mt-3 text-sm font-medium lowercase text-ink">
                  Achilles Tendinopathy
                </h4>
                <p className="mt-1 text-2xs lowercase text-ink/60">
                  Alfredson & McCormack eccentric drops · 0–10 pain slider & load reduction.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-ink/10">
                <PillButton
                  size="sm"
                  variant="outline"
                  onClick={() => loadSampleProtocol('achilles')}
                  className="w-full justify-center gap-1.5"
                >
                  <Icon icon={PlayArrowOutlinedIcon} size="xs" />
                  <span>{COPY.onboarding.quickLoadButton}</span>
                </PillButton>
              </div>
            </div>

            {/* Sample 2: Hair Regrowth */}
            <div className="flex flex-col justify-between rounded-card border border-ink/10 bg-white p-4 transition-all hover:border-ink/30">
              <div>
                <div className="flex items-center justify-between">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-canvas text-ink">
                    <StepIcon icon="serum" size="xs" />
                  </span>
                  <span className="rounded-full bg-cream px-2 py-0.5 text-2xs font-semibold lowercase text-ink">
                    dermatology
                  </span>
                </div>
                <h4 className="mt-3 text-sm font-medium lowercase text-ink">
                  Alopecia Hair Regrowth
                </h4>
                <p className="mt-1 text-2xs lowercase text-ink/60">
                  Dhurat RCT minoxidil + microneedling · milestone photo comparison.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-ink/10">
                <PillButton
                  size="sm"
                  variant="outline"
                  onClick={() => loadSampleProtocol('hair-loss')}
                  className="w-full justify-center gap-1.5"
                >
                  <Icon icon={PlayArrowOutlinedIcon} size="xs" />
                  <span>{COPY.onboarding.quickLoadButton}</span>
                </PillButton>
              </div>
            </div>

            {/* Sample 3: Creatine */}
            <div className="flex flex-col justify-between rounded-card border border-ink/10 bg-white p-4 transition-all hover:border-ink/30">
              <div>
                <div className="flex items-center justify-between">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-canvas text-ink">
                    <StepIcon icon="sleep" size="xs" />
                  </span>
                  <span className="rounded-full bg-mint px-2 py-0.5 text-2xs font-semibold lowercase text-ink">
                    nutrition
                  </span>
                </div>
                <h4 className="mt-3 text-sm font-medium lowercase text-ink">
                  Creatine & Sleep Deficit
                </h4>
                <p className="mt-1 text-2xs lowercase text-ink/60">
                  Gordji-Nejad 2024 cognitive rescue · PVT reaction timer & sleepiness scale.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-ink/10">
                <PillButton
                  size="sm"
                  variant="outline"
                  onClick={() => loadSampleProtocol('creatine-sleep')}
                  className="w-full justify-center gap-1.5"
                >
                  <Icon icon={PlayArrowOutlinedIcon} size="xs" />
                  <span>{COPY.onboarding.quickLoadButton}</span>
                </PillButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
