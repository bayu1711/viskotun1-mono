import React from 'react';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import ScienceOutlinedIcon from '@mui/icons-material/ScienceOutlined';
import TimelineIcon from '@mui/icons-material/Timeline';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { useRoutine } from '../../contexts/RoutineContext';
import { COPY } from '../../data/copy';
import {
  complianceLevel,
  isRandomizedTrial,
  progressionStatus
} from '../../utils/routineMetrics';
import { StatCard, type StatCardProps } from './StatCard';

export function KeyMetrics() {
  const { routine, adherenceRate, currentDay, totalDays, progressionReady, escalationPaused } = useRoutine();
  const status = progressionStatus(escalationPaused, progressionReady);
  const isRct = isRandomizedTrial(routine.paper);

  const metrics: StatCardProps[] = [
    {
      label: COPY.dashboard.activeRoutine,
      value: routine.shortTitle,
    caption: COPY.shell.dayOfTotal(currentDay, totalDays),
    tone: 'ink',
    icon: AssignmentOutlinedIcon
  },
  {
    label: COPY.dashboard.adherence,
    value: `${adherenceRate}${COPY.common.percentSign}`,
    caption: COPY.dashboard.compliance[complianceLevel(adherenceRate)],
    tone: 'cream',
    icon: TrendingUpIcon
  },
  {
    label: COPY.dashboard.currentPhase,
    value: routine.phaseLabel,
    caption: COPY.dashboard.phase[status],
    tone: status === 'paused' ? 'white' : 'mint',
    icon: TimelineIcon
  },
  {
    label: COPY.dashboard.evidenceScore,
    value: isRct ? COPY.evidence.high : COPY.evidence.moderate,
    caption: COPY.dashboard.evidenceCaption(
      isRct ? COPY.evidence.rctShort : COPY.evidence.pilotShort,
      routine.paper.sampleSize
    ),
    tone: 'white',
    icon: ScienceOutlinedIcon
  }];


  return (
    <section aria-label={COPY.dashboard.metricsLabel} className="mt-6 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
      {metrics.map((metric) =>
      <StatCard key={metric.label} {...metric} />
      )}
    </section>);

}