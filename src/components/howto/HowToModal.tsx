'use client';

import React, { useRef, useState } from 'react';
import Link from 'next/link';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CloseIcon from '@mui/icons-material/Close';
import HelpOutlineOutlinedIcon from '@mui/icons-material/HelpOutlineOutlined';
import HighlightOffOutlinedIcon from '@mui/icons-material/HighlightOffOutlined';
import PsychologyOutlinedIcon from '@mui/icons-material/PsychologyOutlined';
import ScienceOutlinedIcon from '@mui/icons-material/ScienceOutlined';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import { AnimatePresence, motion } from 'framer-motion';
import { useLocale } from '../../contexts/LocaleContext';
import { useRoutine } from '../../contexts/RoutineContext';
import { MOTION } from '../../data/config';
import { ROUTES } from '../../data/navigation';
import { useDialogA11y } from '../../hooks/useDialogA11y';
import { cn } from '../../utils/cn';
import { CircleButton } from '../ui/CircleButton';
import { Icon } from '../ui/Icon';
import { PillButton } from '../ui/PillButton';

type HowToTab = 'guide' | 'science' | 'scope';

export function HowToModal() {
  const { isHowToOpen, closeHowTo, openBctLedger } = useRoutine();
  const { copy, isRtl } = useLocale();
  const [activeTab, setActiveTab] = useState<HowToTab>('guide');
  const panelRef = useRef<HTMLDivElement>(null);

  const t = copy.howTo;

  useDialogA11y(panelRef, { open: isHowToOpen, onClose: closeHowTo });

  return (
    <AnimatePresence>
      {isHowToOpen && (
        <motion.div
          dir={isRtl ? 'rtl' : 'ltr'}
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
            aria-label={t.dialogLabel}
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
                  <p className="text-2xs font-medium text-ink/60">{t.eyebrow}</p>
                  <h2 className="text-base font-medium text-ink">{t.title}</h2>
                </div>
              </div>

              <CircleButton label={copy.policyLedger.close} onClick={closeHowTo} size={36}>
                <Icon icon={CloseIcon} size="sm" />
              </CircleButton>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-ink/10 bg-white/40 px-6">
              {(['guide', 'science', 'scope'] as const).map((tabKey) => {
                const isActive = activeTab === tabKey;
                return (
                  <button
                    key={tabKey}
                    type="button"
                    onClick={() => setActiveTab(tabKey)}
                    className={cn(
                      'relative px-4 py-3 text-xs font-medium transition-colors focus:outline-none focus-visible:underline',
                      isActive ? 'text-ink' : 'text-ink/60 hover:text-ink/75'
                    )}
                  >
                    {t.tabs[tabKey]}
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
                      {t.badge}
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-ink/75">
                      {t.intro}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    {t.steps.map((item) => (
                      <div
                        key={item.step}
                        className="flex flex-col justify-between rounded-card border border-ink/10 bg-white p-4"
                      >
                        <div>
                          <span className="inline-block rounded bg-canvas px-2 py-0.5 text-xs font-semibold tabular-nums text-ink/60">
                            {item.step}
                          </span>
                          <h3 className="mt-3 text-sm font-medium text-ink">
                            {item.title}
                          </h3>
                          <p className="mt-2 text-xs leading-relaxed text-ink/65">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Behavioral Science Bridge Card */}
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-peach/30 bg-peach/15 p-4">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-peach/40 text-ink">
                        <Icon icon={PsychologyOutlinedIcon} size="xs" />
                      </span>
                      <div>
                        <h4 className="text-xs font-bold text-ink">
                          {t.scienceTitle}
                        </h4>
                        <p className="text-2xs text-ink/70">
                          {t.scienceEyebrow} · Zero streak shame & 2-minute micro-dosing fallbacks
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab('science')}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-ink underline underline-offset-2 hover:text-ink/80 cursor-pointer"
                    >
                      <span>Explore habit science</span>
                      <span aria-hidden="true">→</span>
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-ink/10 bg-cream/50 p-4">
                    <div>
                      <h4 className="text-xs font-medium text-ink">Ready to explore?</h4>
                      <p className="text-2xs text-ink/60">
                        Choose a pre-calibrated sample paper or explore trending community routines.
                      </p>
                    </div>
                    <Link
                      href={`${ROUTES.community}?tab=explore`}
                      onClick={closeHowTo}
                      className="inline-flex items-center gap-1.5 rounded-full border border-ink bg-ink px-3.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-ink/85"
                    >
                      <span>{t.buttonExploreSamples}</span>
                    </Link>
                  </div>
                </div>
              )}

              {/* TAB 2: BEHAVIORAL HABIT SCIENCE (BCT) */}
              {activeTab === 'science' && (
                <div className="space-y-6">
                  {/* Intro card */}
                  <div className="rounded-card border border-ink/10 bg-white p-5">
                    <div className="inline-flex items-center gap-2 rounded-full bg-peach/30 px-2.5 py-0.5 text-2xs font-semibold text-ink">
                      <Icon icon={PsychologyOutlinedIcon} size="xs" />
                      <span>{t.scienceEyebrow}</span>
                    </div>
                    <h3 className="mt-3 text-base font-bold text-ink">
                      {t.scienceTitle}
                    </h3>
                    <p className="mt-2 text-xs leading-relaxed text-ink/75">
                      {t.scienceIntro}
                    </p>
                  </div>

                  {/* 3 Pillars */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    {t.sciencePillars.map((pillar) => (
                      <div
                        key={pillar.title}
                        className="flex flex-col justify-between rounded-card border border-ink/10 bg-white p-4"
                      >
                        <div>
                          <span className="inline-block rounded-full bg-cream px-2 py-0.5 text-2xs font-bold text-ink/70">
                            {pillar.code}
                          </span>
                          <h4 className="mt-2.5 text-sm font-bold text-ink">
                            {pillar.title}
                          </h4>
                          <p className="mt-1.5 text-xs leading-relaxed text-ink/70">
                            {pillar.body}
                          </p>
                        </div>
                        <div className="mt-3 border-t border-ink/5 pt-2">
                          <span className="inline-flex items-center gap-1 text-2xs font-semibold text-ink/80">
                            ✓ {pillar.benefit}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Deep-Dive / BCT Ledger CTA */}
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-mint/40 bg-mint/15 p-4">
                    <div>
                      <h4 className="text-xs font-bold text-ink">{t.inspectLedgerTitle}</h4>
                      <p className="text-2xs text-ink/70">
                        {t.inspectLedgerSubtitle}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        closeHowTo();
                        openBctLedger();
                      }}
                      className="inline-flex items-center gap-1.5 rounded-full border border-ink bg-ink px-3.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-ink/85 cursor-pointer"
                    >
                      <Icon icon={ScienceOutlinedIcon} size="xs" />
                      <span>{t.inspectLedgerButton}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 3: ACCEPTED PAPER SCOPE */}
              {activeTab === 'scope' && (
                <div className="space-y-6">
                  <div className="space-y-1">
                    <h3 className="text-sm font-medium text-ink">{t.scopeTitle}</h3>
                    <p className="text-xs text-ink/60">{t.scopeSubtitle}</p>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {/* Eligible Criteria */}
                    <div className="rounded-card border border-mint/60 bg-mint/15 p-4">
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-mint text-ink">
                          <Icon icon={CheckCircleOutlineIcon} size="xs" />
                        </span>
                        <h4 className="text-xs font-semibold text-ink">
                          {t.acceptedHeader}
                        </h4>
                      </div>
                      <ul className="mt-3 space-y-2 text-xs text-ink/80">
                        {t.acceptedList.map((item, i) => (
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
                        <h4 className="text-xs font-semibold text-ink">
                          {t.rejectedHeader}
                        </h4>
                      </div>
                      <ul className="mt-3 space-y-2 text-xs text-ink/80">
                        {t.rejectedList.map((item, i) => (
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
                      <h4 className="text-xs font-semibold text-ink">
                        {t.testGatekeeperTitle}
                      </h4>
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-ink/70">
                      {t.testGatekeeperSubtitle}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-ink/10 bg-white px-6 py-3">
              <p className="text-2xs text-ink/60">
                TrialN1 · Interventional Human Science Pipeline
              </p>
              <PillButton size="sm" variant="outline" onClick={closeHowTo}>
                {copy.policyLedger.cancel}
              </PillButton>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
