import React from 'react';
import { useRoutine } from '../../contexts/RoutineContext';
import type { LocaleCopy } from '../../data/locales/types';
import type { ProgressionRule } from '../../types/routine';
import { type ProgressionStatus, progressionStatus } from '../../utils/routineMetrics';
import { Panel, type PanelTone } from '../ui/Panel';
import { SectionHeading } from '../ui/SectionHeading';

import { useLocale } from '../../contexts/LocaleContext';
const STATUS_TONE: Record<ProgressionStatus, PanelTone> = {
  paused: 'blush',
  ready: 'mint',
  holding: 'cream'
};

export function ProgressionPanel() {
  const { copy } = useLocale();
  const { routine, escalationPaused, progressionReady, feedbackMetric } = useRoutine();
  const status = progressionStatus(escalationPaused, progressionReady);

  return (
    <Panel tone={STATUS_TONE[status]} aria-live="polite">
      <SectionHeading eyebrow={copy.dashboard.progressionEyebrow} title={copy.dashboard.progressionTitle} />
      <p className="mt-4 text-sm leading-relaxed">
        {progressionMessage(copy, status, routine.progressionRules?.[0], feedbackMetric?.escalationMessage)}
      </p>
    </Panel>
  );
}

function progressionMessage(
  copy: LocaleCopy,
  status: ProgressionStatus,
  rule: ProgressionRule | undefined,
  escalationMessage?: string
) {
  if (status === 'paused') return escalationMessage || copy.safety.pausedRecommendation;
  if (status === 'ready' && rule) return copy.dashboard.progressionReady(rule.condition, rule.action);
  return rule ? copy.dashboard.progressionHoldingRule(rule.condition, rule.action) : copy.dashboard.progressionHolding;
}