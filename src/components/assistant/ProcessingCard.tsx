import React from 'react';
import CheckIcon from '@mui/icons-material/Check';
import { COPY } from '../../data/copy';
import { useExtractionProgress } from '../../hooks/useExtractionProgress';
import { cn } from '../../utils/cn';
import { Callout } from '../feedback/Callout';
import { Icon } from '../ui/Icon';

type StageState = 'done' | 'active' | 'idle';

const STAGE_DOT: Record<StageState, string> = {
  done: 'bg-ink text-white',
  active: 'animate-pulse border border-ink',
  idle: 'border border-ink/20'
};

const STAGES = COPY.processing.stages;

interface ProcessingCardProps {
  source: string;
  createdAt: number;
}

export function ProcessingCard({ source, createdAt }: ProcessingCardProps) {
  const { stage, done } = useExtractionProgress(createdAt, STAGES.length);

  return (
    <article className="rounded-card bg-white p-5" aria-live="polite" aria-busy={!done}>
      <p className="text-xs text-ink/60">{done ? COPY.processing.queued : COPY.processing.extracting}</p>
      <p className="mt-1 truncate text-lg">{source}</p>
      <ol className="mt-4 space-y-2.5">
        {STAGES.map((label, index) => {
          const state = stageState(index, stage);
          return (
            <li key={label} className="flex items-center gap-3 text-sm">
              <span className={cn('flex h-6 w-6 shrink-0 items-center justify-center rounded-full', STAGE_DOT[state])}>
                {state === 'done' && <Icon icon={CheckIcon} size="xs" />}
              </span>
              <span className={cn(state === 'idle' && 'text-ink/60')}>{label}</span>
            </li>);

        })}
      </ol>
      {done &&
      <Callout tone="mint" role="status" className="mt-4 rounded-tile px-4 py-3">
          {COPY.processing.ready}
        </Callout>
      }
    </article>);

}

function stageState(index: number, current: number): StageState {
  if (index < current) return 'done';
  if (index === current) return 'active';
  return 'idle';
}