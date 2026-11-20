'use client';

import React from 'react';
import Link from 'next/link';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import PublicOutlinedIcon from '@mui/icons-material/PublicOutlined';
import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined';
import ScheduleOutlinedIcon from '@mui/icons-material/ScheduleOutlined';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';
import { useAssistant } from '../../contexts/AssistantContext';
import { useLocale } from '../../contexts/LocaleContext';
import { useRoutine } from '../../contexts/RoutineContext';
import { ROUTES } from '../../data/navigation';
import { cn } from '../../utils/cn';
import { Icon } from '../ui/Icon';

/**
 * Surfaces the guardrail-validated Global AI Lifestyle Adaptation spec on /routine,
 * mirroring how extracted paper methods adapt the routine view dynamically.
 */
export function AdaptiveLifestyleBanner({ className }: { className?: string }) {
  const { activeAdaptation, isAdaptingLifestyle, refreshLifestyleAdaptation } = useRoutine();
  const { openLifestyleTuning } = useAssistant();
  const { locale, isRtl } = useLocale();

  if (!activeAdaptation && !isAdaptingLifestyle) return null;

  return (
    <section
      dir={isRtl ? 'rtl' : 'ltr'}
      aria-label="Adaptive Lifestyle Context"
      className={cn(
        'rounded-card border border-ink/15 bg-cream/65 p-3.5 sm:p-4 transition-colors',
        className
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-0.5 text-3xs font-semibold text-ink border border-ink/10">
            <Icon icon={PublicOutlinedIcon} size="xs" />
            <span>{activeAdaptation?.regionLabel || 'Global Context'}</span>
          </span>

          {activeAdaptation?.suggestedWindow && (
            <span className="inline-flex items-center gap-1 rounded-full bg-mint/50 px-2.5 py-0.5 text-3xs font-semibold text-ink">
              <Icon icon={ScheduleOutlinedIcon} size="xs" />
              <span>{activeAdaptation.suggestedWindow}</span>
            </span>
          )}

          {activeAdaptation?.guardrailVerified && (
            <span
              title={activeAdaptation.safetyGuardrailNote}
              className="inline-flex items-center gap-1 rounded-full border border-ink/15 bg-white/80 px-2 py-0.5 text-3xs font-medium text-ink/75"
            >
              <Icon icon={VerifiedUserOutlinedIcon} size="xs" />
              <span>
                {locale === 'ar' ? 'موثق بضوابط السلامة' : 'Guardrail verified'}
              </span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => refreshLifestyleAdaptation()}
            disabled={isAdaptingLifestyle}
            title={locale === 'ar' ? 'تحديث التكييف الذكي' : 'Refresh AI adaptation'}
            aria-label="Refresh AI lifestyle adaptation"
            className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-ink/15 bg-white text-ink/70 hover:border-ink hover:text-ink disabled:opacity-40 cursor-pointer"
          >
            <Icon icon={RefreshOutlinedIcon} size="xs" className={isAdaptingLifestyle ? 'animate-spin' : ''} />
          </button>

          <button
            type="button"
            onClick={openLifestyleTuning}
            className="inline-flex items-center gap-1 rounded-full border border-ink/15 bg-white px-2.5 py-1 text-3xs font-semibold text-ink hover:border-ink cursor-pointer"
          >
            <Icon icon={AutoAwesomeOutlinedIcon} size="xs" />
            <span>{locale === 'ar' ? 'تعديل' : 'Tune'}</span>
          </button>

          <Link
            href={`${ROUTES.profile}?tab=lifestyle`}
            className="inline-flex items-center rounded-full border border-ink/15 bg-white px-2.5 py-1 text-3xs font-semibold text-ink hover:border-ink"
          >
            {locale === 'ar' ? 'الملف' : 'Profile'}
          </Link>
        </div>
      </div>

      {activeAdaptation && (
        <div className="mt-2">
          <p className="text-xs font-semibold text-ink">{activeAdaptation.bannerTitle}</p>
          <p className="mt-0.5 text-xs leading-relaxed text-ink/75">{activeAdaptation.bannerGuidance}</p>
        </div>
      )}
    </section>
  );
}
