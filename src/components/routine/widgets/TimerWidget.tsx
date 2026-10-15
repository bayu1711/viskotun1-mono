'use client';

import React, { useEffect, useRef, useState } from 'react';
import PauseOutlinedIcon from '@mui/icons-material/PauseOutlined';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import RotateLeftIcon from '@mui/icons-material/RotateLeft';
import { COPY } from '../../../data/copy';
import type { DataCollectionField } from '../../../types/protocol';
import { CircleButton } from '../../ui/CircleButton';
import { Icon } from '../../ui/Icon';

interface TimerWidgetProps {
  field: DataCollectionField;
  value: number;
  onChange: (value: number) => void;
}

export function TimerWidget({ field, value, onChange }: TimerWidgetProps) {
  const [seconds, setSeconds] = useState(typeof value === 'number' && value > 0 ? value : 0);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Safe timer cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  const startTimer = () => {
    if (isRunning) return;
    setIsRunning(true);
    intervalRef.current = setInterval(() => {
      setSeconds((prev) => {
        const next = prev + 1;
        onChange(next);
        return next;
      });
    }, 1000);
  };

  const pauseTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsRunning(false);
  };

  const resetTimer = () => {
    pauseTimer();
    setSeconds(0);
    onChange(0);
  };

  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full text-center">
      <div className="mt-4 flex flex-col items-center">
        <p className="text-giant font-light leading-none tabular-nums text-ink">
          {formatTime(seconds)}
        </p>
        <span className="mt-1 text-xs text-ink/50 lowercase">
          {seconds} seconds elapsed {field.max ? `· ${COPY.morphing.widgets.timer.targetDuration(field.max)}` : ''}
        </span>

        <div className="mt-6 flex items-center justify-center gap-4">
          <CircleButton label="Reset timer" onClick={resetTimer} size={40}>
            <Icon icon={RotateLeftIcon} size="md" />
          </CircleButton>

          {isRunning ? (
            <CircleButton
              label={COPY.morphing.widgets.timer.pause}
              variant="solid"
              onClick={pauseTimer}
              size={40}
              className="bg-mint text-ink"
            >
              <Icon icon={PauseOutlinedIcon} size="md" />
            </CircleButton>
          ) : (
            <CircleButton
              label={COPY.morphing.widgets.timer.start}
              variant="solid"
              onClick={startTimer}
              size={40}
              className="bg-ink text-white"
            >
              <Icon icon={PlayArrowIcon} size="md" />
            </CircleButton>
          )}
        </div>
      </div>

      {field.instructions && (
        <p className="mt-5 rounded-tile bg-ink/5 p-3 text-2xs text-ink/75 leading-relaxed text-left">
          <strong className="text-ink font-medium">Protocol Test Guidelines: </strong>
          {field.instructions}
        </p>
      )}
    </div>
  );
}
