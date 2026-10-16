import React from 'react';
import FitnessCenterOutlinedIcon from '@mui/icons-material/FitnessCenterOutlined';
import { COPY } from '../../data/copy';
import type { RoutineStep, ProtocolStep } from '../../types/routine';
import { isWideStep } from '../../utils/steps';
import { EmptyState } from '../feedback/EmptyState';
import { TaskCard } from './TaskCard';

interface TaskGridProps {
  steps: (RoutineStep | ProtocolStep)[];
}

export function TaskGrid({ steps }: TaskGridProps) {
  if (steps.length === 0) {
    return (
      <EmptyState
        className="mt-2.5"
        icon={FitnessCenterOutlinedIcon}
        title={COPY.routine.emptyStepsTitle}
        description={COPY.routine.emptyStepsBody} />);


  }

  return (
    <div className="mt-2.5 grid grid-cols-2 gap-2.5">
      {steps.map((step, index) =>
      <TaskCard key={step.id} step={step} wide={isWideStep(index, steps.length)} />
      )}
    </div>);

}