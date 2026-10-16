'use client';

import React from 'react';
import { useProtocol } from '../../contexts/ProtocolContext';
import { COPY } from '../../data/copy';
import { cn } from '../../utils/cn';
import { ProgressRing } from '../ui/ProgressRing';

interface TodaySummaryCardProps {
  className?: string;
}

export function TodaySummaryCard({ className }: TodaySummaryCardProps) {
  const { protocol, todayPercent, todayFraction, currentDay, totalDays } = useProtocol();

  if (!protocol) {
    return (
      <section aria-label={COPY.shell.todaySummaryLabel} className={cn('rounded-card bg-ink p-5 text-white', className)}>
        <p className="text-xs lowercase text-white/50">{COPY.shell.noActiveProtocol}</p>
        <p className="mt-2 text-2xs leading-relaxed lowercase text-white/70">
          upload a research paper or explore sample protocols to start tracking.
        </p>
      </section>
    );
  }

  return (
    <section aria-label={COPY.shell.todaySummaryLabel} className={cn('rounded-card bg-ink p-5 text-white', className)}>
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-sm lowercase text-white/50">{protocol.shortTitle}</p>
        <ProgressRing value={todayFraction} size={36} tone="light" decorative />
      </div>
      <p className="mt-3 text-4xl font-light tabular-nums">
        {todayPercent}
        <span className="text-white/40">{COPY.common.percentSign}</span>
      </p>
      <p className="mt-1 text-sm lowercase text-white/50">{COPY.shell.dayOfTotal(currentDay, totalDays)}</p>
    </section>
  );
}