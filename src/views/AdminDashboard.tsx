'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CloseIcon from '@mui/icons-material/Close';
import CloudDoneOutlinedIcon from '@mui/icons-material/CloudDoneOutlined';
import CloudOffOutlinedIcon from '@mui/icons-material/CloudOffOutlined';
import GavelOutlinedIcon from '@mui/icons-material/GavelOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import RefreshIcon from '@mui/icons-material/Refresh';
import RestartAltOutlinedIcon from '@mui/icons-material/RestartAltOutlined';
import SettingsSuggestOutlinedIcon from '@mui/icons-material/SettingsSuggestOutlined';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import TuneOutlinedIcon from '@mui/icons-material/TuneOutlined';
import { toast } from 'sonner';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import { AIIcon } from '@/components/ui/AIIcon';
import { Icon } from '@/components/ui/Icon';
import { IconTile } from '@/components/ui/IconTile';
import { PillButton, pillClassName } from '@/components/ui/PillButton';
import { useAuth } from '@/contexts/AuthContext';
import { useLocale } from '@/contexts/LocaleContext';
import { usePolicyLedger } from '@/contexts/PolicyLedgerContext';
import { useRoutine } from '@/contexts/RoutineContext';
import { LEGAL_DOCUMENTS } from '@/data/legal';
import { ROUTES } from '@/data/navigation';
import type { GuardrailLedgerResponse } from '@/types/guardrails';
import type { ProposedWidgetSpec } from '@/types/routine';
import { cn } from '@/utils/cn';

type AdminTab = 'guardrails' | 'widgets' | 'system';
type WidgetFilter = 'all' | 'pending_review' | 'approved';

interface AdminOverviewResponse {
  guardrails: GuardrailLedgerResponse;
  proposals: ProposedWidgetSpec[];
  counts: {
    pendingWidgets: number;
    approvedWidgets: number;
    totalWidgets: number;
    bannedKeywords: number;
    curatedPapers: number;
    legalDocuments: number;
  };
  runtime: {
    firebaseProjectId: string;
    aiProviderConfigured: boolean;
    firestoreStatus: 'connected' | 'unconfigured' | 'error';
    isLiveFirestore: boolean;
    serverTime: string;
  };
}

