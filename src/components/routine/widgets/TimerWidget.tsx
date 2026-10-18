'use client';

import React, { useEffect, useRef, useState } from 'react';
import PauseOutlinedIcon from '@mui/icons-material/PauseOutlined';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import RotateLeftIcon from '@mui/icons-material/RotateLeft';
import { COPY } from '../../../data/copy';
import type { DataCollectionField } from '../../../types/routine';
import { CircleButton } from '../../ui/CircleButton';
import { Icon } from '../../ui/Icon';

interface TimerWidgetProps {
  field: DataCollectionField;
  value: number;
  onChange: (value: number) => void;
}

function formatTime(totalSec: number) {
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/** Stopwatch by default; with timerMode 'countdown' it counts down from `field.max` seconds. The logged value is always elapsed seconds. */
export function TimerWidget({ field, value, onChange }: TimerWidgetProps) {
  const isCountdown = field.timerMode === 'countdown' && (field.max ?? 0) > 0;
  const total = isCountdown ? field.max ?? 0 : 0;
  const [elapsed, setElapsed] = useState(typeof value === 'number' && value > 0 ? value : 0);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const stopInterval = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // Safe timer cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  // Report elapsed time to the form outside the state updater, and stop when a countdown ends
  useEffect(() => {
    onChangeRef.current(elapsed);
    if (isCountdown && elapsed >= total) {
      stopInterval();
      setIsRunning(false);
    }
  }, [elapsed, isCountdown, total]);

  const startTimer = () => {
    if (isRunning || (isCountdown && elapsed >= total)) return;
    setIsRunning(true);
    intervalRef.current = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
  };

  const pauseTimer = () => {
    stopInterval();
    setIsRunning(false);
  };

  const resetTimer = () => {
    pauseTimer();
    setElapsed(0);
  };

  const remaining = Math.max(0, total - elapsed);
  const shown = isCountdown ? remaining : elapsed;

  return (
    <div className="w-full text-center">
      <div className="mt-4 flex flex-col items-center">
        <p role="timer" aria-live="off" className="text-giant font-light leading-none tabular-nums text-ink">
          {formatTime(shown)}
        </p>
        <span className="mt-1 text-xs text-ink/60">
          {isCountdown
            ? COPY.morphing.widgets.timer.remainingSummary(remaining, total)
            : COPY.morphing.widgets.timer.elapsedSummary(elapsed, field.max)}
        </span>

        <div className="mt-6 flex items-center justify-center gap-4">
          <CircleButton label={COPY.morphing.widgets.timer.reset} onClick={resetTimer} size={40}>
            <Icon icon={RotateLeftIcon} size="md" />
          </CircleButton>

          {isRunning ? (
            <CircleButton
              label={COPY.morphing.widgets.timer.pause}
              variant="solid"
              onClick={pauseTimer}
              size={40}
              className="bg-mint text-ink hover:bg-mint/90 shadow-2xs"
            >
              <Icon icon={PauseOutlinedIcon} size="md" />
            </CircleButton>
          ) : (
            <CircleButton
              label={isCountdown ? COPY.morphing.widgets.timer.startCountdown : COPY.morphing.widgets.timer.start}
              variant="solid"
              onClick={startTimer}
              disabled={isCountdown && remaining === 0}
              size={40}
              className="bg-orange text-white hover:bg-orange/90 shadow-2xs"
            >
              <Icon icon={PlayArrowIcon} size="md" />
            </CircleButton>
          )}
        </div>
      </div>

      {field.instructions && (
        <p className="mt-5 rounded-tile bg-ink/5 p-3 text-2xs text-ink/75 leading-relaxed text-left">
          <strong className="text-ink font-medium">{COPY.morphing.widgets.protocolGuidelines}</strong>
          {field.instructions}
        </p>
      )}
    </div>
  );
}
