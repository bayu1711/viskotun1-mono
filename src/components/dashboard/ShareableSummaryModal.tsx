'use client';

import React, { useRef } from 'react';
import Image from 'next/image';
import CloseIcon from '@mui/icons-material/Close';
import PrintOutlinedIcon from '@mui/icons-material/PrintOutlined';
import { AnimatePresence, motion } from 'framer-motion';
import { useRoutine } from '../../contexts/RoutineContext';
import { MOTION } from '../../data/config';
import { COPY } from '../../data/copy';
import { useDialogA11y } from '../../hooks/useDialogA11y';
import {
  complianceLevel,
  isRandomizedTrial,
  progressionStatus,
  stopRuleOf
} from '../../utils/routineMetrics';
import { CircleButton } from '../ui/CircleButton';
import { EvidenceBadgeChip } from '../ui/EvidenceBadgeChip';
import { Icon } from '../ui/Icon';
import { PillButton } from '../ui/PillButton';

interface ShareableSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ShareableSummaryModal({ isOpen, onClose }: ShareableSummaryModalProps) {
  const {
    routine,
    protocol = routine,
    currentDay,
    totalDays,
    streak,
    adherenceRate,
    escalationPaused,
    progressionReady,
    feedbackLogs
  } = useRoutine();

  const panelRef = useRef<HTMLDivElement>(null);
  useDialogA11y(panelRef, { open: isOpen, onClose });

  const status = progressionStatus(escalationPaused, progressionReady);
  const compliance = complianceLevel(adherenceRate);
  const isRct = isRandomizedTrial(protocol.paper);
  const stopRule = stopRuleOf(protocol);
  const progressionRule = protocol.progressionRules[0];
  const recentLogs = (feedbackLogs || []).slice(-5).reverse();
  const todayFormatted = new Date().toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-dialog flex items-center justify-center p-3 sm:p-6 print:static print:p-0 print:block">
          {/* Backdrop (hidden on print) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-hidden="true"
            data-no-print="true"
            className="fixed inset-0 bg-ink/60 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={COPY.shareableSummary.dialogLabel}
            tabIndex={-1}
            initial={{ scale: 0.96, opacity: 0, y: MOTION.dialogOffsetY }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: MOTION.dialogOffsetY }}
            transition={MOTION.dialogSpring}
            className="relative z-10 flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-card bg-white font-sans text-ink shadow-float focus:outline-none print:max-h-none print:w-full print:rounded-none print:border-none print:p-0 print:shadow-none"
          >
            {/* Action Bar (hidden on print) */}
            <div
              data-no-print="true"
              className="flex shrink-0 items-center justify-between border-b border-ink/10 bg-canvas/80 px-6 py-4 backdrop-blur-md"
            >
              <div>
                <p className="text-2xs font-mono uppercase tracking-widest text-ink/45">
                  {COPY.shareableSummary.cardTitle}
                </p>
                <h2 className="text-lg font-medium tracking-tight">
                  {protocol.title}
                </h2>
              </div>
              <div className="flex items-center gap-3">
                <PillButton
                  variant="primary"
                  size="sm"
                  onClick={handlePrint}
                  className="gap-2 text-xs"
                >
                  <Icon icon={PrintOutlinedIcon} size="sm" />
                  <span>{COPY.shareableSummary.printButton}</span>
                </PillButton>
                <CircleButton label={COPY.shareableSummary.closeButton} onClick={onClose} size={36}>
                  <Icon icon={CloseIcon} size="md" />
                </CircleButton>
              </div>
            </div>

