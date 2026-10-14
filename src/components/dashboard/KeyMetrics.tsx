import React from 'react';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import ScienceOutlinedIcon from '@mui/icons-material/ScienceOutlined';
import TimelineIcon from '@mui/icons-material/Timeline';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { useProtocol } from '../../contexts/ProtocolContext';
import { COPY } from '../../data/copy';
import {
  complianceLevel,
  isRandomizedTrial,
  progressionStatus } from
'../../utils/protocolMetrics';
import { StatCard, type StatCardProps } from './StatCard';

export function KeyMetrics() {
  const { protocol, adherenceRate, currentDay, totalDays, progressionReady, escalationPaused } = useProtocol();
  const status = progressionStatus(escalationPaused, progressionReady);
  const isRct = isRandomizedTrial(protocol.paper);

  const metrics: StatCardProps[] = [
  {
    label: COPY.dashboard.activeProtocol,
    value: protocol.shortTitle,
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
    value: protocol.phaseLabel,
    caption: COPY.dashboard.phase[status],
    tone: status === 'paused' ? 'white' : 'mint',
    icon: TimelineIcon
  },
  {
    label: COPY.dashboard.evidenceScore,
    value: isRct ? COPY.evidence.high : COPY.evidence.moderate,
    caption: COPY.dashboard.evidenceCaption(
      isRct ? COPY.evidence.rctShort : COPY.evidence.pilotShort,
      protocol.paper.sampleSize
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