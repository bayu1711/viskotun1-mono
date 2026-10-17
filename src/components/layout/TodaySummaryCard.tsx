'use client';

import React from 'react';
import { useRoutine } from '../../contexts/RoutineContext';
import { COPY } from '../../data/copy';
import { cn } from '../../utils/cn';
import { ProgressRing } from '../ui/ProgressRing';

interface TodaySummaryCardProps {
  className?: string;
}

export function TodaySummaryCard({ className }: TodaySummaryCardProps) {
  const { routine, todayPercent, todayFraction, currentDay, totalDays } = useRoutine();

  if (!routine) {
    return (
      <section aria-label={COPY.shell.todaySummaryLabel} className={cn('rounded-card bg-ink p-5 text-white', className)}>
        <p className="text-xs text-white/50">{COPY.shell.noActiveRoutine}</p>
        <p className="mt-2 text-2xs leading-relaxed text-white/70">
          {COPY.shell.noActivePrompt}
        </p>
      </section>
    );
  }

  return (
    <section aria-label={COPY.shell.todaySummaryLabel} className={cn('rounded-card bg-ink p-5 text-white', className)}>
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-sm text-white/60 font-medium">{routine.shortTitle}</p>
        <ProgressRing value={todayFraction} size={36} tone="orange" decorative />
      </div>
      <p className="mt-3 text-4xl font-light tabular-nums">
        {todayPercent}
        <span className="text-white/40">{COPY.common.percentSign}</span>
      </p>
      <div className="mt-2 flex items-center justify-between">
        <p className="text-xs text-white/50">{COPY.shell.dayOfTotal(currentDay, totalDays)}</p>
        <span className="inline-flex items-center rounded-full bg-orange/20 px-2 py-0.5 text-3xs font-semibold text-orange">
          Day {currentDay}
        </span>
      </div>
    </section>
  );
}