            {/* Document Body (formatted for 1-page print) */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-8 print:p-0 print:overflow-visible">
              {/* Document Header */}
              <div className="flex items-start justify-between border-b-2 border-ink pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Image
                      src={COPY.brand.iconUrl}
                      alt=""
                      width={20}
                      height={20}
                      className="h-5 w-5 object-contain"
                    />
                    <span className="text-sm font-semibold uppercase tracking-wider text-ink">
                      {COPY.brand.name}
                    </span>
                    <span className="rounded bg-ink/10 px-2 py-0.5 text-2xs uppercase tracking-wide text-ink/70">
                      {COPY.shareableSummary.briefBadge}
                    </span>
                  </div>
                  <h1 className="mt-2 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
                    {protocol.title}
                  </h1>
                  <p className="mt-0.5 text-xs text-ink/60">
                    {COPY.shareableSummary.phasePrefix} <span className="font-medium text-ink">{protocol.phase}</span>
                  </p>
                </div>
                <div className="text-right text-xs text-ink/50">
                  <p className="font-medium text-ink">{COPY.shareableSummary.generatedOn(todayFormatted)}</p>
                  <p>{COPY.shareableSummary.studyYear(protocol.paper.year)}</p>
                </div>
              </div>

              {/* Study Citation & Evidence */}
              <div className="mt-5 rounded-tile border border-ink/15 bg-canvas/50 p-4 print:bg-white print:border-ink/20">
                <p className="text-2xs font-mono uppercase tracking-wider text-ink/50">
                  {COPY.shareableSummary.trialCitation}
                </p>
                <p className="mt-1 text-sm font-semibold leading-snug text-ink">
                  {protocol.paper.title}
                </p>
                <p className="mt-1 text-xs text-ink/65">
                  {protocol.paper.authors} — <span className="italic">{protocol.paper.journal}</span> ({protocol.paper.year})
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-2xs">
                  <span className="font-mono text-ink/60">{COPY.shareableSummary.doi(protocol.paper.doi)}</span>
                  <span>•</span>
                  <span>{protocol.paper.trialType}</span>
                  <span>•</span>
                  <span>{COPY.shareableSummary.sampleSize(protocol.paper.sampleSize)}</span>
                  <div className="ml-auto flex gap-1">
                    {protocol.paper.evidenceBadges.map((badge) => (
                      <EvidenceBadgeChip key={badge} badge={badge} />
                    ))}
                  </div>
                </div>
              </div>

              {/* Key Adherence & Metric Badges */}
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 print:grid-cols-4">
                <div className="rounded-tile border border-ink/10 bg-canvas/40 p-3 print:bg-white">
                  <p className="text-2xs text-ink/50">{COPY.shareableSummary.timelineProgress}</p>
                  <p className="mt-1 text-lg font-bold text-ink">
                    {COPY.shareableSummary.dayValue(currentDay)}{' '}
                    <span className="text-xs font-normal text-ink/50">{COPY.shareableSummary.totalDaysValue(totalDays)}</span>
                  </p>
                </div>
                <div className="rounded-tile border border-ink/10 bg-cream/30 p-3 print:bg-white">
                  <p className="text-2xs text-ink/50">{COPY.shareableSummary.adherenceRate}</p>
                  <p className="mt-1 text-lg font-bold text-ink">
                    {adherenceRate}%{' '}
                    <span className="text-xs font-normal text-ink/60 capitalize">
                      ({compliance})
                    </span>
                  </p>
                </div>
                <div className="rounded-tile border border-ink/10 bg-mint/30 p-3 print:bg-white">
                  <p className="text-2xs text-ink/50">{COPY.shareableSummary.consistencyStreak}</p>
                  <p className="mt-1 text-lg font-bold text-ink">
                    {streak} {COPY.shareableSummary.dayUnit(streak)}
                  </p>
                </div>
                <div className="rounded-tile border border-ink/10 bg-canvas/40 p-3 print:bg-white">
                  <p className="text-2xs text-ink/50">{COPY.shareableSummary.progressionGate}</p>
                  <p className="mt-1 text-sm font-semibold capitalize text-ink">
                    {status === 'paused'
                      ? COPY.shareableSummary.statusPaused
                      : status === 'ready'
                      ? COPY.shareableSummary.statusReady
                      : COPY.shareableSummary.statusHolding}
                  </p>
                </div>
              </div>

              {/* Prescribed Routine Steps */}
              <div className="mt-6">
                <h3 className="text-xs font-mono uppercase tracking-wider text-ink/60">
                  {COPY.shareableSummary.prescribedRoutine}
                </h3>
                <div className="mt-2 divide-y divide-ink/10 rounded-tile border border-ink/15 overflow-hidden">
                  {protocol.steps.map((step, idx) => (
                    <div key={step.id} className="flex items-start gap-4 p-3.5 text-xs bg-white">
                      <span className="font-mono font-bold text-ink/40">
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-ink">{step.action}</p>
                          {step.inferred && (
                            <span className="rounded bg-cream px-1.5 py-0.2 text-3xs font-medium text-ink">
                              {COPY.shareableSummary.conservativeBaseline}
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-2xs text-ink/60">{step.detail}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-semibold text-ink">
                          {step.sets} {step.setLabel || COPY.task.defaultSetLabel} {step.perSetLabel || ''}
                        </p>
                        <p className="text-3xs text-ink/50">{step.frequency}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Safety, Rules & Contraindications */}
              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 print:grid-cols-2">
                <div className="rounded-tile border border-ink/15 p-4 bg-canvas/30 print:bg-white">
                  <h4 className="text-2xs font-mono uppercase tracking-wider text-ink/60">
                    {COPY.shareableSummary.progressionRuleHeading}
                  </h4>
                  {progressionRule ? (
                    <p className="mt-1 text-xs text-ink">
                      <span className="font-medium">{COPY.shareableSummary.conditionLabel}</span> {progressionRule.condition}
                      <br />
                      <span className="font-medium">{COPY.shareableSummary.actionLabel}</span> {progressionRule.action}
                    </p>
                  ) : (
                    <p className="mt-1 text-xs text-ink/50">{COPY.shareableSummary.standardDurationFallback}</p>
                  )}
                </div>

                <div className="rounded-tile border border-ink/15 p-4 bg-blush/20 print:bg-white">
                  <h4 className="text-2xs font-mono uppercase tracking-wider text-danger">
                    {COPY.shareableSummary.safetyRulesHeading}
                  </h4>
                  {stopRule ? (
                    <p className="mt-1 text-xs text-ink">
                      <span className="font-semibold text-danger">{COPY.shareableSummary.stopImmediatelyIf}</span>{' '}
                      {stopRule.text}
                    </p>
                  ) : (
                    <p className="mt-1 text-xs text-ink/60">
                      {COPY.shareableSummary.standardMonitoringFallback}
                    </p>
                  )}
                </div>
              </div>

              {/* Recent Biofeedback Logs */}
              <div className="mt-6">
                <h3 className="text-xs font-mono uppercase tracking-wider text-ink/60">
                  {COPY.shareableSummary.recentLogs}
                </h3>
                {recentLogs.length === 0 ? (
                  <p className="mt-2 text-xs italic text-ink/40">
                    {COPY.shareableSummary.noLogsYet}
                  </p>
                ) : (
                  <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2 print:grid-cols-2">
                    {recentLogs.map((log) => (
                      <div
                        key={log.id}
                        className="flex items-center justify-between rounded-tile border border-ink/10 bg-canvas/40 px-3.5 py-2 text-xs print:bg-white"
                      >
                        <div>
                          <p className="font-medium text-ink">
                            {COPY.shareableSummary.logScoreMeta(log.day, log.score)}
                          </p>
                          {log.note && <p className="text-2xs text-ink/60 italic">{log.note}</p>}
                        </div>
                        <span className="text-3xs text-ink/40 font-mono">{log.loggedAt}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Legal / Scientific Disclaimer */}
              <div className="mt-8 border-t border-ink/10 pt-4 text-center text-3xs leading-relaxed text-ink/45">
                <p>{COPY.shareableSummary.disclaimer}</p>
                <p className="mt-1 font-mono">
                  {COPY.shareableSummary.footerAudit(protocol.paper.doi)}
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
