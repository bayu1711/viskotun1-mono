'use client';

import React, { useEffect, useId, useMemo, useState } from 'react';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import CheckOutlinedIcon from '@mui/icons-material/CheckOutlined';
import CloseIcon from '@mui/icons-material/Close';
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined';
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import IosShareOutlinedIcon from '@mui/icons-material/IosShareOutlined';
import OpenInNewOutlinedIcon from '@mui/icons-material/OpenInNewOutlined';
import QrCode2OutlinedIcon from '@mui/icons-material/QrCode2Outlined';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import XIcon from '@mui/icons-material/X';
import { toast } from 'sonner';
import { useRoutine } from '../../contexts/RoutineContext';
import { COPY } from '../../data/copy';
import { downloadIcsFile, getGoogleCalendarUrl } from '../../utils/calendar';
import { buildCalendarBlocksForRoutine } from '../../utils/schedule';
import {
  canNativeShare,
  generateQrCodeDataUrl,
  getRoutineShareUrl,
  getSocialShareUrls,
  triggerNativeShare
} from '../../utils/sharing';
import { formatRoutineTitle } from '../../utils/text';
import { Icon } from '../ui/Icon';

export function ShareRoutineModal() {
  const { routine, routineSchedule, userProfile, isShareModalOpen, closeShareModal } = useRoutine();
  const titleId = useId();
  const descId = useId();

  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [isGeneratingQr, setIsGeneratingQr] = useState(false);

  const displayTitle = formatRoutineTitle(routine?.shortTitle) || routine?.title || 'Clinical Routine';
  const shareUrl = useMemo(
    () => (routine ? getRoutineShareUrl(routine.id) : ''),
    [routine]
  );
  const socialUrls = useMemo(
    () => (routine ? getSocialShareUrls(shareUrl, displayTitle, routine.phase) : null),
    [routine, shareUrl, displayTitle]
  );
  const calendarPlan = useMemo(
    () =>
      routine
        ? buildCalendarBlocksForRoutine(routine, userProfile, routineSchedule)
        : { blocks: [], isCheckInFallback: false },
    [routine, userProfile, routineSchedule]
  );
  const googleCalUrl = useMemo(
    () => (routine ? getGoogleCalendarUrl(routine, { blocks: calendarPlan.blocks }) : ''),
    [routine, calendarPlan]
  );

  // Generate QR Code data URL when modal opens
  useEffect(() => {
    if (!isShareModalOpen || !shareUrl) {
      setQrDataUrl(null);
      return;
    }

    let isMounted = true;
    setIsGeneratingQr(true);

    generateQrCodeDataUrl(shareUrl)
      .then((url) => {
        if (isMounted) setQrDataUrl(url);
      })
      .catch((err) => {
        console.error('[ShareRoutineModal] QR generation error:', err);
      })
      .finally(() => {
        if (isMounted) setIsGeneratingQr(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isShareModalOpen, shareUrl]);

  // Keyboard escape listener
  useEffect(() => {
    if (!isShareModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeShareModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isShareModalOpen, closeShareModal]);

  if (!isShareModalOpen || !routine) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success(COPY.shareModal.copiedToast);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not copy link to clipboard');
    }
  };

  const handleNativeShare = async () => {
    await triggerNativeShare({
      title: `TrialN1 — ${displayTitle}`,
      text: `Follow this evidence-grounded clinical routine on TrialN1: "${displayTitle}"`,
      url: shareUrl
    });
  };

  const handleDownloadIcs = () => {
    const ok = downloadIcsFile(routine, { blocks: calendarPlan.blocks });
    if (ok) {
      toast.success(COPY.shareModal.downloadedIcsToast);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descId}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-ink/40 backdrop-blur-sm transition-opacity"
        onClick={closeShareModal}
        aria-hidden="true"
      />

      {/* Modal Dialog Content */}
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-ink bg-canvas p-6 shadow-2xl transition-all sm:p-7 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-ink/10 pb-4">
          <div>
            <p className="text-2xs font-semibold uppercase tracking-wider text-ink/60">
              {COPY.shareModal.eyebrow}
            </p>
            <h2 id={titleId} className="mt-0.5 text-xl font-bold text-ink">
              {COPY.shareModal.title}
            </h2>
            <p id={descId} className="mt-1 text-xs text-ink/70">
              {COPY.shareModal.description}
            </p>
          </div>
          <button
            type="button"
            onClick={closeShareModal}
            className="rounded-full p-1.5 text-ink/60 hover:bg-cream hover:text-ink transition-colors cursor-pointer"
            aria-label={COPY.shareModal.closeButton}
          >
            <Icon icon={CloseIcon} size="md" />
          </button>
        </div>

        {/* QR Code Section */}
        <div className="mt-5 flex flex-col items-center justify-center rounded-2xl border border-ink/15 bg-white p-5 text-center shadow-xs">
          <div className="flex h-56 w-56 items-center justify-center">
            {isGeneratingQr ? (
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-ink border-t-transparent" />
            ) : qrDataUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={qrDataUrl}
                alt="QR Code for clinical routine deep-link"
                className="h-52 w-52 rounded-xl object-contain"
              />
            ) : (
              <div className="flex flex-col items-center text-ink/40">
                <Icon icon={QrCode2OutlinedIcon} size="xl" />
                <p className="mt-2 text-xs">QR Code</p>
              </div>
            )}
          </div>
          <p className="mt-2 text-xs font-medium text-ink/75">
            {COPY.shareModal.scanQrLabel}
          </p>
        </div>

        {/* Link Copy & Native Share */}
        <div className="mt-4">
          <div className="flex items-center gap-2 rounded-xl border border-ink/20 bg-cream/50 p-1.5 focus-within:border-ink transition-colors">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="min-w-0 flex-1 bg-transparent px-2.5 text-xs text-ink select-all outline-hidden font-mono truncate"
              aria-label="Direct share URL"
            />
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 rounded-lg bg-ink px-3 py-1.5 text-xs font-semibold text-white hover:bg-ink/90 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
            >
              <Icon icon={copied ? CheckOutlinedIcon : ContentCopyOutlinedIcon} size="xs" />
              <span>{copied ? 'Copied' : COPY.shareModal.copyLink}</span>
            </button>
          </div>

          {canNativeShare() && (
            <button
              type="button"
              onClick={handleNativeShare}
              className="mt-2.5 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-ink/20 bg-cream/70 hover:bg-cream py-2 text-xs font-semibold text-ink transition-colors cursor-pointer"
            >
              <Icon icon={IosShareOutlinedIcon} size="xs" />
              <span>{COPY.shareModal.nativeShare}</span>
            </button>
          )}
        </div>

        {/* Social Sharing Channels */}
        {socialUrls && (
          <div className="mt-5">
            <p className="text-2xs font-semibold uppercase tracking-wider text-ink/60 mb-2">
              Share via Channels
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {/* WhatsApp */}
              <a
                href={socialUrls.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 rounded-xl border border-[#25D366]/40 bg-[#25D366]/10 hover:bg-[#25D366]/20 py-2 px-3 text-xs font-semibold text-[#128C7E] transition-colors cursor-pointer"
              >
                <Icon icon={WhatsAppIcon} size="xs" />
                <span>{COPY.shareModal.socialWhatsApp}</span>
              </a>

              {/* X / Twitter */}
              <a
                href={socialUrls.x}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 rounded-xl border border-ink/20 bg-white hover:bg-cream/70 py-2 px-3 text-xs font-semibold text-ink transition-colors cursor-pointer"
              >
                <Icon icon={XIcon} size="xs" />
                <span>{COPY.shareModal.socialX}</span>
              </a>

              {/* LinkedIn */}
              <a
                href={socialUrls.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 rounded-xl border border-[#0A66C2]/30 bg-[#0A66C2]/10 hover:bg-[#0A66C2]/20 py-2 px-3 text-xs font-semibold text-[#0A66C2] transition-colors cursor-pointer"
              >
                <span className="font-bold text-xs">in</span>
                <span>{COPY.shareModal.socialLinkedIn}</span>
              </a>

              {/* Email */}
              <a
                href={socialUrls.email}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-ink/20 bg-white hover:bg-cream/70 py-2 px-3 text-xs font-semibold text-ink transition-colors cursor-pointer"
              >
                <Icon icon={EmailOutlinedIcon} size="xs" />
                <span>{COPY.shareModal.socialEmail}</span>
              </a>
            </div>
          </div>
        )}

        {/* Calendar Sync Section */}
        <div className="mt-5 rounded-2xl border border-ink/15 bg-cream/40 p-4">
          <div className="flex items-center gap-2">
            <Icon icon={CalendarTodayOutlinedIcon} size="sm" className="text-ink" />
            <h3 className="text-xs font-bold text-ink">
              {COPY.shareModal.calendarSectionTitle}
            </h3>
          </div>
          <p className="mt-1 text-2xs text-ink/70">
            {COPY.shareModal.calendarSectionDesc}
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            {/* Google Calendar */}
            <a
              href={googleCalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl bg-ink px-3 py-2 text-xs font-semibold text-white hover:bg-ink/90 active:scale-95 transition-all cursor-pointer"
            >
              <Icon icon={OpenInNewOutlinedIcon} size="xs" />
              <span>{COPY.shareModal.googleCalendar}</span>
            </a>

            {/* Apple / Outlook iCal */}
            <button
              type="button"
              onClick={handleDownloadIcs}
              className="inline-flex items-center gap-1.5 rounded-xl border border-ink/20 bg-white hover:bg-cream px-3 py-2 text-xs font-semibold text-ink transition-colors cursor-pointer"
            >
              <Icon icon={DownloadOutlinedIcon} size="xs" />
              <span>{COPY.shareModal.downloadIcs}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
