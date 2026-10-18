'use client';

import React from 'react';
import GraphicEqIcon from '@mui/icons-material/GraphicEq';
import PauseRoundedIcon from '@mui/icons-material/PauseRounded';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';
import RecordVoiceOverRoundedIcon from '@mui/icons-material/RecordVoiceOverRounded';
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
  isDayComplete?: boolean;
}

export function VoiceCoachBar({ steps, safetyRule, onStepComplete, isDayComplete }: VoiceCoachBarProps) {
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
    toggleSound,
    cycleVoice,
    activeVoiceDisplayName,
    availableVoiceCount
  } = useVoiceCoach({ steps, safetyRule, onStepComplete, isDayComplete });

  if (!isSupported) {
    return null;
  }

  const activeStep = steps[currentStepIndex] || steps[0];
  const stepCount = steps.length;
  const isHolding = countdownRemaining !== null && countdownRemaining > 0;

  return (
    <section
      aria-label={COPY.voiceCoach.title}
      className="relative overflow-hidden rounded-tile border border-ink/10 bg-white p-4 transition-all sm:p-5"
    >
      <div className="flex flex-col gap-3.5">
        {/* Row 1: Indicator, Step Context & Holding Countdown */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors ${
                isPlaying ? 'bg-orange text-white' : 'bg-orange/15 text-orange'
              }`}
            >
              <Icon icon={GraphicEqIcon} size="md" className={isPlaying ? 'animate-pulse' : ''} />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-2xs font-medium tracking-wider text-ink/60">
                  {isPlaying ? COPY.voiceCoach.listening : COPY.voiceCoach.eyebrow}
                </span>
                <span className="text-2xs font-semibold text-ink/70">
                  {COPY.voiceCoach.stepPacing(currentStepIndex + 1, stepCount)}
                </span>
              </div>
              <p
                className="truncate text-sm font-semibold text-ink"
                title={activeStep?.action || COPY.voiceCoach.title}
              >
                {activeStep?.action || COPY.voiceCoach.title}
              </p>
            </div>
          </div>

          {isHolding && (
            <span className="shrink-0 animate-pulse rounded-full bg-blush px-2.5 py-1 text-2xs font-bold text-ink">
              {COPY.voiceCoach.countdown(countdownRemaining)}
            </span>
          )}
        </div>

        {/* Row 2: Audio Controls Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-ink/5 pt-3">
          {/* Playback Controls (Prev, Primary Action, Next) */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <CircleButton
              label={COPY.voiceCoach.prevStep}
              size={36}
              disabled={currentStepIndex === 0}
              onClick={prevStep}
            >
              <Icon icon={SkipPreviousRoundedIcon} size="md" />
            </CircleButton>

            {isPlaying ? (
              <button
                type="button"
                onClick={pauseCoach}
                aria-label={COPY.voiceCoach.pause}
                className="flex h-9 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-full bg-ink px-3 sm:px-3.5 text-xs font-medium text-white shadow-sm transition-all hover:bg-ink/85 active:scale-95"
              >
                <Icon icon={PauseRoundedIcon} size="sm" />
                <span>{COPY.voiceCoach.pauseShort}</span>
              </button>
            ) : isPaused ? (
              <button
                type="button"
                onClick={resumeCoach}
                aria-label={COPY.voiceCoach.resume}
                className="flex h-9 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-full bg-orange px-3 sm:px-3.5 text-xs font-medium text-white shadow-sm transition-all hover:bg-orange/90 active:scale-95"
              >
                <Icon icon={PlayArrowRoundedIcon} size="sm" />
                <span>{COPY.voiceCoach.resumeShort}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={startCoach}
                aria-label={COPY.voiceCoach.play}
                className="flex h-9 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-full bg-orange px-3 sm:px-3.5 text-xs font-medium text-white shadow-sm transition-all hover:bg-orange/90 active:scale-95"
              >
                <Icon icon={PlayArrowRoundedIcon} size="sm" />
                <span>{COPY.voiceCoach.playShort}</span>
              </button>
            )}

            <CircleButton
              label={COPY.voiceCoach.nextStep}
              size={36}
              disabled={currentStepIndex >= stepCount - 1}
              onClick={nextStep}
            >
              <Icon icon={SkipNextRoundedIcon} size="md" />
            </CircleButton>
          </div>

          {/* Settings & Audio Toggles (Speed, Voice Switcher, Sound Mute) */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Speech Rate Toggle */}
            <button
              type="button"
              onClick={cycleSpeed}
              aria-label={COPY.voiceCoach.speed(speed)}
              className="relative flex h-9 min-w-[36px] shrink-0 items-center justify-center rounded-full border before:absolute before:-inset-1 border-ink/15 bg-canvas px-2 text-2xs font-semibold text-ink transition-colors hover:bg-cream"
            >
              {COPY.voiceCoach.speedDisplay(speed)}
            </button>

            {/* Voice Switcher (if multiple natural voices available) */}
            {availableVoiceCount > 1 && (
              <CircleButton
                label={COPY.voiceCoach.switchVoice}
                size={36}
                onClick={cycleVoice}
              >
                <Icon icon={RecordVoiceOverRoundedIcon} size="sm" />
              </CircleButton>
            )}

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
      </div>

      {/* Subtext ticker / cue status */}
      <div className="mt-2.5 flex items-center justify-between border-t border-ink/5 pt-2 text-2xs text-ink/60">
        <p className="truncate" aria-live="polite">
          {statusText}
        </p>
        <span className="shrink-0 text-3xs text-ink/60">
          {activeVoiceDisplayName ? COPY.voiceCoach.voiceNameDisplay(activeVoiceDisplayName) : COPY.voiceCoach.techNote}
        </span>
      </div>
    </section>
  );
}
