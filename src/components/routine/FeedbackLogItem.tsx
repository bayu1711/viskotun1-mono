import React from 'react';
import type { FeedbackLog } from '../../types/routine';
import { cn } from '../../utils/cn';
import { severityTone } from '../../utils/tones';
import { IconTile } from '../ui/IconTile';

import { useLocale } from '../../contexts/LocaleContext';
interface FeedbackLogItemProps {
  log: FeedbackLog;
}

export function FeedbackLogItem({ log }: FeedbackLogItemProps) {
  const { copy } = useLocale();
  const tone = severityTone(log.score, copy.severityLevels);

  return (
    <li className="flex items-center gap-3 rounded-tile border border-ink/10 bg-canvas/60 p-2.5 pe-4 transition-colors hover:border-ink/20">
      <IconTile variant="plain" size={40} decorative={false} className={cn('text-base font-medium rounded-full shadow-2xs', tone.chip)}>
        {log.score}
      </IconTile>
      <div className="min-w-0 flex-1">
        <p className="text-sm">{copy.routine.feedbackDay(log.day)}</p>
        <p className="truncate text-xs text-ink/60">{log.note || copy.routine.noNotes}</p>
      </div>
      <span className="text-xs text-ink/60">{tone.label}</span>
    </li>
  );
}
