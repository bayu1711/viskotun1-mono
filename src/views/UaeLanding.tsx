'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import LocalHospitalOutlinedIcon from '@mui/icons-material/LocalHospitalOutlined';
import SmokeFreeOutlinedIcon from '@mui/icons-material/SmokeFreeOutlined';
import WbSunnyOutlinedIcon from '@mui/icons-material/WbSunnyOutlined';
import { useLocale } from '../contexts/LocaleContext';
import { ROUTES } from '../data/navigation';
import { LandingShowcase, type LandingShowcaseContent } from './Landing';

export function UaeLandingView() {
  const { locale, toggleLocale, copy, isRtl } = useLocale();
  const t = copy.uaeLanding;

  const content = useMemo<LandingShowcaseContent>(
    () => ({
      heroBadge: `🇦🇪 ${t.challengeSubbadge}`,
      heroTitle: t.heroTitle,
      heroSubtitle: t.heroSubtitle,
      heroCtaPrimary: t.ctaStartTrial,
      heroCtaSecondary: t.ctaExploreRoutines,
      heroTrustPoints: t.heroTrustPoints,
      heroImageAlt: copy.landing.heroImageAlt,
      headerCtaGuest: t.ctaStartTrial,
      ctaGoToApp: copy.landing.ctaGoToApp,
      ctaLogin: copy.landing.ctaLogin,
      ctaSignOut: copy.auth.signOut,
      ctaStats: copy.nav.stats,
      loggedInBadge: copy.landing.loggedInBadge,
      nav: copy.landing.nav,
      interactivePreview: t.interactivePreview,
      domainsTitle: t.domainsTitle,
      domainsSubtitle: t.domainsSubtitle,
      domains: t.domains,
      architectureTitle: t.architectureTitle,
      steps: [
        { number: t.steps.step1Number, title: t.steps.step1Title, body: t.steps.step1Body },
        { number: t.steps.step2Number, title: t.steps.step2Title, body: t.steps.step2Body },
        { number: t.steps.step3Number, title: t.steps.step3Title, body: t.steps.step3Body },
        { number: t.steps.step4Number, title: t.steps.step4Title, body: t.steps.step4Body }
      ],
      scopeBadge: t.scopeBadge,
      rigorTitle: t.rigorTitle,
      rigorSubtitle: t.rigorSubtitle,
      scopeNote: t.scopeNote,
      capabilitiesTitle: t.capabilitiesTitle,
      features: [
        { icon: WbSunnyOutlinedIcon, title: t.features.gatekeeperTitle, body: t.features.gatekeeperBody },
        { icon: LocalHospitalOutlinedIcon, title: t.features.auditingTitle, body: t.features.auditingBody },
        { icon: SmokeFreeOutlinedIcon, title: t.features.safetyTitle, body: t.features.safetyBody },
        { icon: DescriptionOutlinedIcon, title: t.features.summaryTitle, body: t.features.summaryBody }
      ],
      demoTitle: t.ctaBannerTitle,
      demoSubtitle: t.ctaBannerSubtitle,
      demoCtaPrimary: t.ctaBannerButton,
      footerTagline: t.footerTagline,
      footerSignIn: copy.landing.footerSignIn,
      footerCreateAccount: copy.landing.footerCreateAccount,
      footerGithub: copy.landing.footerGithub
    }),
    [copy, t]
  );

  return (
    <LandingShowcase
      dir={isRtl ? 'rtl' : 'ltr'}
      content={content}
      headerLogoHref={ROUTES.uae}
      editionBadge="🇦🇪 UAE"
      topBanner={
        <div className="bg-yellow text-ink">
          <div className="mx-auto flex min-h-11 max-w-6xl items-center justify-between gap-3 px-5 py-2 text-xs font-medium sm:text-sm lg:px-8">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-ink px-2 py-0.5 text-2xs font-bold text-white">
                Abu Dhabi 2026
              </span>
              <span className="hidden sm:inline">{t.challengeBadge}</span>
              <span className="sm:hidden">Future Health Challenge · Abu Dhabi</span>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href={ROUTES.landing}
                className="text-xs text-ink/80 underline-offset-4 transition-colors hover:text-ink hover:underline"
              >
                {t.backToGlobal}
              </Link>

              <button
                type="button"
                onClick={toggleLocale}
                className="inline-flex items-center gap-1 rounded-full border border-ink/20 bg-white/70 px-2.5 py-0.5 text-xs font-semibold text-ink transition-colors hover:bg-white cursor-pointer"
                aria-label={locale === 'en' ? 'التحويل إلى اللغة العربية' : 'Switch to English'}
              >
                <span className={locale === 'en' ? 'font-bold text-ink' : 'text-ink/60 font-normal'}>
                  EN
                </span>
                <span className="text-ink/30" aria-hidden="true">
                  |
                </span>
                <span className={locale === 'ar' ? 'font-bold text-ink' : 'text-ink/60 font-normal'}>
                  العربية
                </span>
              </button>
            </div>
          </div>
        </div>
      }
      footerExtraLink={
        <Link
          href={ROUTES.landing}
          className="inline-flex min-h-11 items-center font-medium text-ink transition-colors hover:underline"
        >
          {t.backToGlobal}
        </Link>
      }
    />
  );
}
