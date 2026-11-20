import React from 'react';
import type { RoutineStep } from '../../types/routine';
import { cn } from '../../utils/cn';
import type { StepDisplay } from '../../utils/steps';
import { toneStyles } from '../../utils/tones';

import { useLocale } from '../../contexts/LocaleContext';
interface TaskStatListProps {
  step: RoutineStep;
  display: StepDisplay;
}

export function TaskStatList({ step, display }: TaskStatListProps) {
  const { copy } = useLocale();
  const styles = toneStyles[step.tone];
  const stats = [
  { term: display.statLabel, value: `${display.statValue}${step.inferred ? copy.task.inferredMarker : ''}` },
  { term: copy.task.frequency, value: step.frequency },
  { term: copy.task.source, value: step.inferred ? copy.task.sourceDefaulted : copy.task.sourcePaper }];


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