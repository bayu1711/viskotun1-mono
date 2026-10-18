'use client';

import React, { useRef, useState, useEffect, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import CloudDoneOutlinedIcon from '@mui/icons-material/CloudDoneOutlined';
import CloudOffOutlinedIcon from '@mui/icons-material/CloudOffOutlined';
import RestartAltOutlinedIcon from '@mui/icons-material/RestartAltOutlined';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import TuneOutlinedIcon from '@mui/icons-material/TuneOutlined';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import { usePolicyLedger } from '../../contexts/PolicyLedgerContext';
import { useRoutine } from '../../contexts/RoutineContext';
import { MOTION } from '../../data/config';
import { COPY } from '../../data/copy';
import { useDialogA11y } from '../../hooks/useDialogA11y';
import type { ProposedWidgetSpec } from '../../types/routine';
import { AIIcon } from '../ui/AIIcon';
import { CircleButton } from '../ui/CircleButton';
import { Icon } from '../ui/Icon';
import { PillButton } from '../ui/PillButton';

export function PolicyLedgerDrawer() {
  const { isAdmin } = useAuth();
  const { dataCollectionSpec, stagingProtocol, approveProposedWidget } = useRoutine();
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
  const [remoteProposals, setRemoteProposals] = useState<ProposedWidgetSpec[]>([]);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  useEffect(() => {
    if (policy) {
      setThreshold(policy.painEscalationThreshold);
      setLoadReduction(policy.loadReductionPercent);
      setHasChanges(false);
    }
  }, [policy]);

  useEffect(() => {
    if (!isDrawerOpen) return;
    let active = true;
    fetch('/api/admin/widgets')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (active && Array.isArray(data?.proposals)) {
          setRemoteProposals(data.proposals);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [isDrawerOpen]);

  const widgetProposals = useMemo(() => {
    const map = new Map<string, ProposedWidgetSpec>();
    for (const p of remoteProposals) {
      map.set(p.id, p);
    }
    for (const field of dataCollectionSpec ?? []) {
      if (field.proposedWidget) {
        map.set(field.proposedWidget.id, field.proposedWidget);
      }
    }
    for (const field of stagingProtocol?.dataCollectionSpec ?? []) {
      if (field.proposedWidget) {
        map.set(field.proposedWidget.id, field.proposedWidget);
      }
    }
    return Array.from(map.values());
  }, [remoteProposals, dataCollectionSpec, stagingProtocol]);

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

  const handleApproveWidget = async (proposal: ProposedWidgetSpec) => {
    try {
      setApprovingId(proposal.id);
      const res = await fetch('/api/admin/widgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proposalId: proposal.id })
      });
      const approvedSpec: ProposedWidgetSpec = {
        ...proposal,
        status: 'approved',
        approvedAt: new Date().toISOString()
      };
      if (res.ok) {
        const data = await res.json();
        const resolved = data?.proposal ?? approvedSpec;
        setRemoteProposals((prev) =>
          prev.some((p) => p.id === resolved.id)
            ? prev.map((p) => (p.id === resolved.id ? resolved : p))
            : [resolved, ...prev]
        );
        approveProposedWidget(resolved);
      } else {
        // Still apply to client session if proposal originated in local storage
        setRemoteProposals((prev) =>
          prev.some((p) => p.id === approvedSpec.id)
            ? prev.map((p) => (p.id === approvedSpec.id ? approvedSpec : p))
            : [approvedSpec, ...prev]
        );
        approveProposedWidget(approvedSpec);
      }
      toast.success(COPY.policyLedger.toastWidgetApproved(proposal.title));
    } catch {
      toast.error(COPY.policyLedger.toastWidgetApproveError);
    } finally {
      setApprovingId(null);
    }
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

  if (!isAdmin) return null;

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
                  <p className="text-xs text-ink/60">
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
                    <p className="text-xs text-ink/60">
                      {COPY.policyLedger.thresholdDesc}
                    </p>
                  </div>
                  <span className="rounded-full bg-ink px-3 py-1 font-mono text-sm font-medium text-white">
                    {COPY.policyLedger.thresholdDisplay(threshold)}
                  </span>
                </div>

                <div className="mt-4 flex items-center gap-3">
                  <span className="text-xs text-ink/60">{COPY.policyLedger.mildLabel}</span>
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
                  <span className="text-xs text-ink/60">{COPY.policyLedger.severeLabel}</span>
                </div>
              </div>

              {/* Dynamic Parameter 2: Recommended Load Reduction */}
              <div className="rounded-card border border-ink/10 bg-white p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label htmlFor="load-reduction" className="text-sm font-medium">
                      {COPY.policyLedger.reductionLabel}
                    </label>
                    <p className="text-xs text-ink/60">
                      {COPY.policyLedger.reductionDesc}
                    </p>
                  </div>
                  <span className="rounded-full bg-ink px-3 py-1 font-mono text-sm font-medium text-white">
                    {COPY.policyLedger.loadReductionDisplay(loadReduction)}
                  </span>
                </div>

                <div className="mt-4 flex items-center gap-3">
                  <span className="text-xs text-ink/60">{COPY.policyLedger.reductionMinLabel}</span>
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
                  <span className="text-xs text-ink/60">{COPY.policyLedger.reductionMaxLabel}</span>
                </div>
              </div>

              {/* Gatekeeper Banned Criteria */}
              <div className="rounded-card border border-ink/10 bg-white p-4">
                <p className="text-sm font-medium">{COPY.policyLedger.bannedLabel}</p>
                <p className="text-xs text-ink/60">
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

              {/* AI Widget Oversight Queue */}
              <div className="rounded-card border border-ink/10 bg-white p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="flex items-center gap-1.5 text-sm font-medium text-ink">
                      <AIIcon size="xs" />
                      <span>{COPY.policyLedger.pendingWidgetsLabel}</span>
                    </p>
                    <p className="mt-0.5 text-xs text-ink/60">
                      {COPY.policyLedger.pendingWidgetsDesc}
                    </p>
                  </div>
                </div>

                {widgetProposals.length === 0 ? (
                  <p className="rounded-tile bg-canvas px-3 py-2.5 text-xs text-ink/60">
                    {COPY.policyLedger.noPendingWidgets}
                  </p>
                ) : (
                  <ul className="space-y-2.5">
                    {widgetProposals.map((proposal) => {
                      const isApproved = proposal.status === 'approved';
                      const isApproving = approvingId === proposal.id;
                      return (
                        <li
                          key={proposal.id}
                          className="flex flex-col gap-2.5 rounded-tile border border-ink/10 bg-canvas p-3 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="min-w-0 flex-1 space-y-0.5">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="text-xs font-semibold text-ink">
                                {proposal.title}
                              </span>
                              <span className="rounded-full border border-ink/15 bg-white px-2 py-0.5 font-mono text-3xs text-ink/70">
                                {proposal.requestedType}
                              </span>
                            </div>
                            {proposal.paperTitle && (
                              <p className="truncate text-2xs text-ink/60">
                                {proposal.paperTitle}
                              </p>
                            )}
                            <p className="text-2xs text-ink/70">{proposal.description}</p>
                          </div>

                          <div className="shrink-0">
                            {isApproved ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-mint px-2.5 py-1 text-2xs font-semibold text-ink">
                                <Icon icon={CheckIcon} size="xs" />
                                {COPY.policyLedger.approvedWidgetStatus}
                              </span>
                            ) : (
                              <PillButton
                                size="sm"
                                variant="primary"
                                disabled={isApproving}
                                onClick={() => handleApproveWidget(proposal)}
                              >
                                {COPY.policyLedger.approveWidgetButton}
                              </PillButton>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              {/* Cloud Connection Provenance */}
              <div className="flex items-center justify-between rounded-card border border-ink/10 bg-canvas px-4 py-3 text-xs">
                <div className="flex items-center gap-2">
                  {isLiveFirestore ? (
                    <Icon icon={CloudDoneOutlinedIcon} size="sm" className="text-ink" />
                  ) : (
                    <Icon icon={CloudOffOutlinedIcon} size="sm" className="text-ink/60" />
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
