'use client';

import React from 'react';
import NorthEastIcon from '@mui/icons-material/NorthEast';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import { useAssistant } from '../../contexts/AssistantContext';
import { useRoutine } from '../../contexts/RoutineContext';
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

import { useLocale } from '../../contexts/LocaleContext';
export function RoutineCard() {
  const { copy } = useLocale();
  const { routine, escalationPaused } = useRoutine();
  const { closeAssistant } = useAssistant();

  if (!routine) return null;

  const stopRule = stopRuleOf(routine);
  const rule = routine.progressionRules[0];

  return (
    <Panel aria-label={copy.routineCard.label} className="sm:p-5">
      <SectionHeading
        eyebrow={copy.routineCard.eyebrow(routine.phase)}
        title={copy.routineCard.title}
        action={
          <CircleButton label={copy.routineCard.openRoutine} href={ROUTES.routine} onClick={closeAssistant}>
            <Icon icon={NorthEastIcon} size="md" className="rtl:-scale-x-100" />
          </CircleButton>
        }
      />

      <MissingDataBanner routine={routine} className="mt-3 rounded-tile" />

      {routine.steps.length === 0 ? (
        <EmptyState className="mt-5" title={copy.routine.emptyStepsTitle} description={copy.routine.emptyStepsBody} />
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
          {copy.routineCard.rulePrefix} {copy.routineCard.ruleCondition(rule.condition)} {copy.routineCard.ruleArrow}{' '}
          <span className="text-ink">{rule.action.toLowerCase()}</span>
        </p>
      )}

      <DayActions className="mt-5 gap-2" size="md" />

      {escalationPaused && (
        <p role="status" className="mt-3 text-center text-xs text-danger">
          {copy.safety.escalationShort}
        </p>
      )}
    </Panel>
  );
}
