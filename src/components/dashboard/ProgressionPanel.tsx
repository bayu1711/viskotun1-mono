import React from 'react';
import { useRoutine } from '../../contexts/RoutineContext';
import { COPY } from '../../data/copy';
import type { ProgressionRule } from '../../types/routine';
import { type ProgressionStatus, progressionStatus } from '../../utils/routineMetrics';
import { Panel, type PanelTone } from '../ui/Panel';
import { SectionHeading } from '../ui/SectionHeading';

const STATUS_TONE: Record<ProgressionStatus, PanelTone> = {
  paused: 'blush',
  ready: 'mint',
  holding: 'white'
};

export function ProgressionPanel() {
  const { routine, escalationPaused, progressionReady, feedbackMetric } = useRoutine();
  const status = progressionStatus(escalationPaused, progressionReady);

  return (
    <Panel tone={STATUS_TONE[status]} aria-live="polite">
      <SectionHeading eyebrow={COPY.dashboard.progressionEyebrow} title={COPY.dashboard.progressionTitle} />
      <p className="mt-4 text-sm leading-relaxed">
        {progressionMessage(status, routine.progressionRules[0], feedbackMetric?.escalationMessage)}
      </p>
    </Panel>
  );
}

function progressionMessage(
  status: ProgressionStatus,
  rule: ProgressionRule | undefined,
  escalationMessage?: string
) {
  if (status === 'paused') return escalationMessage || COPY.safety.pausedRecommendation;
  if (status === 'ready' && rule) return COPY.dashboard.progressionReady(rule.condition, rule.action);
  return COPY.dashboard.progressionHolding;
}