'use client';

import React from 'react';
import PriorityHighIcon from '@mui/icons-material/PriorityHigh';
import { useRoutine } from '../../contexts/RoutineContext';
import type { Routine } from '../../types/routine';
import { Callout } from '../feedback/Callout';
import { Icon } from '../ui/Icon';
import { IconTile } from '../ui/IconTile';

import { useLocale } from '../../contexts/LocaleContext';
interface MissingDataBannerProps {
  routine?: Routine | null;
  className?: string;
}

export function MissingDataBanner({ routine: propRoutine, className }: MissingDataBannerProps = {}) {
  const { copy } = useLocale();
  const { routine, missingDataFlagEnabled } = useRoutine();
  const current = propRoutine !== undefined ? propRoutine : routine;

  if (!missingDataFlagEnabled || !current) return null;

  const flags = current.missingDataFlags ?? [];
  const inferredSteps = current.steps?.filter((item) => item.inferred) ?? [];

  if (flags.length === 0 && inferredSteps.length === 0) return null;

  return (
    <Callout
      tone="cream"
      role="alert"
      className={className}
      icon={
        <IconTile variant="outline" shape="circle" size={32}>
          <Icon icon={PriorityHighIcon} size="sm" />
        </IconTile>
      }
    >
      <p className="font-semibold text-xs text-ink">
        {copy.missingData.missingDataTitle}
      </p>

      {flags.length > 0 ? (
        <div className="mt-1 space-y-1.5">
          {flags.map((flag, idx) => {
            const step = current.steps?.find((item) => item.id === flag.stepId);
            return (
              <div key={`${flag.stepId || idx}-${flag.parameter}`} className="text-xs">
                <p>
                  {copy.missingData.caution}{' '}
                  <span className="font-medium text-ink">{step?.action ?? flag.parameter}</span>.
                </p>
                <p className="mt-0.5 text-2xs text-ink/70">
                  {flag.fallback}
                  {flag.sourceGuideline && (
                    <span className="ms-1 text-ink/60 font-normal">({flag.sourceGuideline})</span>
                  )}
                </p>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="mt-1 space-y-1.5">
          {inferredSteps.map((step) => (
            <div key={step.id} className="text-xs">
              <p>
                {copy.missingData.caution}{' '}
                <span className="font-medium text-ink">{step.action}</span>.
              </p>
              <p className="mt-0.5 text-2xs text-ink/70">
                {step.inferredProvenance?.rationale || copy.missingData.fallback}
                {step.inferredProvenance?.source && (
                  <span className="ms-1 text-ink/60 font-normal">({step.inferredProvenance.source})</span>
                )}
              </p>
            </div>
          ))}
        </div>
      )}
    </Callout>
  );
}