export function AdminDashboard() {
  const { copy } = useLocale();
  const t = copy.admin;
  const { isAdmin, isLoading: isAuthLoading, loginAsAdmin, logout } = useAuth();
  const {
    policy,
    isLiveFirestore,
    firestoreStatus,
    lastSyncedAt,
    isLoading: isPolicyLoading,
    refreshPolicy,
    updatePolicy,
    resetPolicy,
    openPolicyDrawer
  } = usePolicyLedger();
  const { dataCollectionSpec, stagingRoutine, approveProposedWidget, resetToDefaults } = useRoutine();

  const [activeTab, setActiveTab] = useState<AdminTab>('guardrails');
  const [overview, setOverview] = useState<AdminOverviewResponse | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Guardrails form state
  const [painThreshold, setPainThreshold] = useState(4);
  const [loadReduction, setLoadReduction] = useState(20);
  const [progressionWindow, setProgressionWindow] = useState(7);
  const [progressionMaxPain, setProgressionMaxPain] = useState(2);
  const [escalationMessage, setEscalationMessage] = useState('');
  const [clinicalDisclaimer, setClinicalDisclaimer] = useState('');
  const [bannedKeywords, setBannedKeywords] = useState<string[]>([]);
  const [newKeyword, setNewKeyword] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Widget review state
  const [widgetFilter, setWidgetFilter] = useState<WidgetFilter>('all');
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const fetchOverview = useCallback(async () => {
    try {
      setIsRefreshing(true);
      const res = await fetch('/api/admin/overview', { cache: 'no-store' });
      if (res.ok) {
        const data: AdminOverviewResponse = await res.json();
        setOverview(data);
      }
    } catch (err) {
      console.warn('[AdminDashboard] Could not load overview telemetry:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) {
      fetchOverview();
    }
  }, [isAdmin, fetchOverview]);

  useEffect(() => {
    if (!policy) return;
    setPainThreshold(policy.painEscalationThreshold);
    setLoadReduction(policy.loadReductionPercent);
    setProgressionWindow(policy.progressionWindowLogs);
    setProgressionMaxPain(policy.progressionMaxPainScore);
    setEscalationMessage(policy.escalationAlertMessage);
    setClinicalDisclaimer(policy.clinicalDisclaimer);
    setBannedKeywords(policy.bannedKeywords ?? []);
    setHasUnsavedChanges(false);
  }, [policy]);

  const mergedProposals = useMemo(() => {
    const map = new Map<string, ProposedWidgetSpec>();
    for (const item of overview?.proposals ?? []) {
      map.set(item.id, item);
    }
    const localFields = [
      ...(dataCollectionSpec ?? []),
      ...(stagingRoutine?.dataCollectionSpec ?? [])
    ];
    for (const field of localFields) {
      if (field.proposedWidget && !map.has(field.proposedWidget.id)) {
        map.set(field.proposedWidget.id, field.proposedWidget);
      }
    }
    return Array.from(map.values()).sort((a, b) => {
      if (a.status !== b.status) {
        return a.status === 'pending_review' ? -1 : 1;
      }
      return (b.submittedAt || '').localeCompare(a.submittedAt || '');
    });
  }, [overview, dataCollectionSpec, stagingRoutine]);

  const filteredProposals = useMemo(() => {
    if (widgetFilter === 'all') return mergedProposals;
    return mergedProposals.filter((p) => p.status === widgetFilter);
  }, [mergedProposals, widgetFilter]);

  const pendingWidgetCount = useMemo(
    () => mergedProposals.filter((p) => p.status === 'pending_review').length,
    [mergedProposals]
  );
  const approvedWidgetCount = useMemo(
    () => mergedProposals.filter((p) => p.status === 'approved').length,
    [mergedProposals]
  );

  const handleRefreshAll = async () => {
    await Promise.all([refreshPolicy(), fetchOverview()]);
  };

  const handleAddKeyword = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = newKeyword.trim().toLowerCase();
    if (!cleaned) return;
    if (bannedKeywords.some((k) => k.toLowerCase() === cleaned)) {
      setNewKeyword('');
      return;
    }
    setBannedKeywords((prev) => [...prev, cleaned]);
    setNewKeyword('');
    setHasUnsavedChanges(true);
  };

  const handleRemoveKeyword = (keyword: string) => {
    setBannedKeywords((prev) => prev.filter((item) => item !== keyword));
    setHasUnsavedChanges(true);
  };

  const handleSaveGuardrails = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await updatePolicy({
      painEscalationThreshold: painThreshold,
      loadReductionPercent: loadReduction,
      progressionWindowLogs: progressionWindow,
      progressionMaxPainScore: progressionMaxPain,
      escalationAlertMessage: escalationMessage,
      clinicalDisclaimer,
      bannedKeywords
    });
    if (ok) {
      setHasUnsavedChanges(false);
      await fetchOverview();
    }
  };

  const handleResetGuardrails = async () => {
    const ok = await resetPolicy();
    if (ok) {
      setHasUnsavedChanges(false);
      await fetchOverview();
    }
  };

  const handleApproveWidget = async (proposal: ProposedWidgetSpec) => {
    try {
      setApprovingId(proposal.id);
      const res = await fetch('/api/admin/widgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proposalId: proposal.id })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || copy.api.widgets.approveError);
        return;
      }
      const payload = await res.json().catch(() => ({}));
      approveProposedWidget(payload.proposal || { ...proposal, status: 'approved' });
      toast.success(copy.api.widgets.approveSuccess);
      await fetchOverview();
    } catch {
      toast.error(copy.api.widgets.approveError);
    } finally {
      setApprovingId(null);
    }
  };

  if (isAuthLoading) {
    return (
      <PageContainer>
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-ink border-t-transparent" />
        </div>
      </PageContainer>
    );
  }

  // Access Gate when caller is not an administrator
  if (!isAdmin) {
    return (
      <PageContainer>
        <div className="mx-auto my-8 max-w-xl rounded-callout bg-canvas p-8 text-center sm:p-10">
          <div className="mx-auto flex justify-center">
            <IconTile variant="plain" shape="circle" size={48} className="bg-cream text-ink">
              <Icon icon={LockOutlinedIcon} size="md" />
            </IconTile>
          </div>
          <p className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-cream px-3 py-1 text-xs font-semibold text-ink">
            <Icon icon={ShieldOutlinedIcon} size="xs" />
            <span>{t.restrictedBadge}</span>
          </p>
          <h1 className="mt-4 text-balance font-display text-3xl font-bold tracking-tight text-ink">
            {t.restrictedTitle}
          </h1>
          <p className="mt-3 text-pretty text-sm leading-relaxed text-ink/75 sm:text-base">
            {t.restrictedBody}
          </p>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Link href={ROUTES.login} className={pillClassName('ink', 'md', 'min-h-11 px-5 font-semibold')}>
              {t.restrictedSignInCta}
            </Link>
            <Link href={ROUTES.routine} className={pillClassName('outline', 'md', 'min-h-11 px-5 font-semibold')}>
              {t.restrictedBackCta}
            </Link>
          </div>

          <div className="mt-7 border-t border-ink/10 pt-5">
            <button
              type="button"
              onClick={() => {
                loginAsAdmin();
                toast.success(copy.auth.toastAdminEntered);
              }}
              className="inline-flex min-h-10 items-center gap-1.5 text-sm font-semibold text-ink underline underline-offset-4 transition-colors hover:text-ink/80"
            >
              <Icon icon={ShieldOutlinedIcon} size="xs" />
              <span>{t.restrictedDemoCta}</span>
            </button>
            <p className="mt-1 text-xs text-ink/60">{t.restrictedDemoNote}</p>
          </div>
        </div>
      </PageContainer>
    );
  }

  const firestoreBadgeLabel = isLiveFirestore
    ? t.firestoreLive
    : firestoreStatus === 'error'
    ? t.firestoreError
    : t.memoryLedger;

  return (
    <PageContainer>
      {/* Header Row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <PageHeader eyebrow={t.eyebrow} title={t.title} />
          <p className="mt-1 max-w-2xl text-pretty text-sm text-ink/70">{t.subtitle}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 pb-1">
          <span
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-ink',
              isLiveFirestore ? 'bg-mint' : 'bg-cream'
            )}
          >
            <Icon icon={isLiveFirestore ? CloudDoneOutlinedIcon : CloudOffOutlinedIcon} size="xs" />
            <span>{firestoreBadgeLabel}</span>
          </span>
          <PillButton
            variant="outline"
            size="sm"
            onClick={handleRefreshAll}
            loading={isRefreshing || isPolicyLoading}
            className="gap-1.5 font-semibold"
          >
            <Icon icon={RefreshIcon} size="xs" />
            <span>{t.refreshButton}</span>
          </PillButton>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-callout bg-mint p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink/65">{t.kpi.ledgerLabel}</p>
          <p className="mt-2 truncate font-display text-xl font-bold text-ink">
            {policy?.version || '—'}
          </p>
          <p className="mt-1 text-xs text-ink/75">{policy?.source || 'hardcoded-baseline'}</p>
        </div>

        <div className="rounded-callout bg-cream p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink/65">{t.kpi.thresholdsLabel}</p>
          <p className="mt-2 font-display text-xl font-bold tabular-nums text-ink">
            VAS ≥ {painThreshold}/10
          </p>
          <p className="mt-1 text-xs tabular-nums text-ink/75">
            -{loadReduction}% auto load reduction
          </p>
        </div>

        <div className="rounded-callout bg-sky p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink/65">{t.kpi.widgetsLabel}</p>
          <p className="mt-2 font-display text-xl font-bold tabular-nums text-ink">
            {pendingWidgetCount} {t.kpi.pendingSuffix}
          </p>
          <p className="mt-1 text-xs tabular-nums text-ink/75">
            {approvedWidgetCount} {t.kpi.approvedSuffix}
          </p>
        </div>

        <div className="rounded-callout bg-lavender p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink/65">{t.kpi.keywordsLabel}</p>
          <p className="mt-2 font-display text-xl font-bold tabular-nums text-ink">
            {bannedKeywords.length}
          </p>
          <p className="mt-1 text-xs text-ink/75">{t.kpi.keywordsSuffix}</p>
        </div>
      </div>

      {/* Section Tabs */}
      <div
        role="tablist"
        aria-label={t.title}
        className="mt-7 flex flex-wrap gap-2 border-b border-ink/10 pb-4"
      >
        {(
          [
            { id: 'guardrails', label: t.tabs.guardrails, icon: TuneOutlinedIcon },
            {
              id: 'widgets',
              label: `${t.tabs.widgets}${pendingWidgetCount > 0 ? ` (${pendingWidgetCount})` : ''}`,
              icon: SettingsSuggestOutlinedIcon
            },
            { id: 'system', label: t.tabs.system, icon: GavelOutlinedIcon }
          ] as const
        ).map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold transition-colors',
                active
                  ? 'bg-ink text-white'
                  : 'bg-canvas text-ink/75 hover:bg-ink/10 hover:text-ink'
              )}
            >
              <Icon icon={tab.icon} size="xs" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Guardrails & Scientific Gatekeeper */}
      {activeTab === 'guardrails' && (
        <form onSubmit={handleSaveGuardrails} className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left: Thresholds & Clinical Copy */}
          <div className="space-y-6 rounded-callout bg-canvas p-6 lg:col-span-7">
            <div>
              <h2 className="font-display text-xl font-bold text-ink">{t.guardrails.sectionTitle}</h2>
              <p className="mt-1 text-sm text-ink/70">{t.guardrails.sectionSubtitle}</p>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              {/* Pain Escalation Threshold */}
              <div className="rounded-2xl bg-white p-4">
                <div className="flex items-center justify-between gap-2">
                  <label htmlFor="admin-pain-threshold" className="text-sm font-semibold text-ink">
                    {t.guardrails.painLabel}
                  </label>
                  <span className="rounded-full bg-blush px-2.5 py-0.5 text-xs font-bold tabular-nums text-ink">
                    {painThreshold}/10
                  </span>
                </div>
                <input
                  id="admin-pain-threshold"
                  type="range"
                  min={1}
                  max={10}
                  value={painThreshold}
                  onChange={(e) => {
                    setPainThreshold(Number(e.target.value));
                    setHasUnsavedChanges(true);
                  }}
                  className="mt-3 w-full accent-ink"
                />
                <p className="mt-1.5 text-xs text-ink/65">{t.guardrails.painHint}</p>
              </div>

              {/* Load Reduction Percent */}
              <div className="rounded-2xl bg-white p-4">
                <div className="flex items-center justify-between gap-2">
                  <label htmlFor="admin-load-reduction" className="text-sm font-semibold text-ink">
                    {t.guardrails.loadReductionLabel}
                  </label>
                  <span className="rounded-full bg-cream px-2.5 py-0.5 text-xs font-bold tabular-nums text-ink">
                    -{loadReduction}%
                  </span>
                </div>
                <input
                  id="admin-load-reduction"
                  type="range"
                  min={5}
                  max={90}
                  step={5}
                  value={loadReduction}
                  onChange={(e) => {
                    setLoadReduction(Number(e.target.value));
                    setHasUnsavedChanges(true);
                  }}
                  className="mt-3 w-full accent-ink"
                />
                <p className="mt-1.5 text-xs text-ink/65">{t.guardrails.loadReductionHint}</p>
              </div>

              {/* Progression Window */}
              <div className="rounded-2xl bg-white p-4">
                <label htmlFor="admin-prog-window" className="block text-sm font-semibold text-ink">
                  {t.guardrails.progressionWindowLabel}
                </label>
                <input
                  id="admin-prog-window"
                  type="number"
                  min={1}
                  max={30}
                  value={progressionWindow}
                  onChange={(e) => {
                    setProgressionWindow(Number(e.target.value));
                    setHasUnsavedChanges(true);
                  }}
                  className="mt-2 min-h-11 w-full rounded-xl border border-ink/25 bg-canvas/40 px-3 text-sm font-semibold tabular-nums text-ink focus:border-ink focus:outline-none"
                />
              </div>

              {/* Progression Max Pain */}
              <div className="rounded-2xl bg-white p-4">
                <label htmlFor="admin-prog-max-pain" className="block text-sm font-semibold text-ink">
                  {t.guardrails.progressionMaxPainLabel}
                </label>
                <input
                  id="admin-prog-max-pain"
                  type="number"
                  min={0}
                  max={10}
                  value={progressionMaxPain}
                  onChange={(e) => {
                    setProgressionMaxPain(Number(e.target.value));
                    setHasUnsavedChanges(true);
                  }}
                  className="mt-2 min-h-11 w-full rounded-xl border border-ink/25 bg-canvas/40 px-3 text-sm font-semibold tabular-nums text-ink focus:border-ink focus:outline-none"
                />
              </div>
            </div>

            {/* Escalation Alert Message */}
            <div>
              <label htmlFor="admin-escalation-msg" className="block text-sm font-semibold text-ink">
                {t.guardrails.escalationMessageLabel}
              </label>
              <textarea
                id="admin-escalation-msg"
                rows={2}
                value={escalationMessage}
                onChange={(e) => {
                  setEscalationMessage(e.target.value);
                  setHasUnsavedChanges(true);
                }}
                className="mt-1.5 w-full rounded-xl border border-ink/25 bg-white p-3 text-sm leading-relaxed text-ink focus:border-ink focus:outline-none"
              />
            </div>

            {/* Clinical Disclaimer */}
            <div>
              <label htmlFor="admin-clinical-disclaimer" className="block text-sm font-semibold text-ink">
                {t.guardrails.clinicalDisclaimerLabel}
              </label>
              <textarea
                id="admin-clinical-disclaimer"
                rows={2}
                value={clinicalDisclaimer}
                onChange={(e) => {
                  setClinicalDisclaimer(e.target.value);
                  setHasUnsavedChanges(true);
                }}
                className="mt-1.5 w-full rounded-xl border border-ink/25 bg-white p-3 text-sm leading-relaxed text-ink focus:border-ink focus:outline-none"
              />
            </div>

            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink/10 pt-4">
              <div className="text-xs font-medium text-ink/70">
                {hasUnsavedChanges ? (
                  <span className="rounded-full bg-yellow px-3 py-1 font-semibold text-ink">
                    {t.guardrails.unsavedChanges}
                  </span>
                ) : null}
              </div>
              <div className="flex flex-wrap items-center gap-2.5">
                <PillButton
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleResetGuardrails}
                  disabled={isPolicyLoading}
                  className="gap-1.5 font-semibold"
                >
                  <Icon icon={RestartAltOutlinedIcon} size="xs" />
                  <span>{t.guardrails.resetButton}</span>
                </PillButton>
                <PillButton
                  type="submit"
                  variant="ink"
                  size="sm"
                  loading={isPolicyLoading}
                  disabled={!hasUnsavedChanges}
                  className="font-semibold"
                >
                  {t.guardrails.saveButton}
                </PillButton>
              </div>
            </div>
          </div>

          {/* Right: Scientific Gatekeeper Blocklist */}
          <div className="flex flex-col justify-between rounded-callout bg-canvas p-6 lg:col-span-5">
            <div>
              <h2 className="font-display text-xl font-bold text-ink">{t.guardrails.keywordsTitle}</h2>
              <p className="mt-1 text-sm text-ink/70">{t.guardrails.keywordsSubtitle}</p>

              <div className="mt-4 flex gap-2">
                <input
                  type="text"
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleAddKeyword(e);
                    }
                  }}
                  placeholder={t.guardrails.keywordPlaceholder}
                  className="min-h-11 flex-1 rounded-xl border border-ink/25 bg-white px-3.5 text-sm text-ink placeholder:text-ink/50 focus:border-ink focus:outline-none"
                />
                <PillButton
                  type="button"
                  variant="ink"
                  size="sm"
                  onClick={handleAddKeyword}
                  className="gap-1 font-semibold"
                >
                  <Icon icon={AddIcon} size="xs" />
                  <span>{t.guardrails.addKeywordButton}</span>
                </PillButton>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {bannedKeywords.map((keyword) => (
                  <span
                    key={keyword}
                    className="inline-flex items-center gap-1.5 rounded-full border border-ink/15 bg-white px-3 py-1.5 text-xs font-semibold text-ink"
                  >
                    <span>{keyword}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveKeyword(keyword)}
                      aria-label={`Remove ${keyword}`}
                      className="rounded-full p-0.5 text-ink/55 transition-colors hover:bg-ink/10 hover:text-ink"
                    >
                      <Icon icon={CloseIcon} size="xs" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </form>
      )}

      {/* Tab 2: Widget Approval Queue */}
      {activeTab === 'widgets' && (
        <section className="mt-6 rounded-callout bg-canvas p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-xl font-bold text-ink">{t.widgets.sectionTitle}</h2>
              <p className="mt-1 text-sm text-ink/70">{t.widgets.sectionSubtitle}</p>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {(
                [
                  { id: 'all', label: `${t.widgets.filterAll} (${mergedProposals.length})` },
                  { id: 'pending_review', label: `${t.widgets.filterPending} (${pendingWidgetCount})` },
                  { id: 'approved', label: `${t.widgets.filterApproved} (${approvedWidgetCount})` }
                ] as const
              ).map((filter) => (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => setWidgetFilter(filter.id)}
                  className={cn(
                    'rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors',
                    widgetFilter === filter.id
                      ? 'bg-ink text-white'
                      : 'bg-white text-ink/75 hover:bg-ink/5 hover:text-ink'
                  )}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          {filteredProposals.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-ink/20 bg-white/70 p-8 text-center">
              <div className="mx-auto flex justify-center">
                <AIIcon size="md" />
              </div>
              <h3 className="mt-3 font-display text-lg font-bold text-ink">{t.widgets.emptyTitle}</h3>
              <p className="mx-auto mt-1 max-w-md text-sm text-ink/70">{t.widgets.emptyBody}</p>
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              {filteredProposals.map((proposal) => {
                const isApproved = proposal.status === 'approved';
                return (
                  <div
                    key={proposal.id}
                    className="flex flex-col justify-between rounded-2xl border border-ink/10 bg-white p-5"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="font-display text-lg font-bold text-ink">{proposal.title}</h3>
                        <span
                          className={cn(
                            'shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold text-ink',
                            isApproved ? 'bg-mint' : 'bg-yellow'
                          )}
                        >
                          {isApproved ? t.widgets.approvedBadge : t.widgets.pendingBadge}
                        </span>
                      </div>

                      <p className="mt-2 text-sm leading-relaxed text-ink/75">{proposal.description}</p>

                      <dl className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-canvas p-3 text-xs">
                        <div>
                          <dt className="text-ink/55">{t.widgets.requestedTypeLabel}</dt>
                          <dd className="mt-0.5 font-semibold text-ink">{proposal.requestedType}</dd>
                        </div>
                        <div>
                          <dt className="text-ink/55">{t.widgets.fieldIdLabel}</dt>
                          <dd className="mt-0.5 truncate font-mono text-ink">{proposal.fieldId}</dd>
                        </div>
                        {proposal.paperTitle && (
                          <div className="col-span-2">
                            <dt className="text-ink/55">{t.widgets.paperLabel}</dt>
                            <dd className="mt-0.5 truncate font-medium text-ink">{proposal.paperTitle}</dd>
                          </div>
                        )}
                      </dl>
                    </div>

                    <div className="mt-4 flex items-center justify-end border-t border-ink/10 pt-3">
                      {isApproved ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink/70">
                          <Icon icon={CheckCircleOutlineIcon} size="xs" />
                          <span>{t.widgets.approvedBadge}</span>
                        </span>
                      ) : (
                        <PillButton
                          type="button"
                          variant="ink"
                          size="sm"
                          loading={approvingId === proposal.id}
                          onClick={() => handleApproveWidget(proposal)}
                          className="font-semibold"
                        >
                          {approvingId === proposal.id ? t.widgets.approvingButton : t.widgets.approveButton}
                        </PillButton>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* Tab 3: System Telemetry, Legal Registry & Workspace Controls */}
      {activeTab === 'system' && (
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Infrastructure Telemetry */}
          <div className="space-y-6 lg:col-span-7">
            <section className="rounded-callout bg-canvas p-6">
              <h2 className="font-display text-xl font-bold text-ink">{t.system.infraTitle}</h2>
              <dl className="mt-4 divide-y divide-ink/10 rounded-2xl bg-white px-5">
                <div className="flex items-center justify-between gap-4 py-3.5 text-sm">
                  <dt className="text-ink/70">{t.system.firestoreLabel}</dt>
                  <dd className="font-semibold text-ink">{firestoreBadgeLabel}</dd>
                </div>
                <div className="flex items-center justify-between gap-4 py-3.5 text-sm">
                  <dt className="text-ink/70">{t.system.projectLabel}</dt>
                  <dd className="font-mono text-xs font-semibold text-ink">
                    {overview?.runtime.firebaseProjectId || '—'}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4 py-3.5 text-sm">
                  <dt className="text-ink/70">{t.system.aiProviderLabel}</dt>
                  <dd className="font-semibold text-ink">
                    {overview?.runtime.aiProviderConfigured ? t.system.configured : t.system.notConfigured}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4 py-3.5 text-sm">
                  <dt className="text-ink/70">{t.system.policySourceLabel}</dt>
                  <dd className="font-mono text-xs font-semibold text-ink">
                    {policy?.source || 'hardcoded-baseline'}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4 py-3.5 text-sm">
                  <dt className="text-ink/70">{t.system.curatedPapersLabel}</dt>
                  <dd className="font-semibold tabular-nums text-ink">
                    {overview?.counts.curatedPapers ?? '—'}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4 py-3.5 text-sm">
                  <dt className="text-ink/70">{t.system.lastSyncedLabel}</dt>
                  <dd className="font-mono text-xs text-ink/80">
                    {lastSyncedAt ? new Date(lastSyncedAt).toLocaleString() : '—'}
                  </dd>
                </div>
              </dl>
            </section>

            {/* Legal Registry */}
            <section className="rounded-callout bg-canvas p-6">
              <h2 className="font-display text-xl font-bold text-ink">{t.system.legalTitle}</h2>
              <p className="mt-1 text-sm text-ink/70">{t.system.legalSubtitle}</p>
              <ul className="mt-4 divide-y divide-ink/10 rounded-2xl bg-white px-5">
                {LEGAL_DOCUMENTS.map((doc) => (
                  <li key={doc.slug} className="flex items-center justify-between gap-4 py-3 text-sm">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-ink">{doc.title}</p>
                      <p className="text-xs text-ink/60">
                        {doc.category} · {doc.lastUpdated}
                      </p>
                    </div>
                    <Link
                      href={doc.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex shrink-0 items-center gap-1 rounded-full border border-ink/20 px-3 py-1 text-xs font-semibold text-ink transition-colors hover:bg-ink/5"
                    >
                      <span>{t.system.openPolicy}</span>
                      <Icon icon={OpenInNewIcon} size="xs" />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          {/* Workspace & Evaluation Controls */}
          <div className="lg:col-span-5">
            <section className="rounded-callout bg-canvas p-6">
              <h2 className="font-display text-xl font-bold text-ink">{t.system.demoToolsTitle}</h2>
              <p className="mt-1 text-sm text-ink/70">{t.system.demoToolsSubtitle}</p>

              <div className="mt-5 space-y-3">
                <PillButton
                  type="button"
                  variant="outline"
                  size="md"
                  fullWidth
                  onClick={openPolicyDrawer}
                  className="justify-center gap-2 font-semibold"
                >
                  <Icon icon={ShieldOutlinedIcon} size="sm" />
                  <span>{t.system.openQuickDrawerButton}</span>
                </PillButton>

                <PillButton
                  type="button"
                  variant="outline"
                  size="md"
                  fullWidth
                  onClick={() => {
                    resetToDefaults();
                    toast.success(copy.shell.resetDemo);
                  }}
                  className="justify-center gap-2 font-semibold"
                >
                  <Icon icon={RestartAltOutlinedIcon} size="sm" />
                  <span>{t.system.resetWorkspaceButton}</span>
                </PillButton>

                <PillButton
                  type="button"
                  variant="ink"
                  size="md"
                  fullWidth
                  onClick={logout}
                  className="justify-center font-semibold"
                >
                  {t.system.signOutAdminButton}
                </PillButton>
              </div>
            </section>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
