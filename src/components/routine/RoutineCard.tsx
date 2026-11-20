'use client';

import React from 'react';
import NorthEastIcon from '@mui/icons-material/NorthEast';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import { useAssistant } from '../../contexts/AssistantContext';
import { useRoutine } from '../../contexts/RoutineContext';
import { COPY } from '../../data/copy';
import { ROUTES } from '../../data/navigation';
import { stopRuleOf } from '../../utils/routineMetrics';
import { Callout } from '../feedback/Callout';
import { EmptyState } from '../feedback/EmptyState';
import { CircleButton } from '../ui/CircleButton';
import { Icon } from '../ui/Icon';
import { Panel } from '../ui/Panel';
import { SectionHeading } from '../ui/SectionHeading';
import { DayActions } from './DayActions';
import { MissingDataBanner } from './MissingDataBanner';
import { RoutineStepRow } from './RoutineStepRow';

export function RoutineCard() {
  const { routine, escalationPaused } = useRoutine();
  const { closeAssistant } = useAssistant();

  if (!routine) return null;

  const stopRule = stopRuleOf(routine);
  const rule = routine.progressionRules[0];

  return (
    <Panel aria-label={COPY.routineCard.label} className="sm:p-5">
      <SectionHeading
        eyebrow={COPY.routineCard.eyebrow(routine.phase)}
        title={COPY.routineCard.title}
        action={
          <CircleButton label={COPY.routineCard.openRoutine} href={ROUTES.routine} onClick={closeAssistant}>
            <Icon icon={NorthEastIcon} size="md" />
          </CircleButton>
        }
      />

      <MissingDataBanner routine={routine} className="mt-3 rounded-tile" />

      {routine.steps.length === 0 ? (
        <EmptyState className="mt-5" title={COPY.routine.emptyStepsTitle} description={COPY.routine.emptyStepsBody} />
      ) : (
        <ul className="mt-5 space-y-2">
          {routine.steps.map((step) => (
            <RoutineStepRow key={step.id} step={step} />
          ))}
        </ul>
      )}

      {stopRule && (
        <Callout
          tone="cream"
          icon={<Icon icon={WarningAmberOutlinedIcon} size="sm" className="mt-0.5 text-ink/75" />}
          className="mt-3 rounded-tile"
        >
          {stopRule.text}
        </Callout>
      )}

      {rule && (
        <p className="mt-3 px-1 text-xs leading-relaxed text-ink/60">
          {COPY.routineCard.rulePrefix} {COPY.routineCard.ruleCondition(rule.condition)} {COPY.routineCard.ruleArrow}{' '}
          <span className="text-ink">{rule.action.toLowerCase()}</span>
        </p>
      )}

      <DayActions className="mt-5 gap-2" size="md" />

      {escalationPaused && (
        <p role="status" className="mt-3 text-center text-xs text-danger">
          {COPY.safety.escalationShort}
        </p>
      )}
    </Panel>
  );
}
