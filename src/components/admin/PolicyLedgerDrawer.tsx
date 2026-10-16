'use client';

import React, { useRef, useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import CloseIcon from '@mui/icons-material/Close';
import CloudDoneOutlinedIcon from '@mui/icons-material/CloudDoneOutlined';
import CloudOffOutlinedIcon from '@mui/icons-material/CloudOffOutlined';
import RestartAltOutlinedIcon from '@mui/icons-material/RestartAltOutlined';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import TuneOutlinedIcon from '@mui/icons-material/TuneOutlined';
import { usePolicyLedger } from '../../contexts/PolicyLedgerContext';
import { MOTION } from '../../data/config';
import { COPY } from '../../data/copy';
import { useDialogA11y } from '../../hooks/useDialogA11y';
import { CircleButton } from '../ui/CircleButton';
import { Icon } from '../ui/Icon';
import { PillButton } from '../ui/PillButton';

export function PolicyLedgerDrawer() {
  const {
    policy,
    isLiveFirestore,
    firestoreStatus,
    isDrawerOpen,
    closePolicyDrawer,
    updatePolicy,
    resetPolicy,
    isLoading
  } = usePolicyLedger();

  const [threshold, setThreshold] = useState(4);
  const [loadReduction, setLoadReduction] = useState(20);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (policy) {
      setThreshold(policy.painEscalationThreshold);
      setLoadReduction(policy.loadReductionPercent);
      setHasChanges(false);
    }
  }, [policy]);

  const panelRef = useRef<HTMLDivElement>(null);
  useDialogA11y(panelRef, { open: isDrawerOpen, onClose: closePolicyDrawer });

  const handleThresholdChange = (val: number) => {
    setThreshold(val);
    setHasChanges(true);
  };

  const handleReductionChange = (val: number) => {
    setLoadReduction(val);
    setHasChanges(true);
  };

  const handleSave = async () => {
    const success = await updatePolicy({
      painEscalationThreshold: threshold,
      loadReductionPercent: loadReduction,
      version: `clinical-${Date.now().toString(36)}`
    });
    if (success) {
      setHasChanges(false);
    }
  };

  const handleReset = async () => {
    await resetPolicy();
    setHasChanges(false);
  };

  return (
    <AnimatePresence>
      {isDrawerOpen && (
        <motion.div
          className="fixed inset-0 z-dialog flex items-end justify-center sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-ink/40" onClick={closePolicyDrawer} aria-hidden="true" />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={COPY.policyLedger.dialogLabel}
            tabIndex={-1}
            initial={{ y: MOTION.dialogOffsetY, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: MOTION.dialogOffsetY, opacity: 0 }}
            transition={MOTION.dialogSpring}
            className="relative w-full max-w-lg overflow-hidden rounded-t-sheet bg-white font-sans text-ink shadow-2xl focus:outline-none sm:rounded-sheet"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-ink/10 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cream text-ink">
                  <Icon icon={ShieldOutlinedIcon} size="md" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-semibold">{COPY.policyLedger.title}</h2>
                    {isLiveFirestore ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-mint bg-mint/30 px-2 py-0.5 text-3xs font-semibold text-ink">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-ink" />
                        {COPY.policyLedger.firestoreLive}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full border border-ink/15 bg-cream px-2 py-0.5 text-3xs font-medium text-ink/70">
                        {COPY.policyLedger.memoryCache}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-ink/50">
                    {COPY.policyLedger.versionLabel(policy?.version || COPY.policyLedger.versionFallback)}
                  </p>
                </div>
              </div>

              <CircleButton label={COPY.policyLedger.close} onClick={closePolicyDrawer} size={36}>
                <Icon icon={CloseIcon} size="md" />
              </CircleButton>
            </div>

            {/* Content Body */}
            <div className="max-h-[70vh] overflow-y-auto px-6 py-5 space-y-6">
              {/* Architecture Context Banner */}
              <div className="rounded-card border border-ink/10 bg-canvas p-4 text-xs leading-relaxed text-ink/75">
                <div className="flex items-center gap-1.5 font-medium text-ink">
                  <Icon icon={TuneOutlinedIcon} size="sm" />
                  <span>{COPY.policyLedger.governanceBadge}</span>
                </div>
                <p className="mt-1">
                  {COPY.policyLedger.governanceDesc}
                </p>
              </div>

              {/* Dynamic Parameter 1: Adverse Escalation Threshold */}
              <div className="rounded-card border border-ink/10 bg-white p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label htmlFor="pain-threshold" className="text-sm font-medium">
                      {COPY.policyLedger.thresholdLabel}
                    </label>
                    <p className="text-xs text-ink/50">
                      {COPY.policyLedger.thresholdDesc}
                    </p>
                  </div>
                  <span className="rounded-full bg-ink px-3 py-1 font-mono text-sm font-medium text-white">
                    {COPY.policyLedger.thresholdDisplay(threshold)}
                  </span>
                </div>

                <div className="mt-4 flex items-center gap-3">
                  <span className="text-xs text-ink/40">{COPY.policyLedger.mildLabel}</span>
                  <input
                    id="pain-threshold"
                    type="range"
                    min="1"
                    max="10"
                    step="1"
                    value={threshold}
                    onChange={(e) => handleThresholdChange(Number(e.target.value))}
                    className="h-2 flex-1 cursor-pointer appearance-none rounded-lg bg-ink/10 accent-ink"
                  />
                  <span className="text-xs text-ink/40">{COPY.policyLedger.severeLabel}</span>
                </div>
              </div>

              {/* Dynamic Parameter 2: Recommended Load Reduction */}
              <div className="rounded-card border border-ink/10 bg-white p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label htmlFor="load-reduction" className="text-sm font-medium">
                      {COPY.policyLedger.reductionLabel}
                    </label>
                    <p className="text-xs text-ink/50">
                      {COPY.policyLedger.reductionDesc}
                    </p>
                  </div>
                  <span className="rounded-full bg-ink px-3 py-1 font-mono text-sm font-medium text-white">
                    {COPY.policyLedger.loadReductionDisplay(loadReduction)}
                  </span>
                </div>

                <div className="mt-4 flex items-center gap-3">
                  <span className="text-xs text-ink/40">{COPY.policyLedger.reductionMinLabel}</span>
                  <input
                    id="load-reduction"
                    type="range"
                    min="10"
                    max="50"
                    step="5"
                    value={loadReduction}
                    onChange={(e) => handleReductionChange(Number(e.target.value))}
                    className="h-2 flex-1 cursor-pointer appearance-none rounded-lg bg-ink/10 accent-ink"
                  />
                  <span className="text-xs text-ink/40">{COPY.policyLedger.reductionMaxLabel}</span>
                </div>
              </div>

              {/* Gatekeeper Banned Criteria */}
              <div className="rounded-card border border-ink/10 bg-white p-4">
                <p className="text-sm font-medium">{COPY.policyLedger.bannedLabel}</p>
                <p className="text-xs text-ink/50">
                  {COPY.policyLedger.bannedDesc}
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {(policy?.bannedKeywords || []).map((keyword) => (
                    <span
                      key={keyword}
                      className="rounded-full border border-ink/10 bg-cream px-2.5 py-1 text-2xs text-ink/80"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>

              {/* Cloud Connection Provenance */}
              <div className="flex items-center justify-between rounded-card border border-ink/10 bg-canvas px-4 py-3 text-xs">
                <div className="flex items-center gap-2">
                  {isLiveFirestore ? (
                    <Icon icon={CloudDoneOutlinedIcon} size="sm" className="text-ink" />
                  ) : (
                    <Icon icon={CloudOffOutlinedIcon} size="sm" className="text-ink/50" />
                  )}
                  <span className="text-ink/70">
                    {isLiveFirestore
                      ? COPY.policyLedger.syncActive
                      : COPY.policyLedger.syncFallback(firestoreStatus)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex items-center gap-1 text-2xs font-medium text-ink/60 hover:text-ink underline"
                >
                  <Icon icon={RestartAltOutlinedIcon} size="xs" />
                  {COPY.policyLedger.resetBaseline}
                </button>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-between border-t border-ink/10 bg-white px-6 py-4">
              <button
                type="button"
                onClick={closePolicyDrawer}
                className="text-xs text-ink/60 hover:text-ink transition-colors"
              >
                {COPY.policyLedger.cancel}
              </button>

              <PillButton
                onClick={handleSave}
                disabled={!hasChanges || isLoading}
                variant="primary"
                className="text-xs"
              >
                {isLoading ? COPY.policyLedger.syncing : hasChanges ? COPY.policyLedger.saveSync : COPY.policyLedger.upToDate}
              </PillButton>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
