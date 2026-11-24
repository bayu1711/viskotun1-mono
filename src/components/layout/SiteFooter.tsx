'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import HealthAndSafetyOutlinedIcon from '@mui/icons-material/HealthAndSafetyOutlined';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import { useAuth } from '@/contexts/AuthContext';
import { useLocale } from '@/contexts/LocaleContext';
import { LEGAL_CONTACT_EMAIL } from '@/data/legal';
import { ROUTES } from '@/data/navigation';
import { Icon } from '@/components/ui/Icon';

export interface SiteFooterProps {
  /** Optional custom tagline (e.g. UAE edition tagline). */
  tagline?: string;
  /** Optional contextual link in the Explore column (e.g. Abu Dhabi Edition or Global Edition). */
  extraProductLink?: React.ReactNode;
  /** Prefix for in-page section anchors. Pass "" on landing pages, "/" on other pages. */
  anchorPrefix?: '' | '/';
  /** Optional callback for "Try as guest" / "Go to your routine" launch button. */
  onLaunch?: () => void;
  /** Optional custom labels overriding defaults (used by UAE landing). */
  navLabels?: {
    domains: string;
    howItWorks: string;
    gatekeeper: string;
    features: string;
  };
  signInLabel?: string;
  createAccountLabel?: string;
  goToAppLabel?: string;
  signOutLabel?: string;
}

const FOOTER_LINK_CLASS =
  'inline-flex items-center gap-1.5 py-1 text-sm text-ink/75 transition-colors hover:text-ink focus:outline-none focus-visible:underline';

