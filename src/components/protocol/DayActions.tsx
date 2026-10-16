'use client';

import React from 'react';
import { useRoutine } from '../../contexts/RoutineContext';
import { COPY } from '../../data/copy';
import { cn } from '../../utils/cn';
import { PillButton } from '../ui/PillButton';

interface DayActionsProps {
  onLogFeedback?: () => void;
  size?: 'md' | 'lg';
  className?: string;
}

/** "Mark today complete" + "log feedback" pair shared by the routine page and assistant routine card. */
export function DayActions({ onLogFeedback, size = 'lg', className }: DayActionsProps) {
  const { markTodayComplete, dayIsComplete, currentDay, openFeedbackDrawer, feedbackMetric } = useRoutine();
  const handleLog = onLogFeedback ?? (() => openFeedbackDrawer());

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
      <PillButton size={size} variant="outline" onClick={() => handleLog()} aria-haspopup="dialog">
        {COPY.dayActions.logFeedback(feedbackMetric?.name)}
      </PillButton>
    </div>
  );
}