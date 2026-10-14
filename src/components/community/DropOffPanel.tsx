import React from 'react';
import { useProtocol } from '../../contexts/ProtocolContext';
import { COPY } from '../../data/copy';
import { Panel } from '../ui/Panel';
import { SectionHeading } from '../ui/SectionHeading';
import { DropOffChart } from './DropOffChart';

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
        } />
      
      <DropOffChart data={insights.dropOff} peakPeriod={insights.peakPeriod} unit={unit} />
      <p className="mt-4 text-sm leading-relaxed text-ink/55">
        <span className="text-ink">{insights.insightLead}</span> {insights.insightRest}
      </p>
    </Panel>);

}