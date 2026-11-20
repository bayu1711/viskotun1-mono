'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import InsightsOutlinedIcon from '@mui/icons-material/InsightsOutlined';
import { useRoutine } from '../../contexts/RoutineContext';
import { EmptyState } from '../feedback/EmptyState';
import { Panel } from '../ui/Panel';
import { SectionHeading } from '../ui/SectionHeading';

import { useLocale } from '../../contexts/LocaleContext';
const DropOffChart = dynamic(
  () => import('./DropOffChart').then((mod) => mod.DropOffChart),
  {
    ssr: false,
    loading: () => <div className="mt-5 h-44 w-full animate-pulse rounded-card bg-canvas" />
  }
);

export function DropOffPanel() {
  const { copy } = useLocale();
  const { routine } = useRoutine();
  const insights = routine.community;
  const unit = insights.dropOffUnit;

  return (
    <Panel aria-label={copy.community.dropOffLabel}>
      <SectionHeading
        eyebrow={copy.community.dropOffEyebrow}
        title={unit === 'day' ? copy.community.hardestDays : copy.community.hardestWeeks}
        action={
          <span className="rounded-full bg-orange px-3 py-1.5 text-xs font-semibold text-ink shadow-2xs">
            {copy.community.peak(unit, insights.peakPeriod)}
          </span>
        }
      />

      {insights.dropOff.length === 0 ? (
        <EmptyState className="mt-5" icon={InsightsOutlinedIcon} title={copy.community.emptyChart} />
      ) : (
        <DropOffChart data={insights.dropOff} peakPeriod={insights.peakPeriod} unit={unit} />
      )}

      <p className="mt-4 text-sm leading-relaxed text-ink/60">
        <span className="text-ink">{insights.insightLead}</span> {insights.insightRest}
      </p>
    </Panel>
  );
}