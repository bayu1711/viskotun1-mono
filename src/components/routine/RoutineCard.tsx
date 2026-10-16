'use client';

import React from 'react';
import NorthEastIcon from '@mui/icons-material/NorthEast';
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
import { DayActions } from '../protocol/DayActions';
import { RoutineStepRow } from './RoutineStepRow';

export function RoutineCard() {
  const { routine, escalationPaused } = useRoutine();
  const { closeAssistant } = useAssistant();

  if (!routine) return null;

  const stopRule = stopRuleOf(routine);
  const rule = routine.progressionRules[0];

  return (
    <Panel aria-label={COPY.protocolCard.label} className="sm:p-5">
      <SectionHeading
        eyebrow={COPY.protocolCard.eyebrow(routine.phase)}
        title={COPY.protocolCard.title}
        action={
          <CircleButton label={COPY.protocolCard.openRoutine} href={ROUTES.routine} onClick={closeAssistant}>
            <Icon icon={NorthEastIcon} size="md" />
          </CircleButton>
        }
      />

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
        <Callout tone="cream" className="mt-3 rounded-tile">
          {COPY.common.warningPrefix} {stopRule.text}
        </Callout>
      )}

      {rule && (
        <p className="mt-3 px-1 text-xs lowercase leading-relaxed text-ink/45">
          {COPY.protocolCard.rulePrefix} {rule.condition.toLowerCase()} {COPY.protocolCard.ruleArrow}{' '}
          <span className="text-ink">{rule.action.toLowerCase()}</span>
        </p>
      )}

      <DayActions className="mt-5 gap-2" size="md" />

      {escalationPaused && (
        <p role="status" className="mt-3 text-center text-xs lowercase text-danger">
          {COPY.safety.escalationShort}
        </p>
      )}
    </Panel>
  );
}

export const ProtocolCard = RoutineCard;
