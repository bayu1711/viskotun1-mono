'use client';

import React, { useCallback, useEffect, useState } from 'react';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import CheckOutlinedIcon from '@mui/icons-material/CheckOutlined';
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined';
import NotificationsActiveOutlinedIcon from '@mui/icons-material/NotificationsActiveOutlined';
import OpenInNewOutlinedIcon from '@mui/icons-material/OpenInNewOutlined';
import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined';
import SendOutlinedIcon from '@mui/icons-material/SendOutlined';
import TelegramIcon from '@mui/icons-material/Telegram';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import { useLocale } from '../../contexts/LocaleContext';
import { apiFetch, apiPostJson } from '../../lib/apiClient';
import type { TouchpointStatusResponse } from '../../types/notifications';
import { requestBrowserFcmToken } from '../../utils/notifications';
import { Icon } from '../ui/Icon';

export function TouchpointChannelsPanel() {
  const { user, updateUserProfile } = useAuth();
  const { copy } = useLocale();
  const tp = copy.touchpoints;

  const [status, setStatus] = useState<TouchpointStatusResponse | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [copiedFeed, setCopiedFeed] = useState(false);

  const userId = user?.id;

  const loadStatus = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await apiFetch(`/api/notifications/preferences?userId=${encodeURIComponent(userId)}`);
      if (!res.ok) return;
      const data = await res.json();
      setStatus(data);
    } catch {
      // Fail-safe non-blocking fetch
    }
  }, [userId]);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  const handleCopyCalendarFeed = async () => {
    if (!status?.calendarFeedHttpsUrl) return;
    try {
      await navigator.clipboard.writeText(status.calendarFeedHttpsUrl);
      setCopiedFeed(true);
      toast.success(tp.feedUrlCopiedToast);
      window.setTimeout(() => setCopiedFeed(false), 2000);
    } catch {
      toast.error('Unable to copy calendar feed URL.');
    }
  };

  const handleRotateCalendarToken = async () => {
    if (!userId) return;
    setBusyAction('rotate_calendar');
    try {
      const res = await apiPostJson('/api/notifications/preferences', {
        userId,
        action: 'rotate_calendar_token'
      });
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
        updateUserProfile({ calendarFeedToken: data.calendarFeedToken });
        toast.success(tp.feedTokenRotatedToast);
      }
    } finally {
      setBusyAction(null);
    }
  };

  const handleEnableWebPush = async () => {
    if (!userId) return;
    setBusyAction('web_push');
    try {
      const result = await requestBrowserFcmToken();
      if (!result.ok) {
        if (result.reason === 'permission_denied') {
          toast.error(tp.webPushDeniedToast);
        } else if (result.reason === 'missing_vapid') {
          toast.error(tp.webPushMissingVapidNotice);
        } else if (result.reason === 'unsupported') {
          toast.error(tp.webPushUnsupportedToast);
        } else {
          toast.error(result.error || tp.webPushUnsupportedToast);
        }
        return;
      }

      const res = await apiPostJson('/api/notifications/preferences', {
        userId,
        action: 'register_fcm_token',
        fcmToken: result.token
      });
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
        toast.success(tp.webPushEnabledToast);
      }
    } finally {
      setBusyAction(null);
    }
  };

  const handleRemoveWebPush = async () => {
    if (!userId) return;
    setBusyAction('remove_web_push');
    try {
      const res = await apiFetch('/api/notifications/preferences', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, target: 'web_push' })
      });
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
        toast.success(tp.webPushRemovedToast);
      }
    } finally {
      setBusyAction(null);
    }
  };

  const handleGenerateTelegramLink = async () => {
    if (!userId) return;
    setBusyAction('telegram_link');
    try {
      const res = await apiPostJson('/api/notifications/preferences', {
        userId,
        action: 'generate_telegram_link'
      });
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } finally {
      setBusyAction(null);
    }
  };

  const handleUnlinkTelegram = async () => {
    if (!userId) return;
    setBusyAction('telegram_unlink');
    try {
      const res = await apiFetch('/api/notifications/preferences', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, target: 'telegram' })
      });
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
        toast.success(tp.telegramUnlinkedToast);
      }
    } finally {
      setBusyAction(null);
    }
  };

  const handleSendTestNudge = async () => {
    if (!userId) return;
    setBusyAction('test_nudge');
    try {
      const res = await apiPostJson('/api/notifications/preferences', {
        userId,
        action: 'send_test_nudge'
      });
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
        const sentCount = (data.dispatch?.sentWebPush ?? 0) + (data.dispatch?.sentTelegram ?? 0);
        if (sentCount > 0) {
          toast.success(tp.testNudgeSentToast);
        } else {
          toast.message(tp.testNudgeNoTargetToast);
        }
      }
    } finally {
      setBusyAction(null);
    }
  };

  if (!userId) return null;

  return (
    <div className="border-t border-ink/10 pt-5 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-xs font-semibold text-ink/85">{tp.title}</p>
            <span className="rounded-full bg-mint px-2 py-0.5 text-3xs font-bold text-ink">
              {tp.freeBadge}
            </span>
          </div>
          <p className="mt-0.5 text-2xs leading-relaxed text-ink/65">{tp.subtitle}</p>
        </div>
        <button
          type="button"
          onClick={handleSendTestNudge}
          disabled={busyAction !== null}
          className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-ink/20 bg-white px-3 py-1 text-2xs font-semibold text-ink transition-colors hover:bg-cream disabled:opacity-50 cursor-pointer"
        >
          <Icon icon={SendOutlinedIcon} size="xs" />
          <span>{tp.sendTestNudgeBtn}</span>
        </button>
      </div>

      {/* Channel 1: Live Subscribable webcal:// Calendar Feed */}
      <div className="rounded-2xl border border-ink/10 bg-cream/40 p-4 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Icon icon={CalendarTodayOutlinedIcon} size="sm" className="text-ink" />
            <p className="text-xs font-semibold text-ink">{tp.calendarTitle}</p>
          </div>
          <button
            type="button"
            onClick={handleRotateCalendarToken}
            disabled={busyAction !== null}
            className="inline-flex items-center gap-1 text-3xs font-medium text-ink/60 hover:text-ink cursor-pointer"
          >
            <Icon icon={RefreshOutlinedIcon} size="xs" />
            <span>{tp.rotateFeedTokenBtn}</span>
          </button>
        </div>
        <p className="text-2xs leading-relaxed text-ink/70">{tp.calendarDesc}</p>

        {status?.calendarFeedHttpsUrl && (
          <div className="flex flex-wrap items-center gap-2 pt-0.5">
            <a
              href={status.calendarFeedWebcalUrl}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-ink px-3.5 py-1.5 text-2xs font-semibold text-white transition-opacity hover:opacity-90"
            >
              <Icon icon={OpenInNewOutlinedIcon} size="xs" />
              <span>{tp.subscribeWebcalBtn}</span>
            </a>
            <button
              type="button"
              onClick={handleCopyCalendarFeed}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-ink/20 bg-white px-3 py-1.5 text-2xs font-semibold text-ink transition-colors hover:bg-cream cursor-pointer"
            >
              <Icon icon={copiedFeed ? CheckOutlinedIcon : ContentCopyOutlinedIcon} size="xs" />
              <span>{tp.copyFeedUrlBtn}</span>
            </button>
          </div>
        )}
      </div>

      {/* Channel 2: Web Push (FCM) */}
      <div className="rounded-2xl border border-ink/10 bg-canvas/60 p-4 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Icon icon={NotificationsActiveOutlinedIcon} size="sm" className="text-ink" />
            <p className="text-xs font-semibold text-ink">{tp.webPushTitle}</p>
          </div>
          {status && status.webPushTokenCount > 0 && (
            <span className="rounded-full bg-mint px-2.5 py-0.5 text-3xs font-semibold text-ink">
              {tp.webPushEnabledBadge(status.webPushTokenCount)}
            </span>
          )}
        </div>
        <p className="text-2xs leading-relaxed text-ink/70">{tp.webPushDesc}</p>

        {status && !status.config.webPushVapidConfigured && (
          <p className="rounded-xl bg-cream/70 px-3 py-2 text-3xs text-ink/75">
            {tp.webPushMissingVapidNotice}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleEnableWebPush}
            disabled={busyAction !== null}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-ink px-3.5 py-1.5 text-2xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 cursor-pointer"
          >
            <Icon icon={NotificationsActiveOutlinedIcon} size="xs" />
            <span>{tp.enableWebPushBtn}</span>
          </button>
          {status && status.webPushTokenCount > 0 && (
            <button
              type="button"
              onClick={handleRemoveWebPush}
              disabled={busyAction !== null}
              className="inline-flex min-h-9 items-center rounded-full border border-ink/20 bg-white px-3 py-1.5 text-2xs font-medium text-ink/75 hover:border-ink/40 cursor-pointer"
            >
              {tp.webPushRemoveBtn}
            </button>
          )}
        </div>
      </div>

      {/* Channel 3: Telegram Bot */}
      <div className="rounded-2xl border border-ink/10 bg-canvas/60 p-4 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Icon icon={TelegramIcon} size="sm" className="text-ink" />
            <p className="text-xs font-semibold text-ink">{tp.telegramTitle}</p>
          </div>
          {status?.telegram.connected && (
            <span className="rounded-full bg-mint px-2.5 py-0.5 text-3xs font-semibold text-ink">
              {tp.telegramConnectedBadge(status.telegram.username)}
            </span>
          )}
        </div>
        <p className="text-2xs leading-relaxed text-ink/70">{tp.telegramDesc}</p>

        {status && !status.config.telegramBotConfigured && (
          <p className="rounded-xl bg-cream/70 px-3 py-2 text-3xs text-ink/75">
            {tp.telegramBotMissingNotice}
          </p>
        )}

        {status?.telegram.linkCode && !status.telegram.connected && (
          <div className="rounded-xl border border-ink/15 bg-white p-3 space-y-2">
            <p className="text-2xs text-ink/80">
              {tp.telegramLinkInstructions(status.telegram.linkCode)}
            </p>
            {status.telegram.deepLinkUrl && (
              <a
                href={status.telegram.deepLinkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-8 items-center gap-1.5 rounded-full bg-ink px-3 py-1 text-2xs font-semibold text-white hover:opacity-90"
              >
                <Icon icon={OpenInNewOutlinedIcon} size="xs" />
                <span>{tp.openTelegramDeepLinkBtn}</span>
              </a>
            )}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          {!status?.telegram.connected ? (
            <button
              type="button"
              onClick={handleGenerateTelegramLink}
              disabled={busyAction !== null}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-ink px-3.5 py-1.5 text-2xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 cursor-pointer"
            >
              <Icon icon={TelegramIcon} size="xs" />
              <span>{tp.connectTelegramBtn}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleUnlinkTelegram}
              disabled={busyAction !== null}
              className="inline-flex min-h-9 items-center rounded-full border border-ink/20 bg-white px-3 py-1.5 text-2xs font-medium text-ink/75 hover:border-ink/40 cursor-pointer"
            >
              {tp.unlinkTelegramBtn}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
