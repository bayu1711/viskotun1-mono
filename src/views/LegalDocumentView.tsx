'use client';

import React from 'react';
import Link from 'next/link';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { LegalHeader } from '@/components/layout/LegalHeader';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { Icon } from '@/components/ui/Icon';
import { useLocale } from '@/contexts/LocaleContext';
import {
  LEGAL_CONTACT_EMAIL,
  LEGAL_DOCUMENTS,
  PRIVACY_CONTACT_EMAIL,
  type LegalDocument,
  type LegalTone
} from '@/data/legal';
import { ROUTES } from '@/data/navigation';
import { cn } from '@/utils/cn';

const TONE_BG: Record<LegalTone, string> = {
  mint: 'bg-mint',
  cream: 'bg-cream',
  blush: 'bg-blush',
  sky: 'bg-sky',
  lavender: 'bg-lavender',
  yellow: 'bg-yellow'
};

interface LegalDocumentViewProps {
  document: LegalDocument;
}

export function LegalDocumentView({ document: doc }: LegalDocumentViewProps) {
  const { copy, isRtl } = useLocale();
  const t = copy.legal;

  const currentIndex = LEGAL_DOCUMENTS.findIndex((item) => item.slug === doc.slug);
  const prevDoc = currentIndex > 0 ? LEGAL_DOCUMENTS[currentIndex - 1] : null;
  const nextDoc =
    currentIndex >= 0 && currentIndex < LEGAL_DOCUMENTS.length - 1
      ? LEGAL_DOCUMENTS[currentIndex + 1]
      : null;

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="min-h-screen bg-white font-sans text-ink selection:bg-orange/20 selection:text-ink">
      <LegalHeader showCenterLink />

      <main className="mx-auto max-w-6xl px-5 py-10 lg:px-8 lg:py-14">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-2 text-xs font-medium text-ink/60">
          <Link href={ROUTES.landing} className="transition-colors hover:text-ink">
            {copy.brand.name}
          </Link>
          <span aria-hidden="true">/</span>
          <Link href={ROUTES.legal} className="transition-colors hover:text-ink">
            {t.legalCenterNav}
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-ink">{doc.shortTitle}</span>
        </nav>

        {/* Mobile Policy Switcher */}
        <div className="mb-8 flex gap-2 overflow-x-auto pb-2 lg:hidden">
          {LEGAL_DOCUMENTS.map((item) => {
            const active = item.slug === doc.slug;
            return (
              <Link
                key={item.slug}
                href={item.href}
                className={cn(
                  'shrink-0 rounded-full px-3.5 py-2 text-xs font-semibold transition-colors',
                  active
                    ? 'bg-ink text-white'
                    : 'bg-canvas text-ink/75 hover:bg-ink/10 hover:text-ink'
                )}
              >
                {item.shortTitle}
              </Link>
            );
          })}
        </div>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-12">
          {/* Desktop Sticky Sidebar */}
          <aside className="hidden lg:col-span-3 lg:block">
            <div className="sticky top-24 space-y-8">
              <div>
                <p className="font-display text-xs font-bold uppercase tracking-wider text-ink/55">
                  {t.allPolicies}
                </p>
                <ul className="mt-3 space-y-1">
                  {LEGAL_DOCUMENTS.map((item) => {
                    const active = item.slug === doc.slug;
                    return (
                      <li key={item.slug}>
                        <Link
                          href={item.href}
                          className={cn(
                            'block rounded-xl px-3 py-2 text-sm transition-colors',
                            active
                              ? 'bg-ink font-semibold text-white'
                              : 'text-ink/75 hover:bg-canvas hover:text-ink'
                          )}
                        >
                          {item.shortTitle}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>

              <div className="border-t border-ink/10 pt-6">
                <p className="font-display text-xs font-bold uppercase tracking-wider text-ink/55">
                  {t.onThisPage}
                </p>
                <ul className="mt-3 space-y-1.5">
                  {doc.sections.map((section) => (
                    <li key={section.id}>
                      <a
                        href={`#${section.id}`}
                        className="block py-1 text-xs leading-snug text-ink/70 transition-colors hover:text-ink"
                      >
                        {section.heading}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </aside>

          {/* Main Document Body */}
          <article className="lg:col-span-9">
            <header className="border-b border-ink/10 pb-8">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className={cn('rounded-full px-3 py-1 text-xs font-semibold text-ink', TONE_BG[doc.tone])}>
                  {doc.category}
                </span>
                <span className="text-xs font-medium text-ink/60">
                  {t.lastUpdatedLabel} {doc.lastUpdated}
                </span>
              </div>

              <h1 className="mt-4 text-balance font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl lg:text-5xl">
                {doc.title}
              </h1>

              <p className="mt-4 max-w-2xl text-pretty text-base leading-relaxed text-ink/75 sm:text-lg">
                {doc.subtitle}
              </p>
            </header>

            {/* At a Glance Callout */}
            <section
              aria-label={doc.summaryTitle}
              className={cn('mt-8 rounded-callout p-6 sm:p-7', TONE_BG[doc.tone])}
            >
              <h2 className="font-display text-lg font-bold text-ink">{doc.summaryTitle}</h2>
              <ul className="mt-3.5 space-y-2.5">
                {doc.summaryPoints.map((point) => (
                  <li key={point} className="flex items-start gap-2.5 text-sm leading-relaxed text-ink/85">
                    <Icon icon={CheckCircleOutlineIcon} size="xs" className="mt-1 shrink-0 text-ink/80" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* Numbered Legal Sections */}
            <div className="mt-10 space-y-10">
              {doc.sections.map((section) => (
                <section key={section.id} id={section.id} className="scroll-mt-24">
                  <h2 className="font-display text-xl font-bold tracking-tight text-ink sm:text-2xl">
                    {section.heading}
                  </h2>

                  <div className="mt-3 space-y-3.5 text-base leading-relaxed text-ink/80">
                    {section.paragraphs.map((paragraph, idx) => (
                      <p key={idx} className="text-pretty">
                        {paragraph}
                      </p>
                    ))}
                  </div>

                  {section.bullets && section.bullets.length > 0 && (
                    <ul className="mt-4 space-y-2.5 rounded-2xl bg-canvas p-5 text-sm leading-relaxed text-ink/85">
                      {section.bullets.map((bullet, idx) => (
                        <li key={idx} className="flex items-start gap-2.5">
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-ink/70" aria-hidden="true" />
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              ))}
            </div>

            {/* Prev / Next Policy Navigation */}
            <nav
              aria-label={t.allPolicies}
              className="mt-14 grid grid-cols-1 gap-4 border-t border-ink/10 pt-8 sm:grid-cols-2"
            >
              {prevDoc ? (
                <Link
                  href={prevDoc.href}
                  className="group flex flex-col rounded-2xl border border-ink/10 bg-canvas p-4 transition-colors hover:border-ink/25 hover:bg-white"
                >
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-ink/60">
                    <Icon icon={ArrowBackIcon} size="xs" className={isRtl ? 'rotate-180' : undefined} />
                    <span>{t.previousPolicy}</span>
                  </span>
                  <span className="mt-1 font-display text-base font-bold text-ink group-hover:underline">
                    {prevDoc.title}
                  </span>
                </Link>
              ) : (
                <div />
              )}

              {nextDoc && (
                <Link
                  href={nextDoc.href}
                  className="group flex flex-col items-end rounded-2xl border border-ink/10 bg-canvas p-4 text-end transition-colors hover:border-ink/25 hover:bg-white"
                >
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-ink/60">
                    <span>{t.nextPolicy}</span>
                    <Icon icon={ArrowForwardIcon} size="xs" className={isRtl ? 'rotate-180' : undefined} />
                  </span>
                  <span className="mt-1 font-display text-base font-bold text-ink group-hover:underline">
                    {nextDoc.title}
                  </span>
                </Link>
              )}
            </nav>

            {/* Contact Strip */}
            <div className="mt-8 rounded-callout bg-canvas p-6">
              <h2 className="font-display text-base font-bold text-ink">{t.questionsTitle}</h2>
              <p className="mt-1 text-sm leading-relaxed text-ink/75">{t.questionsBody}</p>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <a
                  href={`mailto:${PRIVACY_CONTACT_EMAIL}`}
                  className="inline-flex min-h-10 items-center rounded-full border border-ink bg-white px-4 text-xs font-semibold text-ink transition-colors hover:bg-ink/5"
                >
                  {t.contactPrivacyCta}
                </a>
                <a
                  href={`mailto:${LEGAL_CONTACT_EMAIL}`}
                  className="inline-flex min-h-10 items-center rounded-full bg-ink px-4 text-xs font-semibold text-white transition-colors hover:bg-ink/85"
                >
                  {t.contactLegalCta}
                </a>
              </div>
            </div>
          </article>
        </div>
      </main>

      <SiteFooter anchorPrefix="/" />
    </div>
  );
}
