import React from 'react';
import { COPY } from '../../data/copy';
import type { RoutineStep, ProtocolStep } from '../../types/routine';
import { cn } from '../../utils/cn';
import type { StepDisplay } from '../../utils/steps';
import { toneStyles } from '../../utils/tones';

interface TaskStatListProps {
  step: RoutineStep | ProtocolStep;
  display: StepDisplay;
}

export function TaskStatList({ step, display }: TaskStatListProps) {
  const styles = toneStyles[step.tone];
  const stats = [
  { term: display.statLabel, value: `${display.statValue}${step.inferred ? COPY.task.inferredMarker : ''}` },
  { term: COPY.task.frequency, value: step.frequency },
  { term: COPY.task.source, value: step.inferred ? COPY.task.sourceDefaulted : COPY.task.sourcePaper }];


  return (
    <dl className={cn('mt-6 grid grid-cols-3 gap-3 border-b pb-4', styles.divider)}>
      {stats.map((stat) =>
      <div key={stat.term}>
          <dt className={cn('text-xs', styles.muted)}>{stat.term}</dt>
          <dd className="mt-0.5 text-body">{stat.value}</dd>
        </div>
      )}
    </dl>);

}