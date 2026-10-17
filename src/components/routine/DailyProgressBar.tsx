import React from 'react';
import { motion } from 'framer-motion';
import { MOTION, PERCENT_MAX } from '../../data/config';
import { COPY } from '../../data/copy';
import { toPercent } from '../../utils/math';

interface DailyProgressBarProps {
  fraction: number;
  percent?: number;
}

export function DailyProgressBar({ fraction, percent }: DailyProgressBarProps) {
  const displayPercent = percent ?? toPercent(fraction);

  return (
    <div
      role="progressbar"
      aria-valuenow={displayPercent}
      aria-valuemin={0}
      aria-valuemax={PERCENT_MAX}
      aria-label={COPY.routine.progressLabel}
      className="mt-4 h-2 w-full overflow-hidden rounded-full bg-ink/10"
    >
      <motion.div
        className="h-full w-full origin-left rounded-full bg-orange"
        initial={false}
        animate={{ scaleX: fraction }}
        transition={MOTION.progress}
      />
    </div>
  );
}