'use client';

import React from 'react';
import { useProtocol } from '../../contexts/ProtocolContext';
import { COPY } from '../../data/copy';
import { cn } from '../../utils/cn';
import { PillButton } from '../ui/PillButton';

interface DayActionsProps {
  onLogPain?: () => void;
  size?: 'md' | 'lg';
  className?: string;
}

/** "Mark today complete" + "log pain" pair shared by the routine page and assistant protocol card. */
export function DayActions({ onLogPain, size = 'lg', className }: DayActionsProps) {
  const { markTodayComplete, dayIsComplete, currentDay, openPainLog } = useProtocol();
  const handleLogPain = onLogPain ?? openPainLog;

  return (
    <div className={cn('grid grid-cols-1 gap-2.5 sm:grid-cols-2', className)}>
      <PillButton
        size={size}
        variant={dayIsComplete ? 'success' : 'primary'}
        onClick={markTodayComplete}
        disabled={dayIsComplete}
      >
        {dayIsComplete ? COPY.dayActions.dayLogged(currentDay) : COPY.dayActions.markComplete}
      </PillButton>
      <PillButton size={size} variant="outline" onClick={handleLogPain} aria-haspopup="dialog">
        {COPY.dayActions.logPain}
      </PillButton>
    </div>
  );
}