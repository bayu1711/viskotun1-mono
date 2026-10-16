'use client';

import React, { useRef, useState } from 'react';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CloseIcon from '@mui/icons-material/Close';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import HelpOutlineOutlinedIcon from '@mui/icons-material/HelpOutlineOutlined';
import HighlightOffOutlinedIcon from '@mui/icons-material/HighlightOffOutlined';
import NorthEastIcon from '@mui/icons-material/NorthEast';
import PlayArrowOutlinedIcon from '@mui/icons-material/PlayArrowOutlined';
import ScienceOutlinedIcon from '@mui/icons-material/ScienceOutlined';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import { AnimatePresence, motion } from 'framer-motion';
import { useProtocol } from '../../contexts/ProtocolContext';
import { MOTION } from '../../data/config';
import { COPY } from '../../data/copy';
import { SAMPLE_PAPERS } from '../../data/samplePapers';
import { useDialogA11y } from '../../hooks/useDialogA11y';
import { cn } from '../../utils/cn';
import { CircleButton } from '../ui/CircleButton';
import { Icon } from '../ui/Icon';
import { PillButton } from '../ui/PillButton';

type HowToTab = 'guide' | 'samples' | 'scope';

export function HowToModal() {
  const { isHowToOpen, closeHowTo, loadSampleProtocol, activeProtocolId, samplePapers, sampleSource } = useProtocol();
  const [activeTab, setActiveTab] = useState<HowToTab>('guide');
  const panelRef = useRef<HTMLDivElement>(null);

  useDialogA11y(panelRef, { open: isHowToOpen, onClose: closeHowTo });

  return (
    <AnimatePresence>
      {isHowToOpen && (
        <motion.div
          className="fixed inset-0 z-modal flex items-center justify-center p-3 sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
            onClick={closeHowTo}
            aria-hidden="true"
          />

          {/* Modal Container */}
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={COPY.howTo.dialogLabel}
            tabIndex={-1}
            initial={{ scale: 0.96, opacity: 0, y: MOTION.dialogOffsetY }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: MOTION.dialogOffsetY }}
            transition={MOTION.dialogSpring}
            className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-sheet bg-canvas font-sans text-ink shadow-float focus:outline-none"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-ink/10 px-6 py-4 bg-white/80 backdrop-blur">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-mint text-ink">
                  <Icon icon={HelpOutlineOutlinedIcon} size="sm" />
                </span>
                <div>
                  <p className="text-2xs font-medium lowercase text-ink/50">{COPY.howTo.eyebrow}</p>
                  <h2 className="text-base font-medium lowercase text-ink">{COPY.howTo.title}</h2>
                </div>
              </div>

              <CircleButton label={COPY.policyLedger.close} onClick={closeHowTo} size={36}>
                <Icon icon={CloseIcon} size="sm" />
              </CircleButton>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-ink/10 bg-white/40 px-6">
              {(['guide', 'samples', 'scope'] as const).map((tabKey) => {
                const isActive = activeTab === tabKey;
                return (
                  <button
                    key={tabKey}
                    type="button"
                    onClick={() => setActiveTab(tabKey)}
                    className={cn(
                      'relative px-4 py-3 text-xs font-medium lowercase transition-colors focus:outline-none focus-visible:underline',
                      isActive ? 'text-ink' : 'text-ink/45 hover:text-ink/75'
                    )}
                  >
                    {COPY.howTo.tabs[tabKey]}
                    {isActive && (
                      <motion.div
                        layoutId="howto-tab-indicator"
                        className="absolute inset-x-0 bottom-0 h-0.5 bg-ink"
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              {/* TAB 1: HOW IT WORKS */}
              {activeTab === 'guide' && (
                <div className="space-y-6">
                  <div className="rounded-card border border-ink/10 bg-white p-5">
                    <div className="inline-flex items-center gap-2 rounded-full bg-mint px-2.5 py-0.5 text-2xs font-medium text-ink">
                      <span className="h-1.5 w-1.5 rounded-full bg-ink" aria-hidden="true" />
                      {COPY.howTo.badge}
                    </div>
                    <p className="mt-3 text-sm leading-relaxed lowercase text-ink/75">
                      {COPY.howTo.intro}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    {COPY.howTo.steps.map((item) => (
                      <div
                        key={item.step}
                        className="flex flex-col justify-between rounded-card border border-ink/10 bg-white p-4"
                      >
                        <div>
                          <span className="inline-block rounded bg-canvas px-2 py-0.5 text-xs font-semibold tabular-nums text-ink/60">
                            {item.step}
                          </span>
                          <h3 className="mt-3 text-sm font-medium lowercase text-ink">
                            {item.title}
                          </h3>
                          <p className="mt-2 text-xs leading-relaxed lowercase text-ink/65">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-ink/10 bg-cream/50 p-4">
                    <div>
                      <h4 className="text-xs font-medium lowercase text-ink">Ready to explore?</h4>
                      <p className="text-2xs lowercase text-ink/60">
                        Choose a pre-calibrated sample paper or download one of our verified open-access PDFs.
                      </p>
                    </div>
                    <PillButton size="sm" onClick={() => setActiveTab('samples')}>
                      {COPY.howTo.buttonExploreSamples}
                    </PillButton>
                  </div>
                </div>
              )}

              {/* TAB 2: SAMPLE PAPERS */}
              {activeTab === 'samples' && (
                <div className="space-y-5">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="text-sm font-medium lowercase text-ink">{COPY.howTo.samplesTitle}</h3>
                      <span
                        className={cn(
                          'rounded-full px-2.5 py-0.5 text-2xs font-medium lowercase border',
                          sampleSource === 'firestore-live'
                            ? 'border-mint/60 bg-mint/20 text-ink'
                            : 'border-ink/10 bg-canvas text-ink/60'
                        )}
                      >
                        {sampleSource === 'firestore-live'
                          ? COPY.howTo.firestoreSyncLive
                          : COPY.howTo.firestoreSyncLocal}
                      </span>
                    </div>
                    <p className="text-xs lowercase text-ink/60">{COPY.howTo.samplesSubtitle}</p>
                  </div>

                  <div className="space-y-4">
                    {(samplePapers && samplePapers.length > 0 ? samplePapers : SAMPLE_PAPERS).map((paper) => {
                      const isPrecalibrated = Boolean(paper.protocolId);
                      const isActive = paper.protocolId === activeProtocolId;
                      const isRejectionTest = Boolean(paper.isGuardrailRejectionTest);

                      return (
                        <div
                          key={paper.id}
                          className={cn(
                            'rounded-card border p-4 transition-all',
                            isRejectionTest
                              ? 'border-blush/40 bg-blush/10'
                              : isActive
                              ? 'border-ink bg-mint/10'
                              : 'border-ink/10 bg-white hover:border-ink/20'
                          )}
                        >
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span
                                  className={cn(
                                    'rounded-full px-2 py-0.5 text-2xs font-medium lowercase',
                                    isRejectionTest
                                      ? 'bg-blush text-ink'
                                      : 'bg-canvas text-ink/75'
                                  )}
                                >
                                  {paper.domain}
                                </span>
                                {isRejectionTest ? (
                                  <span className="rounded-full bg-blush/30 px-2 py-0.5 text-2xs font-semibold lowercase text-ink">
                                    {COPY.howTo.testGatekeeperBadge}
                                  </span>
                                ) : (
                                  <span className="rounded-full bg-mint px-2 py-0.5 text-2xs font-semibold lowercase text-ink">
                                    RCT
                                  </span>
                                )}
                              </div>
                              <h4 className="text-sm font-medium lowercase text-ink leading-snug">
                                {paper.title}
                              </h4>
                              <p className="text-2xs lowercase text-ink/50">
                                {paper.authors} · <em>{paper.journal}</em> ({paper.year})
                              </p>
                            </div>
                          </div>

                          <p className="mt-2.5 text-xs leading-relaxed lowercase text-ink/70">
                            {paper.summary}
                          </p>

                          <div className="mt-3 rounded-card bg-canvas/70 p-2.5">
                            <p className="text-2xs font-medium lowercase text-ink/55">
                              {COPY.howTo.featuresHeader}
                            </p>
                            <ul className="mt-1 grid grid-cols-1 gap-1 text-2xs lowercase text-ink/75 sm:grid-cols-2">
                              {paper.featuresTested.map((feat, i) => (
                                <li key={i} className="flex items-center gap-1.5">
                                  <span className="h-1 w-1 rounded-full bg-ink/40" />
                                  <span>{feat}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className="mt-4 flex flex-wrap items-center justify-between gap-2.5 border-t border-ink/10 pt-3">
                            <div className="flex flex-wrap items-center gap-2">
                              {isPrecalibrated && paper.protocolId && (
                                <PillButton
                                  size="sm"
                                  variant={isActive ? 'outline' : 'primary'}
                                  onClick={() => loadSampleProtocol(paper.protocolId!)}
                                  className="gap-1.5"
                                >
                                  <Icon icon={PlayArrowOutlinedIcon} size="xs" />
                                  <span>{isActive ? COPY.howTo.loadedButton : COPY.howTo.loadButton}</span>
                                </PillButton>
                              )}

                              <a
                                href={paper.pdfUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 rounded-full border border-ink/15 bg-white px-3 py-1.5 text-xs lowercase font-medium text-ink transition-colors hover:bg-canvas focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/30"
                              >
                                <Icon icon={DownloadOutlinedIcon} size="xs" />
                                <span>{COPY.howTo.downloadPdfButton}</span>
                              </a>
                            </div>

                            <a
                              href={paper.openAccessUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-2xs lowercase text-ink/55 transition-colors hover:text-ink focus:outline-none focus-visible:underline"
                            >
                              <span>{COPY.howTo.doiLabel}</span>
                              <Icon icon={NorthEastIcon} size="xs" />
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 3: ACCEPTED PAPER SCOPE */}
              {activeTab === 'scope' && (
                <div className="space-y-6">
                  <div className="space-y-1">
                    <h3 className="text-sm font-medium lowercase text-ink">{COPY.howTo.scopeTitle}</h3>
                    <p className="text-xs lowercase text-ink/60">{COPY.howTo.scopeSubtitle}</p>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {/* Eligible Criteria */}
                    <div className="rounded-card border border-mint/60 bg-mint/15 p-4">
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-mint text-ink">
                          <Icon icon={CheckCircleOutlineIcon} size="xs" />
                        </span>
                        <h4 className="text-xs font-semibold lowercase text-ink">
                          {COPY.howTo.acceptedHeader}
                        </h4>
                      </div>
                      <ul className="mt-3 space-y-2 text-xs lowercase text-ink/80">
                        {COPY.howTo.acceptedList.map((item, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-ink" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Rejected Criteria */}
                    <div className="rounded-card border border-blush/60 bg-blush/15 p-4">
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blush text-ink">
                          <Icon icon={HighlightOffOutlinedIcon} size="xs" />
                        </span>
                        <h4 className="text-xs font-semibold lowercase text-ink">
                          {COPY.howTo.rejectedHeader}
                        </h4>
                      </div>
                      <ul className="mt-3 space-y-2 text-xs lowercase text-ink/80">
                        {COPY.howTo.rejectedList.map((item, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-ink/60" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* AI Safety Gatekeeper Notice */}
                  <div className="rounded-card border border-ink/10 bg-white p-4">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-cream text-ink">
                        <Icon icon={ShieldOutlinedIcon} size="xs" />
                      </span>
                      <h4 className="text-xs font-semibold lowercase text-ink">
                        {COPY.howTo.testGatekeeperTitle}
                      </h4>
                    </div>
                    <p className="mt-2 text-xs leading-relaxed lowercase text-ink/70">
                      {COPY.howTo.testGatekeeperSubtitle}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-ink/10 bg-white px-6 py-3">
              <p className="text-2xs lowercase text-ink/45">
                Protocol Engine · Interventional Human Science Pipeline
              </p>
              <PillButton size="sm" variant="outline" onClick={closeHowTo}>
                {COPY.policyLedger.cancel}
              </PillButton>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
