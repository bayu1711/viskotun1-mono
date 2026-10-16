'use client';

import React from 'react';
import GraphicEqIcon from '@mui/icons-material/GraphicEq';
import PauseRoundedIcon from '@mui/icons-material/PauseRounded';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';
import SkipNextRoundedIcon from '@mui/icons-material/SkipNextRounded';
import SkipPreviousRoundedIcon from '@mui/icons-material/SkipPreviousRounded';
import VolumeOffRoundedIcon from '@mui/icons-material/VolumeOffRounded';
import VolumeUpRoundedIcon from '@mui/icons-material/VolumeUpRounded';
import { COPY } from '../../data/copy';
import { useVoiceCoach } from '../../hooks/useVoiceCoach';
import type { RoutineStep, ProtocolStep } from '../../types/routine';
import { CircleButton } from '../ui/CircleButton';
import { Icon } from '../ui/Icon';

interface VoiceCoachBarProps {
  steps: (RoutineStep | ProtocolStep)[];
  safetyRule?: string;
  onStepComplete?: (stepIndex: number) => void;
}

export function VoiceCoachBar({ steps, safetyRule, onStepComplete }: VoiceCoachBarProps) {
  const {
    isPlaying,
    isPaused,
    currentStepIndex,
    speed,
    isSoundEnabled,
    countdownRemaining,
    statusText,
    isSupported,
    startCoach,
    pauseCoach,
    resumeCoach,
    nextStep,
    prevStep,
    cycleSpeed,
    toggleSound
  } = useVoiceCoach({ steps, safetyRule, onStepComplete });

  if (!isSupported) {
    return null;
  }

  const activeStep = steps[currentStepIndex] || steps[0];
  const stepCount = steps.length;
  const isHolding = countdownRemaining !== null && countdownRemaining > 0;

  return (
    <section
      aria-label={COPY.voiceCoach.title}
      className="relative overflow-hidden rounded-tile border border-ink/10 bg-white p-4 shadow-sm transition-all sm:p-5"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Left: Indicator & Step Context */}
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors ${
              isPlaying ? 'bg-mint text-ink' : 'bg-cream text-ink/70'
            }`}
          >
            <Icon icon={GraphicEqIcon} size="md" className={isPlaying ? 'animate-pulse' : ''} />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-2xs font-medium tracking-wider text-ink/45">
                {isPlaying ? COPY.voiceCoach.listening : COPY.voiceCoach.eyebrow}
              </span>
              <span className="text-2xs font-semibold text-ink/70">
                {COPY.voiceCoach.stepPacing(currentStepIndex + 1, stepCount)}
              </span>
              {isHolding && (
                <span className="animate-pulse rounded-full bg-blush px-2 py-0.5 text-2xs font-bold text-ink">
                  {COPY.voiceCoach.countdown(countdownRemaining)}
                </span>
              )}
            </div>
            <p className="truncate text-sm font-semibold text-ink">
              {activeStep?.action || COPY.voiceCoach.title}
            </p>
          </div>
        </div>

        {/* Right: Audio Controls */}
        <div className="flex items-center justify-between gap-1.5 sm:justify-end">
          {/* Step Backwards */}
          <CircleButton
            label={COPY.voiceCoach.prevStep}
            size={36}
            disabled={currentStepIndex === 0}
            onClick={prevStep}
          >
            <Icon icon={SkipPreviousRoundedIcon} size="md" />
          </CircleButton>

          {/* Primary Play/Pause Toggle */}
          {isPlaying ? (
            <button
              type="button"
              onClick={pauseCoach}
              aria-label={COPY.voiceCoach.pause}
              className="flex h-10 items-center gap-1.5 rounded-full bg-ink px-4 text-xs font-medium text-white shadow-sm transition-all hover:bg-ink/85 active:scale-95"
            >
              <Icon icon={PauseRoundedIcon} size="sm" />
              <span>{COPY.voiceCoach.pause}</span>
            </button>
          ) : isPaused ? (
            <button
              type="button"
              onClick={resumeCoach}
              aria-label={COPY.voiceCoach.resume}
              className="flex h-10 items-center gap-1.5 rounded-full bg-mint px-4 text-xs font-medium text-ink shadow-sm transition-all hover:bg-mint/80 active:scale-95"
            >
              <Icon icon={PlayArrowRoundedIcon} size="sm" />
              <span>{COPY.voiceCoach.resume}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={startCoach}
              aria-label={COPY.voiceCoach.play}
              className="flex h-10 items-center gap-1.5 rounded-full bg-mint px-4 text-xs font-medium text-ink shadow-sm transition-all hover:bg-mint/80 active:scale-95"
            >
              <Icon icon={PlayArrowRoundedIcon} size="sm" />
              <span>{COPY.voiceCoach.play}</span>
            </button>
          )}

          {/* Step Forwards */}
          <CircleButton
            label={COPY.voiceCoach.nextStep}
            size={36}
            disabled={currentStepIndex >= stepCount - 1}
            onClick={nextStep}
          >
            <Icon icon={SkipNextRoundedIcon} size="md" />
          </CircleButton>

          {/* Speech Rate Toggle */}
          <button
            type="button"
            onClick={cycleSpeed}
            aria-label={COPY.voiceCoach.speed(speed)}
            className="flex h-9 min-w-[36px] items-center justify-center rounded-full border border-ink/15 bg-canvas px-2 text-2xs font-semibold text-ink transition-colors hover:bg-cream"
          >
            {COPY.voiceCoach.speedDisplay(speed)}
          </button>

          {/* Audio Chime Mute Toggle */}
          <CircleButton
            label={isSoundEnabled ? COPY.voiceCoach.soundOn : COPY.voiceCoach.soundMuted}
            size={36}
            onClick={toggleSound}
          >
            <Icon icon={isSoundEnabled ? VolumeUpRoundedIcon : VolumeOffRoundedIcon} size="sm" />
          </CircleButton>
        </div>
      </div>

      {/* Subtext ticker / cue status */}
      <div className="mt-2.5 flex items-center justify-between border-t border-ink/5 pt-2 text-2xs text-ink/55">
        <p className="truncate" aria-live="polite">
          {statusText}
        </p>
        <span className="shrink-0 text-3xs text-ink/35">{COPY.voiceCoach.techNote}</span>
      </div>
    </section>
  );
}
