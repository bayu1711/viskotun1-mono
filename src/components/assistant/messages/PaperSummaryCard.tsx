import React from 'react';
import { useProtocol } from '../../../contexts/ProtocolContext';
import { COPY } from '../../../data/copy';
import { isRandomizedTrial } from '../../../utils/protocolMetrics';
import { EvidenceBadgeChip } from '../../ui/EvidenceBadgeChip';
import { MetaItem } from './MetaItem';

interface PaperSummaryCardProps {
  intro: string;
}

export function PaperSummaryCard({ intro }: PaperSummaryCardProps) {
  const { protocol } = useProtocol();
  const { paper } = protocol;
  const meta = [
  { label: COPY.assistant.meta.sample, value: COPY.assistant.meta.sampleValue(paper.sampleSize) },
  {
    label: COPY.assistant.meta.design,
    value: isRandomizedTrial(paper) ? COPY.evidence.rctShort : COPY.evidence.pilotShort
  },
  { label: COPY.assistant.meta.year, value: String(paper.year) }];


  return (
    <article className="rounded-card bg-white p-5">
      <p className="text-sm text-ink/45">{intro}</p>
      <h3 className="mt-4 text-lg leading-snug">{paper.title}</h3>
      <p className="mt-1 text-xs text-ink/45">
        {paper.authors} · {paper.journal}
      </p>
      <dl className="mt-4 grid grid-cols-3 gap-3 rounded-bubble bg-mint p-4">
        {meta.map((item) =>
        <MetaItem key={item.label} label={item.label} value={item.value} />
        )}
      </dl>
      <div className="mt-4 flex flex-wrap gap-1.5">
        {paper.evidenceBadges.map((badge) =>
        <EvidenceBadgeChip key={badge} badge={badge} />
        )}
      </div>
    </article>);

}