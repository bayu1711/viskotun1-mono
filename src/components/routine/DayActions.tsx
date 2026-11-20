'use client';

import React from 'react';
import CheckIcon from '@mui/icons-material/Check';
import { useRoutine } from '../../contexts/RoutineContext';
import { COPY } from '../../data/copy';
import { cn } from '../../utils/cn';
import { Icon } from '../ui/Icon';
import { PillButton } from '../ui/PillButton';

interface DayActionsProps {
  onLogFeedback?: () => void;
  size?: 'md' | 'lg';
  className?: string;
}

/** "Mark today complete" + "log feedback" pair shared by the routine page and assistant routine card. */
export function DayActions({ onLogFeedback, size = 'lg', className }: DayActionsProps) {
  const {
    markTodayComplete,
    advanceToNextDay,
    simulatePastDays,
    simulateFullCompletion,
    simulateLapse,
    dayIsComplete,
    currentDay,
    totalDays,
    openFeedbackDrawer,
    feedbackMetric,
    isAdmin
  } = useRoutine();
  const handleLog = onLogFeedback ?? (() => openFeedbackDrawer());

  return (
    <div className={cn('space-y-3', className)}>
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        <PillButton
          size={size}
          variant={dayIsComplete ? 'success' : 'primary'}
          onClick={markTodayComplete}
          disabled={dayIsComplete}
        >
          {dayIsComplete ? (
            <>
              <Icon icon={CheckIcon} size="xs" />
              <span>{COPY.dayActions.dayLogged(currentDay)}</span>
            </>
          ) : (
            COPY.dayActions.markComplete
          )}
        </PillButton>
        <PillButton size={size} variant="outline" onClick={() => handleLog()} aria-haspopup="dialog">
          {COPY.dayActions.logFeedback(feedbackMetric?.name)}
        </PillButton>
      </div>

      {isAdmin && (
        <div className="rounded-xl border border-ink/10 bg-cream/30 p-3 text-xs">
          <div className="flex items-center justify-between font-mono text-[11px] font-medium uppercase tracking-wider text-ink/70">
            <span>{COPY.dayActions.adminControlEyebrow}</span>
            <span className="rounded bg-ink/5 px-1.5 py-0.5">Admin Only</span>
          </div>
          <div className="mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <PillButton
              size="sm"
              variant="outline"
              onClick={() => advanceToNextDay()}
              disabled={currentDay >= totalDays}
            >
              {COPY.dayActions.advanceToNextDay(currentDay + 1)}
            </PillButton>
            <PillButton
              size="sm"
              variant="outline"
              onClick={() => simulatePastDays(4)}
            >
              {COPY.dayActions.simulatePastDays(4)}
            </PillButton>
            <PillButton
              size="sm"
              variant="outline"
              onClick={() => simulateLapse(3)}
              title="Simulates 3-day inactivity to trigger compassionate re-entry"
            >
              Simulate 3-Day Lapse
            </PillButton>
            <PillButton
              size="sm"
              variant="outline"
              onClick={() => simulateFullCompletion()}
            >
              {COPY.dayActions.simulateFullCompletion}
            </PillButton>
          </div>
        </div>
      )}
    </div>
  );
}