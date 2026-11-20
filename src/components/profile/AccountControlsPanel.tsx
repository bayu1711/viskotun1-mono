'use client';

import React, { useState } from 'react';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import PauseCircleOutlineIcon from '@mui/icons-material/PauseCircleOutline';
import RestartAltOutlinedIcon from '@mui/icons-material/RestartAltOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import { useLocale } from '../../contexts/LocaleContext';
import { useRoutine } from '../../contexts/RoutineContext';
import {
  buildUserDataExport,
  downloadUserDataExport
} from '../../utils/accountData';
import { Icon } from '../ui/Icon';
import { Panel } from '../ui/Panel';
import { SectionHeading } from '../ui/SectionHeading';

type ActiveConfirmation = 'clear' | 'deactivate' | 'delete' | null;

export function AccountControlsPanel() {
  const {
    user,
    isGuest,
    userProfile,
    lifestyleProfile,
    deactivateAccount,
    deleteAccount
  } = useAuth();
  const {
    allRoutines,
    allRuntime,
    storedLogsCount,
    clearAllUserData
  } = useRoutine();
  const { copy } = useLocale();
  const t = copy.profile;

  const [confirming, setConfirming] = useState<ActiveConfirmation>(null);
  const [deleteKeywordInput, setDeleteKeywordInput] = useState('');
  const [busyAction, setBusyAction] = useState<ActiveConfirmation>(null);

  const isSignedInAccount = Boolean(user && !isGuest);
  const canConfirmDelete =
    deleteKeywordInput.trim().toUpperCase() === t.deleteConfirmKeyword.toUpperCase();

  const toggleConfirm = (target: ActiveConfirmation) => {
    setDeleteKeywordInput('');
    setConfirming((prev) => (prev === target ? null : target));
  };

  const handleExportData = () => {
    try {
      const snapshot = buildUserDataExport({
        user,
        userProfile,
        lifestyleProfile,
        routines: allRoutines,
        runtime: allRuntime
      });
      downloadUserDataExport(snapshot);
      toast.success(t.exportDataSuccessToast);
    } catch {
      toast.error(t.actionErrorToast);
    }
  };

  const handleClearAllData = async () => {
    setBusyAction('clear');
    try {
      await clearAllUserData();
      setConfirming(null);
      toast.success(t.clearDataSuccessToast);
    } catch {
      toast.error(t.actionErrorToast);
    } finally {
      setBusyAction(null);
    }
  };

  const handleDeactivateAccount = async () => {
    setBusyAction('deactivate');
    try {
      await deactivateAccount();
      toast.success(t.deactivatedToast);
    } catch {
      toast.error(t.actionErrorToast);
    } finally {
      setBusyAction(null);
    }
  };

  const handleDeleteAccount = async () => {
    if (!canConfirmDelete) return;
    setBusyAction('delete');
    try {
      await deleteAccount();
      toast.success(t.deletedToast);
    } catch {
      toast.error(t.actionErrorToast);
    } finally {
      setBusyAction(null);
    }
  };

  return (
    <Panel tone="white" className="space-y-5">
      <div>
        <SectionHeading eyebrow={t.dataPrivacyEyebrow} title={t.dataPrivacyTitle} />
        <p className="mt-1.5 text-xs leading-relaxed text-ink/65">{t.dataPrivacySubtitle}</p>
      </div>

      <div className="divide-y divide-ink/10">
        {/* 1. Export Data (JSON) */}
        <div className="flex flex-col gap-3 py-4 first:pt-0 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-ink">{t.exportDataTitle}</p>
              <span className="rounded-full bg-cream px-2 py-0.5 text-2xs font-medium text-ink/75 tabular-nums">
                {t.storedDataSummary(allRoutines.length, storedLogsCount)}
              </span>
            </div>
            <p className="text-xs leading-relaxed text-ink/65">{t.exportDataDesc}</p>
          </div>

          <button
            type="button"
            onClick={handleExportData}
            disabled={busyAction !== null}
            className="inline-flex min-h-[40px] shrink-0 items-center justify-center gap-1.5 rounded-full border border-ink/20 bg-canvas px-4 py-2 text-xs font-semibold text-ink transition-colors hover:border-ink hover:bg-cream disabled:opacity-50 cursor-pointer"
          >
            <Icon icon={DownloadOutlinedIcon} size="xs" />
            <span>{t.exportDataBtn}</span>
          </button>
        </div>

        {/* 2. Clear All Data */}
        <div className="space-y-3 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 space-y-1">
              <p className="text-sm font-semibold text-ink">{t.clearDataTitle}</p>
              <p className="text-xs leading-relaxed text-ink/65">{t.clearDataDesc}</p>
            </div>

            <button
              type="button"
              onClick={() => toggleConfirm('clear')}
              disabled={busyAction !== null}
              aria-expanded={confirming === 'clear'}
              className="inline-flex min-h-[40px] shrink-0 items-center justify-center gap-1.5 rounded-full border border-ink/25 bg-white px-4 py-2 text-xs font-semibold text-ink transition-colors hover:border-ink hover:bg-cream/60 disabled:opacity-50 cursor-pointer"
            >
              <Icon icon={RestartAltOutlinedIcon} size="xs" />
              <span>{t.clearDataBtn}</span>
            </button>
          </div>

          {confirming === 'clear' && (
            <div
              role="region"
              aria-label={t.clearDataConfirmTitle}
              className="rounded-2xl border border-ink/15 bg-cream/70 p-4 space-y-3"
            >
              <p className="text-xs font-semibold text-ink">{t.clearDataConfirmTitle}</p>
              <p className="text-xs leading-relaxed text-ink/75">{t.clearDataConfirmBody}</p>
              <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setConfirming(null)}
                  disabled={busyAction !== null}
                  className="min-h-[38px] rounded-full border border-ink/20 bg-white px-4 py-1.5 text-xs font-medium text-ink hover:border-ink cursor-pointer"
                >
                  {t.cancelBtn}
                </button>
                <button
                  type="button"
                  onClick={handleClearAllData}
                  disabled={busyAction !== null}
                  className="min-h-[38px] rounded-full bg-ink px-4 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50 cursor-pointer"
                >
                  {busyAction === 'clear' ? t.workingLabel : t.clearDataConfirmBtn}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 3. Deactivate Account */}
        <div className="space-y-3 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 space-y-1">
              <p className="text-sm font-semibold text-ink">{t.deactivateTitle}</p>
              <p className="text-xs leading-relaxed text-ink/65">
                {isSignedInAccount ? t.deactivateDesc : t.deactivateGuestHint}
              </p>
            </div>

            <button
              type="button"
              onClick={() => toggleConfirm('deactivate')}
              disabled={!isSignedInAccount || busyAction !== null}
              aria-expanded={confirming === 'deactivate'}
              className="inline-flex min-h-[40px] shrink-0 items-center justify-center gap-1.5 rounded-full border border-ink/25 bg-white px-4 py-2 text-xs font-semibold text-ink transition-colors hover:border-ink hover:bg-cream/60 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <Icon icon={PauseCircleOutlineIcon} size="xs" />
              <span>{t.deactivateBtn}</span>
            </button>
          </div>

          {confirming === 'deactivate' && isSignedInAccount && (
            <div
              role="region"
              aria-label={t.deactivateConfirmTitle}
              className="rounded-2xl border border-ink/15 bg-cream/70 p-4 space-y-3"
            >
              <p className="text-xs font-semibold text-ink">{t.deactivateConfirmTitle}</p>
              <p className="text-xs leading-relaxed text-ink/75">{t.deactivateConfirmBody}</p>
              <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setConfirming(null)}
                  disabled={busyAction !== null}
                  className="min-h-[38px] rounded-full border border-ink/20 bg-white px-4 py-1.5 text-xs font-medium text-ink hover:border-ink cursor-pointer"
                >
                  {t.cancelBtn}
                </button>
                <button
                  type="button"
                  onClick={handleDeactivateAccount}
                  disabled={busyAction !== null}
                  className="min-h-[38px] rounded-full bg-ink px-4 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50 cursor-pointer"
                >
                  {busyAction === 'deactivate' ? t.workingLabel : t.deactivateConfirmBtn}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 4. Delete Account (Permanent) */}
        <div className="space-y-3 pt-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 space-y-1">
              <p className="text-sm font-semibold text-ink">{t.deleteTitle}</p>
              <p className="text-xs leading-relaxed text-ink/65">
                {isSignedInAccount ? t.deleteDesc : t.deleteGuestDesc}
              </p>
            </div>

            <button
              type="button"
              onClick={() => toggleConfirm('delete')}
              disabled={busyAction !== null}
              aria-expanded={confirming === 'delete'}
              className="inline-flex min-h-[40px] shrink-0 items-center justify-center gap-1.5 rounded-full border border-ink/30 bg-blush/65 px-4 py-2 text-xs font-semibold text-ink transition-colors hover:bg-blush disabled:opacity-50 cursor-pointer"
            >
              <Icon icon={DeleteOutlineIcon} size="xs" />
              <span>{t.deleteBtn}</span>
            </button>
          </div>

          {confirming === 'delete' && (
            <div
              role="region"
              aria-label={t.deleteConfirmTitle}
              className="rounded-2xl border border-ink/25 bg-blush/45 p-4 space-y-3"
            >
              <div className="flex items-start gap-2">
                <Icon icon={WarningAmberOutlinedIcon} size="sm" className="mt-0.5 shrink-0 text-ink" />
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-ink">{t.deleteConfirmTitle}</p>
                  <p className="text-xs leading-relaxed text-ink/80">{t.deleteConfirmBody}</p>
                </div>
              </div>

              <div>
                <label
                  htmlFor="delete-account-confirm"
                  className="mb-1.5 block text-2xs font-semibold text-ink"
                >
                  {t.deleteConfirmInputLabel}
                </label>
                <input
                  id="delete-account-confirm"
                  type="text"
                  autoComplete="off"
                  value={deleteKeywordInput}
                  onChange={(e) => setDeleteKeywordInput(e.target.value)}
                  placeholder={t.deleteConfirmInputPlaceholder}
                  className="w-full rounded-xl border border-ink/25 bg-white px-3.5 py-2 text-base sm:text-sm text-ink outline-none focus:border-ink"
                />
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setConfirming(null);
                    setDeleteKeywordInput('');
                  }}
                  disabled={busyAction !== null}
                  className="min-h-[38px] rounded-full border border-ink/20 bg-white px-4 py-1.5 text-xs font-medium text-ink hover:border-ink cursor-pointer"
                >
                  {t.cancelBtn}
                </button>
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  disabled={!canConfirmDelete || busyAction !== null}
                  className="inline-flex min-h-[38px] items-center gap-1.5 rounded-full bg-ink px-4 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer"
                >
                  <Icon icon={DeleteOutlineIcon} size="xs" />
                  <span>{busyAction === 'delete' ? t.workingLabel : t.deleteConfirmBtn}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Panel>
  );
}
