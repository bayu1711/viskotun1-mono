import React from 'react';
import { COPY } from '../../data/copy';
import type { PainLog } from '../../types/protocol';
import { cn } from '../../utils/cn';
import { painTone } from '../../utils/tones';
import { IconTile } from '../ui/IconTile';

interface PainLogItemProps {
  log: PainLog;
}

export function PainLogItem({ log }: PainLogItemProps) {
  const tone = painTone(log.score);

  return (
    <li className="flex items-center gap-3 rounded-tile border border-ink p-2.5 pr-4">
      <IconTile variant="plain" size={40} decorative={false} className={cn('text-base font-light', tone.chip)}>
        {log.score}
      </IconTile>
      <div className="min-w-0 flex-1">
        <p className="text-sm lowercase">{COPY.routine.painDay(log.day)}</p>
        <p className="truncate text-xs text-ink/45">{log.note || COPY.routine.noNotes}</p>
      </div>
      <span className="text-xs lowercase text-ink/45">{tone.label}</span>
    </li>);

}