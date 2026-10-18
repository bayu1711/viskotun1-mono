'use client';

import React from 'react';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import HelpOutlineOutlinedIcon from '@mui/icons-material/HelpOutlineOutlined';
import { COPY } from '../../../data/copy';
import type { Protocol, ProtocolStep } from '../../../types/routine';
import { cn } from '../../../utils/cn';
import { isRandomizedTrial, stopRuleOf } from '../../../utils/routineMetrics';
import { Callout } from '../../feedback/Callout';
import { MissingDataBanner } from '../../protocol/MissingDataBanner';
import { EvidenceBadgeChip } from '../../ui/EvidenceBadgeChip';
import { Icon } from '../../ui/Icon';
import { AIIcon } from '../../ui/AIIcon';
import { MetaItem } from './MetaItem';

interface CandidateProtocolCardProps {
  protocol: Protocol;
  onConfirm: () => void;
  onDiscard: () => void;
  onToggleExcludeStep?: (stepId: string) => void;
  onAskAboutStep?: (step: ProtocolStep) => void;
}

export function CandidateProtocolCard({
  protocol,
  onConfirm,
  onDiscard,
  onToggleExcludeStep,
  onAskAboutStep
}: CandidateProtocolCardProps) {
  const paper = protocol.paper;
  const stopRule = stopRuleOf(protocol);
  const progressionRule = protocol.progressionRules?.[0];
  const excludedIds = protocol.initialExcludedStepIds ?? [];

  const meta = [
    { label: COPY.assistant.meta.sample, value: COPY.assistant.meta.sampleValue(paper.sampleSize) },
    {
      label: COPY.assistant.meta.design,
      value: isRandomizedTrial(paper) ? COPY.evidence.rctShort : COPY.evidence.pilotShort
    },
    { label: COPY.assistant.meta.year, value: String(paper.year) }
  ];

  return (
    <article className="rounded-card border border-ink/10 bg-white p-5 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-mint px-2.5 py-0.5 text-xs font-medium text-ink">
            <AIIcon size="xs" />
            {COPY.assistant.stagingEyebrow}
          </span>
          <span className="inline-flex items-center rounded-full bg-cream border border-ink/15 px-2 py-0.5 text-3xs font-semibold text-ink">
            v{protocol.version || '1.0'}
          </span>
        </div>
        <span className="text-2xs text-ink/60 font-mono">
          {protocol.phase || 'Clinical Research'} · {protocol.totalDays} days
        </span>
      </div>

      {protocol.isCanonical && (
        <div className="rounded-tile border border-ink/15 bg-cream/70 p-3 text-xs text-ink space-y-1">
          <div className="flex items-center gap-1.5 font-semibold text-ink">
            <AIIcon size="xs" />
            <span>{COPY.assistant.existingCanonicalPill(protocol.version || '1.0')}</span>
          </div>
          <p className="text-2xs text-ink/75 leading-relaxed">
            {COPY.assistant.existingCanonicalNotice(protocol.version || '1.0')}
          </p>
        </div>
      )}

      <div>
        <h3 className="text-base font-semibold leading-snug text-ink">{paper.title || protocol.title}</h3>
        <p className="mt-1 text-xs text-ink/60">
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

      {/* Missing Parameters / Lineage Banner */}
      <MissingDataBanner protocol={protocol} className="rounded-tile text-xs" />

      {protocol.dataCollectionSpec?.some(
        (field) => field.proposedWidget?.status === 'pending_review'
      ) && (
        <div
          role="status"
          className="rounded-tile border border-ink/15 bg-mint/40 p-3 text-xs text-ink space-y-1"
        >
          <div className="flex items-center gap-1.5 font-semibold">
            <AIIcon size="xs" />
            <span>{COPY.morphing.widgets.custom.pendingNotice}</span>
          </div>
          <p className="text-2xs text-ink/70">
            {COPY.morphing.widgets.custom.pendingSubtext}
          </p>
        </div>
      )}

      {protocol.steps && protocol.steps.length > 0 && (
        <div className="space-y-2 pt-1 border-t border-ink/10">
          <p className="text-2xs font-semibold uppercase tracking-wider text-ink/60">
            {COPY.assistant.candidateStepsTitle}
          </p>
          <ul className="space-y-2.5">
            {protocol.steps.map((step, idx) => {
              const isExcluded = excludedIds.includes(step.id);
              return (
                <li
                  key={step.id || idx}
                  className={cn(
                    'rounded-tile border border-ink/10 p-2.5 transition-opacity',
                    isExcluded ? 'bg-canvas/40 opacity-60' : 'bg-canvas/70'
                  )}
                >
                  <div className="flex items-start gap-2.5">
                    <span
                      className={cn(
                        'shrink-0 rounded px-1.5 py-0.5 text-2xs font-bold',
                        isExcluded ? 'bg-ink/5 text-ink/60' : 'bg-ink/10 text-ink'
                      )}
                    >
                      {step.sets}×
                    </span>
                    <div className="min-w-0 flex-1 text-xs">
                      <div className="flex items-center gap-1.5">
                        <p className={cn('font-medium text-ink', isExcluded && 'line-through text-ink/60')}>
                          {step.action}
                        </p>
                        {isExcluded && (
                          <span className="rounded bg-ink/10 px-1 py-0.2 text-3xs text-ink/60">
                            {COPY.task.excludedBadge}
                          </span>
                        )}
                      </div>
                      {step.detail && <p className="mt-0.5 text-2xs text-ink/60">{step.detail}</p>}
                      {step.inferred && (
                        <p className="mt-1 text-3xs text-ink/60">
                          {step.inferredProvenance?.tier === 'lineage'
                            ? COPY.task.lineageBadge(step.inferredProvenance.source)
                            : COPY.task.inferredBadge(step.inferredProvenance?.source)}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {onAskAboutStep && (
                        <button
                          type="button"
                          onClick={() => onAskAboutStep(step)}
                          aria-label={COPY.task.helpAriaLabel(step.action)}
                          title={COPY.task.helpTooltip(step.action)}
                          className="relative flex h-6 w-6 items-center justify-center rounded-full border border-ink/15 bg-white text-ink/60 transition-colors before:absolute before:-inset-2.5 hover:border-ink hover:bg-mint hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-ink"
                        >
                          <Icon icon={HelpOutlineOutlinedIcon} size="xs" />
                        </button>
                      )}
                      {step.inferred && onToggleExcludeStep && (
                        <button
                          type="button"
                          onClick={() => onToggleExcludeStep(step.id)}
                          className="text-3xs text-ink/60 underline decoration-dotted hover:text-ink transition-colors"
                          title={isExcluded ? COPY.task.restoreStep : COPY.missingData.candidateExclusionNotice}
                        >
                          {isExcluded ? COPY.assistant.restoreCandidateStep : COPY.assistant.excludeCandidateStep}
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {stopRule && (
        <Callout tone="cream" className="rounded-tile text-xs">
          {COPY.common.warningPrefix} {stopRule.text}
        </Callout>
      )}

      {progressionRule && (
        <p className="text-2xs text-ink/60 px-1">
          {COPY.protocolCard.rulePrefix} {COPY.protocolCard.ruleCondition(progressionRule.condition)} {COPY.protocolCard.ruleArrow}{' '}
          <span className="font-medium text-ink">{progressionRule.action.toLowerCase()}</span>
        </p>
      )}

      <div className="pt-2 border-t border-ink/10 space-y-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onConfirm}
            className="flex flex-1 items-center justify-center gap-2 rounded-full bg-ink px-4 py-2.5 text-xs font-medium text-white transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink"
          >
            <Icon icon={CheckIcon} size="xs" />
            <span>{protocol.isCanonical ? COPY.assistant.adoptExistingRoutine : COPY.assistant.confirmAddPaper}</span>
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

        {onAskAboutStep && (
          <button
            type="button"
            onClick={() => {
              onAskAboutStep({
                id: 'improvement',
                action: COPY.assistant.proposeImprovementPrompt
              } as unknown as ProtocolStep);
            }}
            className="w-full text-center text-2xs font-medium text-ink/65 hover:text-ink underline decoration-dotted transition-colors py-1"
          >
            {COPY.assistant.proposeImprovementButton}
          </button>
        )}
      </div>

      <p className="text-center text-3xs text-ink/60">
        {COPY.assistant.stagingDescription}
      </p>
    </article>
  );
}