export function SiteFooter({
  tagline,
  extraProductLink,
  anchorPrefix = '/',
  onLaunch,
  navLabels,
  signInLabel,
  createAccountLabel,
  goToAppLabel,
  signOutLabel
}: SiteFooterProps) {
  const { copy } = useLocale();
  const { user, logout } = useAuth();

  const f = copy.footer;
  const exploreLabels = navLabels ?? {
    domains: f.links.domains,
    howItWorks: f.links.howItWorks,
    gatekeeper: f.links.gatekeeper,
    features: f.links.features
  };

  return (
    <footer className="border-t border-ink/10 bg-canvas text-ink">
      <div className="mx-auto max-w-6xl px-5 pb-10 pt-14 lg:px-8 lg:pt-16">
        {/* Main Multi-Column Grid */}
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-12 lg:gap-8">
          {/* Column 1: Brand & Clinical Scope */}
          <div className="lg:col-span-4">
            <Link
              href={ROUTES.landing}
              className="inline-flex items-center gap-2.5 transition-opacity hover:opacity-85"
            >
              <Image
                src={copy.brand.logoUrl}
                alt={copy.brand.name}
                width={136}
                height={33}
                className="h-8 w-auto object-contain"
              />
            </Link>

            <p className="mt-4 max-w-sm text-pretty text-sm leading-relaxed text-ink/75">
              {tagline || f.brandDescription}
            </p>

            <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-mint px-3 py-1 text-xs font-semibold text-ink">
              <Icon icon={ShieldOutlinedIcon} size="xs" />
              <span>{f.scopePill}</span>
            </div>

            {/* Compact Clinical Disclaimer Box */}
            <div className="mt-5 max-w-sm rounded-2xl border border-ink/10 bg-white/80 p-3.5 text-xs leading-relaxed text-ink/75">
              <div className="flex items-start gap-2">
                <Icon icon={HealthAndSafetyOutlinedIcon} size="xs" className="mt-0.5 shrink-0 text-ink/70" />
                <p>
                  {f.medicalNoticePrefix}{' '}
                  <Link
                    href={ROUTES.disclaimer}
                    className="font-semibold text-ink underline underline-offset-2 transition-colors hover:text-ink/80"
                  >
                    {f.medicalNoticeLink}
                  </Link>
                </p>
              </div>
            </div>
          </div>

          {/* Column 2: Explore / Product */}
          <div className="lg:col-span-2">
            <h2 className="font-display text-xs font-bold uppercase tracking-wider text-ink/60">
              {f.columns.product}
            </h2>
            <ul className="mt-3.5 space-y-2">
              <li>
                <Link href={ROUTES.about} className={FOOTER_LINK_CLASS}>
                  {f.links.about}
                </Link>
              </li>
              <li>
                <a href={`${anchorPrefix}#domains`} className={FOOTER_LINK_CLASS}>
                  {exploreLabels.domains}
                </a>
              </li>
              <li>
                <a href={`${anchorPrefix}#how-it-works`} className={FOOTER_LINK_CLASS}>
                  {exploreLabels.howItWorks}
                </a>
              </li>
              <li>
                <a href={`${anchorPrefix}#gatekeeper`} className={FOOTER_LINK_CLASS}>
                  {exploreLabels.gatekeeper}
                </a>
              </li>
              <li>
                <a href={`${anchorPrefix}#features`} className={FOOTER_LINK_CLASS}>
                  {exploreLabels.features}
                </a>
              </li>
              {extraProductLink ? (
                <li className="pt-1">{extraProductLink}</li>
              ) : (
                <li className="pt-1">
                  <Link href={ROUTES.uae} className="inline-flex items-center py-1 text-sm font-semibold text-ink transition-colors hover:underline">
                    {copy.landing.uaeEditionLink}
                  </Link>
                </li>
              )}
            </ul>
          </div>

          {/* Column 3: Account & Resources */}
          <div className="lg:col-span-3">
            <h2 className="font-display text-xs font-bold uppercase tracking-wider text-ink/60">
              {f.columns.account}
            </h2>
            <ul className="mt-3.5 space-y-2">
              {user ? (
                <>
                  <li>
                    <Link href={ROUTES.routine} className={FOOTER_LINK_CLASS}>
                      {goToAppLabel || copy.landing.ctaGoToApp}
                    </Link>
                  </li>
                  <li>
                    <Link href={ROUTES.dashboard} className={FOOTER_LINK_CLASS}>
                      {f.links.dashboard}
                    </Link>
                  </li>
                  <li>
                    <Link href={ROUTES.community} className={FOOTER_LINK_CLASS}>
                      {f.links.community}
                    </Link>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={logout}
                      className={FOOTER_LINK_CLASS}
                    >
                      {signOutLabel || copy.auth.signOut}
                    </button>
                  </li>
                </>
              ) : (
                <>
                  <li>
                    <Link href={ROUTES.login} className={FOOTER_LINK_CLASS}>
                      {signInLabel || copy.landing.footerSignIn}
                    </Link>
                  </li>
                  <li>
                    <Link href={ROUTES.signup} className={FOOTER_LINK_CLASS}>
                      {createAccountLabel || copy.landing.footerCreateAccount}
                    </Link>
                  </li>
                  <li>
                    {onLaunch ? (
                      <button
                        type="button"
                        onClick={onLaunch}
                        className={FOOTER_LINK_CLASS}
                      >
                        {f.links.tryGuest}
                      </button>
                    ) : (
                      <Link href={ROUTES.routine} className={FOOTER_LINK_CLASS}>
                        {f.links.tryGuest}
                      </Link>
                    )}
                  </li>
                </>
              )}
              <li className="pt-2">
                <a
                  href="https://github.com/bayu1711/viskotun1-mono"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={FOOTER_LINK_CLASS}
                >
                  <span>{f.links.github}</span>
                  <Icon icon={OpenInNewIcon} size="xs" className="opacity-60" />
                </a>
              </li>
              <li>
                <a href={`mailto:${LEGAL_CONTACT_EMAIL}`} className={FOOTER_LINK_CLASS}>
                  {f.links.contactLegal}
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4: Legal & Trust */}
          <div className="lg:col-span-3">
            <h2 className="font-display text-xs font-bold uppercase tracking-wider text-ink/60">
              {f.columns.legal}
            </h2>
            <ul className="mt-3.5 space-y-2">
              <li>
                <Link href={ROUTES.legal} className="inline-flex items-center py-1 text-sm font-semibold text-ink transition-colors hover:underline">
                  {f.links.legalCenter}
                </Link>
              </li>
              <li>
                <Link href={ROUTES.privacy} className={FOOTER_LINK_CLASS}>
                  {f.links.privacy}
                </Link>
              </li>
              <li>
                <Link href={ROUTES.terms} className={FOOTER_LINK_CLASS}>
                  {f.links.terms}
                </Link>
              </li>
              <li>
                <Link href={ROUTES.termsOfUse} className={FOOTER_LINK_CLASS}>
                  {f.links.termsOfUse}
                </Link>
              </li>
              <li>
                <Link href={ROUTES.disclaimer} className={FOOTER_LINK_CLASS}>
                  {f.links.disclaimer}
                </Link>
              </li>
              <li>
                <Link href={ROUTES.cookies} className={FOOTER_LINK_CLASS}>
                  {f.links.cookies}
                </Link>
              </li>
              <li>
                <Link href={ROUTES.aiTransparency} className={FOOTER_LINK_CLASS}>
                  {f.links.aiTransparency}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Legal & Copyright Bar */}
        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-ink/10 pt-6 text-xs text-ink/65 sm:flex-row sm:items-center">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <p className="font-medium text-ink/75">{f.copyright}</p>
            <span aria-hidden="true" className="hidden sm:inline">·</span>
            <p>{f.builtForScience}</p>
          </div>

          <nav aria-label={f.columns.legal} className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <Link href={ROUTES.privacy} className="transition-colors hover:text-ink hover:underline">
              {f.links.privacy}
            </Link>
            <Link href={ROUTES.terms} className="transition-colors hover:text-ink hover:underline">
              {f.links.terms}
            </Link>
            <Link href={ROUTES.termsOfUse} className="transition-colors hover:text-ink hover:underline">
              {f.links.termsOfUse}
            </Link>
            <Link href={ROUTES.disclaimer} className="transition-colors hover:text-ink hover:underline">
              {f.links.disclaimer}
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
