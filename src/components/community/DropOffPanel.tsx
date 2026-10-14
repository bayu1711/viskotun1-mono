'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import InsightsOutlinedIcon from '@mui/icons-material/InsightsOutlined';
import { useProtocol } from '../../contexts/ProtocolContext';
import { COPY } from '../../data/copy';
import { EmptyState } from '../feedback/EmptyState';
import { Panel } from '../ui/Panel';
import { SectionHeading } from '../ui/SectionHeading';

const DropOffChart = dynamic(
  () => import('./DropOffChart').then((mod) => mod.DropOffChart),
  {
    ssr: false,
    loading: () => <div className="mt-5 h-44 w-full animate-pulse rounded-card bg-canvas" />
  }
);

export function DropOffPanel() {
  const { protocol } = useProtocol();
  const insights = protocol.community;
  const unit = insights.dropOffUnit;

  return (
    <Panel aria-label={COPY.community.dropOffLabel}>
      <SectionHeading
        eyebrow={COPY.community.dropOffEyebrow}
        title={unit === 'day' ? COPY.community.hardestDays : COPY.community.hardestWeeks}
        action={
          <span className="rounded-full bg-ink px-3 py-1.5 text-xs lowercase text-white">
            {COPY.community.peak(unit, insights.peakPeriod)}
          </span>
        }
      />

      {insights.dropOff.length === 0 ? (
        <EmptyState className="mt-5" icon={InsightsOutlinedIcon} title={COPY.community.emptyChart} />
      ) : (
        <DropOffChart data={insights.dropOff} peakPeriod={insights.peakPeriod} unit={unit} />
      )}

      <p className="mt-4 text-sm leading-relaxed text-ink/55">
        <span className="text-ink">{insights.insightLead}</span> {insights.insightRest}
      </p>
    </Panel>
  );
}