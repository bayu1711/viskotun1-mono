import React from 'react';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import ScienceOutlinedIcon from '@mui/icons-material/ScienceOutlined';
import TimelineIcon from '@mui/icons-material/Timeline';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { useLocale } from '../../contexts/LocaleContext';
import { useRoutine } from '../../contexts/RoutineContext';
import {
  complianceLevel,
  isRandomizedTrial,
  progressionStatus
} from '../../utils/routineMetrics';
import { formatPhaseLabel, formatRoutineTitle } from '../../utils/text';
import { StatCard, type StatCardProps } from './StatCard';

export function KeyMetrics() {
  const { copy } = useLocale();
  const { routine, adherenceRate, currentDay, totalDays, progressionReady, escalationPaused } = useRoutine();
  const status = progressionStatus(escalationPaused, progressionReady);
  const isRct = isRandomizedTrial(routine.paper);

  const metrics: StatCardProps[] = [
    {
      label: copy.dashboard.activeRoutine,
      value: formatRoutineTitle(routine.shortTitle),
      caption: copy.shell.dayOfTotal(currentDay, totalDays),
      tone: 'orange',
      icon: AssignmentOutlinedIcon
    },
    {
      label: copy.dashboard.adherence,
      value: `${adherenceRate}${copy.common.percentSign}`,
      caption: copy.dashboard.compliance[complianceLevel(adherenceRate)],
      tone: 'yellow',
      icon: TrendingUpIcon
    },
    {
      label: copy.dashboard.currentPhase,
      value: formatPhaseLabel(routine.phaseLabel),
      caption: copy.dashboard.phase[status],
      tone: status === 'paused' ? 'peach' : 'mint',
      icon: TimelineIcon
    },
    {
      label: copy.dashboard.evidenceScore,
      value: isRct ? copy.evidence.high : copy.evidence.moderate,
      caption: copy.dashboard.evidenceCaption(
        isRct ? copy.evidence.rctShort : copy.evidence.pilotShort,
        routine.paper.sampleSize
      ),
      tone: 'sky',
      icon: ScienceOutlinedIcon
    }
  ];

  return (
    <section aria-label={copy.dashboard.metricsLabel} className="mt-6 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
      {metrics.map((metric) => (
        <StatCard key={metric.label} {...metric} />
      ))}
    </section>
  );
}
