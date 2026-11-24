'use client';

import React from 'react';
import Link from 'next/link';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CookieOutlinedIcon from '@mui/icons-material/CookieOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import GavelOutlinedIcon from '@mui/icons-material/GavelOutlined';
import HealthAndSafetyOutlinedIcon from '@mui/icons-material/HealthAndSafetyOutlined';
import PolicyOutlinedIcon from '@mui/icons-material/PolicyOutlined';
import PsychologyOutlinedIcon from '@mui/icons-material/PsychologyOutlined';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import type { SvgIconComponent } from '@mui/icons-material';
import { LegalHeader } from '@/components/layout/LegalHeader';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { Icon } from '@/components/ui/Icon';
import { IconTile } from '@/components/ui/IconTile';
import { useLocale } from '@/contexts/LocaleContext';
import {
  LEGAL_CONTACT_EMAIL,
  LEGAL_DOCUMENTS,
  PRIVACY_CONTACT_EMAIL,
  type LegalSlug,
  type LegalTone
} from '@/data/legal';
import { ROUTES } from '@/data/navigation';
import { cn } from '@/utils/cn';

const LEGAL_ICONS: Record<LegalSlug, SvgIconComponent> = {
  privacy: ShieldOutlinedIcon,
  terms: GavelOutlinedIcon,
  'terms-of-use': DescriptionOutlinedIcon,
  disclaimer: HealthAndSafetyOutlinedIcon,
  cookies: CookieOutlinedIcon,
  'ai-transparency': PsychologyOutlinedIcon
};

const TONE_BG: Record<LegalTone, string> = {
  mint: 'bg-mint',
  cream: 'bg-cream',
  blush: 'bg-blush',
  sky: 'bg-sky',
  lavender: 'bg-lavender',
  yellow: 'bg-yellow'
};

export function LegalCenter() {
  const { copy, isRtl } = useLocale();
  const t = copy.legal;

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="min-h-screen bg-white font-sans text-ink selection:bg-orange/20 selection:text-ink">
      <LegalHeader />

      <main className="mx-auto max-w-6xl px-5 py-12 lg:px-8 lg:py-16">
        {/* Hero */}
        <div className="max-w-3xl">
          <p className="inline-flex items-center gap-2 rounded-full bg-mint px-3.5 py-1 text-sm font-semibold text-ink">
            <Icon icon={PolicyOutlinedIcon} size="xs" />
            <span>{t.centerBadge}</span>
          </p>
          <h1 className="mt-4 text-balance font-display text-4xl font-bold tracking-tight text-ink sm:text-5xl">
            {t.centerTitle}
          </h1>
          <p className="mt-4 text-pretty text-lg leading-relaxed text-ink/75">
            {t.centerSubtitle}
          </p>
        </div>

        {/* Clinical Safety Callout Banner */}
        <div className="mt-10 rounded-callout bg-blush p-6 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              <IconTile variant="inverse" shape="circle" size={48} className="shrink-0">
                <Icon icon={HealthAndSafetyOutlinedIcon} size="md" />
              </IconTile>
              <div>
                <h2 className="font-display text-lg font-bold text-ink">{t.medicalBannerTitle}</h2>
                <p className="mt-1 max-w-2xl text-pretty text-sm leading-relaxed text-ink/85 sm:text-base">
                  {t.medicalBannerBody}
                </p>
              </div>
            </div>
            <Link
              href={ROUTES.disclaimer}
              className="inline-flex min-h-11 shrink-0 items-center gap-1.5 self-start rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-ink/85"
            >
              <span>{t.readDocument}</span>
              <Icon icon={ArrowForwardIcon} size="xs" className={isRtl ? 'rotate-180' : undefined} />
            </Link>
          </div>
        </div>

        {/* Policy Cards Grid */}
        <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {LEGAL_DOCUMENTS.map((doc) => {
            const DocIcon = LEGAL_ICONS[doc.slug];
            return (
              <Link
                key={doc.slug}
                href={doc.href}
                className="group flex flex-col justify-between rounded-callout border border-ink/10 bg-canvas p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-ink/25 hover:bg-white hover:shadow-popover"
              >
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <span className={cn('rounded-full px-3 py-1 text-xs font-semibold text-ink', TONE_BG[doc.tone])}>
                      {doc.category}
                    </span>
                    <IconTile variant="plain" shape="circle" size={40} className="bg-white text-ink">
                      <Icon icon={DocIcon} size="sm" />
                    </IconTile>
                  </div>

                  <h2 className="mt-5 font-display text-xl font-bold text-ink">
                    {doc.title}
                  </h2>
                  <p className="mt-2 text-pretty text-sm leading-relaxed text-ink/75">
                    {doc.subtitle}
                  </p>
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-ink/10 pt-4 text-xs text-ink/65">
                  <span>
                    {t.lastUpdatedLabel} {doc.lastUpdated}
                  </span>
                  <span className="inline-flex items-center gap-1 font-semibold text-ink transition-transform group-hover:translate-x-0.5">
                    <span>{t.readDocument}</span>
                    <Icon icon={ArrowForwardIcon} size="xs" className={isRtl ? 'rotate-180' : undefined} />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Contact Strip */}
        <div className="mt-14 rounded-callout bg-canvas p-6 sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-xl font-bold text-ink">{t.questionsTitle}</h2>
              <p className="mt-1 max-w-xl text-sm leading-relaxed text-ink/75">{t.questionsBody}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <a
                href={`mailto:${PRIVACY_CONTACT_EMAIL}`}
                className="inline-flex min-h-11 items-center rounded-full border border-ink bg-white px-5 text-sm font-semibold text-ink transition-colors hover:bg-ink/5"
              >
                {t.contactPrivacyCta}
              </a>
              <a
                href={`mailto:${LEGAL_CONTACT_EMAIL}`}
                className="inline-flex min-h-11 items-center rounded-full bg-ink px-5 text-sm font-semibold text-white transition-colors hover:bg-ink/85"
              >
                {t.contactLegalCta}
              </a>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter anchorPrefix="/" />
    </div>
  );
}
