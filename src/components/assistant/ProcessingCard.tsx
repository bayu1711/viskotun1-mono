import React from 'react';
import CheckIcon from '@mui/icons-material/Check';
import { useExtractionProgress } from '../../hooks/useExtractionProgress';
import { cn } from '../../utils/cn';
import { EXTRACTION_SLOW_HINT_MS } from '../../data/config';
import { Icon } from '../ui/Icon';

import { useLocale } from '../../contexts/LocaleContext';
type StageState = 'done' | 'active' | 'idle';

const STAGE_DOT: Record<StageState, string> = {
  done: 'bg-ink text-white',
  active: 'animate-pulse border border-ink',
  idle: 'border border-ink/20'
};


interface ProcessingCardProps {
  source: string;
  createdAt: number;
}

export function ProcessingCard({ source, createdAt }: ProcessingCardProps) {
  const { copy } = useLocale();
  const stageCount = copy.processing.stages.length;
  // The stages are paced by time, not by the server. Cap them at the last stage so the card keeps
  // saying "Extracting" until the real reply replaces it; it used to flip to "queued" and
  // "Draft ready" after ~5 s while a real paper was still being read.
  const { stage, done: reachedLastStage, elapsedMs } = useExtractionProgress(createdAt, stageCount - 1);
  const isSlow = reachedLastStage && elapsedMs >= EXTRACTION_SLOW_HINT_MS;

  return (
    <article className="rounded-card bg-white p-5" aria-live="polite" aria-busy="true">
      <p className="text-xs text-ink/70">{copy.processing.extracting}</p>
      <p className="mt-1 truncate text-lg">{source}</p>
      <ol className="mt-4 space-y-2.5">
        {copy.processing.stages.map((label, index) => {
          const state = stageState(index, stage);
          return (
            <li key={label} className="flex items-center gap-3 text-sm">
              <span className={cn('flex h-6 w-6 shrink-0 items-center justify-center rounded-full', STAGE_DOT[state])}>
                {state === 'done' && <Icon icon={CheckIcon} size="xs" />}
              </span>
              <span className={cn(state === 'idle' && 'text-ink/70')}>{label}</span>
            </li>);

        })}
      </ol>
      {isSlow &&
      <p role="status" className="mt-4 text-xs leading-relaxed text-ink/80">
          {copy.processing.slowHint}
        </p>
      }
    </article>);

}

function stageState(index: number, current: number): StageState {
  if (index < current) return 'done';
  if (index === current) return 'active';
  return 'idle';
}