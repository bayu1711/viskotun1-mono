'use client';

import React from 'react';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { COPY } from '../../../data/copy';
import type { Protocol } from '../../../types/routine';
import { isRandomizedTrial, stopRuleOf } from '../../../utils/routineMetrics';
import { Callout } from '../../feedback/Callout';
import { EvidenceBadgeChip } from '../../ui/EvidenceBadgeChip';
import { Icon } from '../../ui/Icon';
import { MetaItem } from './MetaItem';

interface CandidateProtocolCardProps {
  protocol: Protocol;
  onConfirm: () => void;
  onDiscard: () => void;
}

export function CandidateProtocolCard({
  protocol,
  onConfirm,
  onDiscard
}: CandidateProtocolCardProps) {
  const paper = protocol.paper;
  const stopRule = stopRuleOf(protocol);
  const progressionRule = protocol.progressionRules?.[0];

  const meta = [
    { label: COPY.assistant.meta.sample, value: COPY.assistant.meta.sampleValue(paper.sampleSize) },
    {
      label: COPY.assistant.meta.design,
      value: isRandomizedTrial(paper) ? COPY.evidence.rctShort : COPY.evidence.pilotShort
    },
    { label: COPY.assistant.meta.year, value: String(paper.year) }
  ];

  return (
    <article className="rounded-card border border-ink/10 bg-white p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-mint px-2.5 py-0.5 text-xs font-medium text-ink">
          <Icon icon={AutoAwesomeIcon} size="xs" />
          {COPY.assistant.stagingEyebrow}
        </span>
        <span className="text-2xs text-ink/40 font-mono">
          {protocol.phase || 'Clinical Research'} · {protocol.totalDays} days
        </span>
      </div>

      <div>
        <h3 className="text-base font-semibold leading-snug text-ink">{paper.title || protocol.title}</h3>
        <p className="mt-1 text-xs text-ink/50">
          {paper.authors} · {paper.journal}
        </p>
      </div>

      <dl className="grid grid-cols-3 gap-2 rounded-bubble bg-canvas p-3 border border-ink/5">
        {meta.map((item) => (
          <MetaItem key={item.label} label={item.label} value={item.value} />
        ))}
      </dl>

      {paper.evidenceBadges && paper.evidenceBadges.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {paper.evidenceBadges.map((badge) => (
            <EvidenceBadgeChip key={badge} badge={badge} />
          ))}
        </div>
      )}

      {protocol.steps && protocol.steps.length > 0 && (
        <div className="space-y-2 pt-1 border-t border-ink/10">
          <p className="text-2xs font-semibold uppercase tracking-wider text-ink/45">
            {COPY.assistant.candidateStepsTitle}
          </p>
          <ul className="space-y-2">
            {protocol.steps.map((step, idx) => (
              <li
                key={step.id || idx}
                className="flex items-start gap-2.5 rounded-tile border border-ink/10 bg-canvas/70 p-2.5"
              >
                <span className="shrink-0 rounded bg-ink/10 px-1.5 py-0.5 text-2xs font-bold text-ink">
                  {step.sets}×
                </span>
                <div className="min-w-0 flex-1 text-xs">
                  <p className="font-medium text-ink">{step.action}</p>
                  {step.detail && <p className="mt-0.5 text-2xs text-ink/50">{step.detail}</p>}
                </div>
                {step.inferred && (
                  <span className="shrink-0 rounded-full bg-cream px-1.5 py-0.5 text-3xs font-medium text-ink/70">
                    Inferred
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {stopRule && (
        <Callout tone="cream" className="rounded-tile text-xs">
          {COPY.common.warningPrefix} {stopRule.text}
        </Callout>
      )}

      {progressionRule && (
        <p className="text-2xs text-ink/50 px-1">
          {COPY.protocolCard.rulePrefix} {progressionRule.condition.toLowerCase()} {COPY.protocolCard.ruleArrow}{' '}
          <span className="font-medium text-ink">{progressionRule.action.toLowerCase()}</span>
        </p>
      )}

      <div className="flex items-center gap-2 pt-2 border-t border-ink/10">
        <button
          type="button"
          onClick={onConfirm}
          className="flex flex-1 items-center justify-center gap-2 rounded-full bg-ink px-4 py-2.5 text-xs font-medium text-white transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink"
        >
          <Icon icon={CheckIcon} size="xs" />
          <span>{COPY.assistant.confirmAddPaper}</span>
        </button>
        <button
          type="button"
          onClick={onDiscard}
          className="flex items-center gap-1 rounded-full border border-ink/20 px-3 py-2.5 text-xs font-medium text-ink/65 hover:bg-ink/5 hover:text-ink transition-colors focus:outline-none"
        >
          <Icon icon={CloseIcon} size="xs" />
          <span>{COPY.assistant.discardCandidate}</span>
        </button>
      </div>

      <p className="text-center text-3xs text-ink/40">
        {COPY.assistant.stagingDescription}
      </p>
    </article>
  );
}
