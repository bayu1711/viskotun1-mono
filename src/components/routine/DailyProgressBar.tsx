import React from 'react';
import { motion } from 'framer-motion';
import { MOTION, PERCENT_MAX } from '../../data/config';
import { COPY } from '../../data/copy';
import { toFraction } from '../../utils/math';

interface DailyProgressBarProps {
  percent: number;
}

export function DailyProgressBar({ percent }: DailyProgressBarProps) {
  return (
    <div
      role="progressbar"
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={PERCENT_MAX}
      aria-label={COPY.routine.progressLabel}
      className="mt-4 h-hairline w-full overflow-hidden rounded-full bg-ink/10">
      
      <motion.div
        className="h-full w-full origin-left bg-ink"
        initial={false}
        animate={{ scaleX: toFraction(percent) }}
        transition={MOTION.progress} />
      
    </div>);

}