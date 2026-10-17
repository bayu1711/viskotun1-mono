'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import BedtimeOutlinedIcon from '@mui/icons-material/BedtimeOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import FitnessCenterOutlinedIcon from '@mui/icons-material/FitnessCenterOutlined';
import LocalDiningOutlinedIcon from '@mui/icons-material/LocalDiningOutlined';
import PsychologyOutlinedIcon from '@mui/icons-material/PsychologyOutlined';
import ScienceOutlinedIcon from '@mui/icons-material/ScienceOutlined';
import SelfImprovementOutlinedIcon from '@mui/icons-material/SelfImprovementOutlined';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import SpaOutlinedIcon from '@mui/icons-material/SpaOutlined';
import type { SvgIconComponent } from '@mui/icons-material';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { COPY } from '../data/copy';
import { ROUTES } from '../data/navigation';
import { Avatar } from '../components/ui/Avatar';
import { Icon } from '../components/ui/Icon';
import { IconTile } from '../components/ui/IconTile';
import { PillButton, pillClassName } from '../components/ui/PillButton';
import { toneStyles } from '../utils/tones';
import { cn } from '../utils/cn';

const DOMAIN_ICONS: Record<string, SvgIconComponent> = {
  rehab: FitnessCenterOutlinedIcon,
  cognitive: PsychologyOutlinedIcon,
  mindfulness: SelfImprovementOutlinedIcon,
  sleep: BedtimeOutlinedIcon,
  cellular: SpaOutlinedIcon,
  nutrition: LocalDiningOutlinedIcon
};

const HOW_IT_WORKS_STEPS = [
  { number: COPY.landing.steps.step1Number, title: COPY.landing.steps.step1Title, body: COPY.landing.steps.step1Body },
  { number: COPY.landing.steps.step2Number, title: COPY.landing.steps.step2Title, body: COPY.landing.steps.step2Body },
  { number: COPY.landing.steps.step3Number, title: COPY.landing.steps.step3Title, body: COPY.landing.steps.step3Body },
  { number: COPY.landing.steps.step4Number, title: COPY.landing.steps.step4Title, body: COPY.landing.steps.step4Body }
];

const FEATURES = [
  { title: COPY.landing.features.gatekeeperTitle, body: COPY.landing.features.gatekeeperBody },
  { title: COPY.landing.features.auditingTitle, body: COPY.landing.features.auditingBody },
  { title: COPY.landing.features.safetyTitle, body: COPY.landing.features.safetyBody },
  { title: COPY.landing.features.summaryTitle, body: COPY.landing.features.summaryBody }
];

export function LandingPage() {
  const router = useRouter();
  const { user, isLoading, loginAsGuest, logout } = useAuth();
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    router.prefetch(ROUTES.routine);
  }, [router]);

  const handleLaunch = () => {
    setIsNavigating(true);
    if (!user) {
      loginAsGuest();
      toast.info(COPY.auth.toastGuestEntered);
    }
    router.push(ROUTES.routine);
  };

  return (
    <div className="min-h-screen bg-white font-sans text-ink selection:bg-orange/20 selection:text-ink">
      {/* Top Notice Banner */}
      <div className="bg-yellow px-4 text-center text-sm font-medium text-ink">
        <a
          href="#gatekeeper"
          className="inline-flex min-h-11 items-center gap-1.5 py-2 underline decoration-ink/30 underline-offset-2 hover:decoration-ink"
        >
          {COPY.landing.topBanner}
        </a>
      </div>

      {/* Public Top Navigation */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 lg:px-8">
          <Link href={ROUTES.landing} className="flex min-h-11 items-center transition-opacity hover:opacity-85">
            <Image
              src={COPY.brand.logoUrl}
              alt={COPY.brand.name}
              width={140}
              height={34}
              priority
              className="h-8 w-auto object-contain"
            />
          </Link>

          <nav className="hidden items-center gap-7 whitespace-nowrap text-sm font-medium text-ink/80 xl:flex">
            <a href="#domains" className="transition-colors hover:text-ink">
              {COPY.landing.nav.domains}
            </a>
            <a href="#how-it-works" className="transition-colors hover:text-ink">
              {COPY.landing.nav.howItWorks}
            </a>
            <a href="#gatekeeper" className="transition-colors hover:text-ink">
              {COPY.landing.nav.gatekeeper}
            </a>
            <a href="#features" className="transition-colors hover:text-ink">
              {COPY.landing.nav.features}
            </a>
          </nav>

          {!isLoading && user ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Avatar initials={user.initials} />
                <div className="hidden text-left leading-tight sm:block">
                  <p className="text-sm font-medium text-ink">{user.name}</p>
                  <p className="text-xs text-ink/70">
                    {user.isGuest
                      ? COPY.auth.guestBadge
                      : user.role === 'admin'
                        ? COPY.auth.adminBadge
                        : user.email || ''}
                  </p>
                </div>
              </div>
              <PillButton
                variant="ink"
                size="sm"
                onClick={handleLaunch}
                loading={isNavigating}
                className="hidden min-h-11 whitespace-nowrap font-semibold sm:inline-flex"
              >
                {COPY.landing.ctaGoToApp}
              </PillButton>
              <button
                type="button"
                onClick={logout}
                className="inline-flex min-h-11 items-center whitespace-nowrap px-3 text-sm text-ink/75 transition-colors hover:text-ink focus:outline-none focus-visible:underline"
              >
                {COPY.auth.signOut}
              </button>
            </div>
          ) : !isLoading ? (
            <div className="flex items-center gap-3">
              <Link
                href={ROUTES.login}
                className="inline-flex min-h-11 items-center whitespace-nowrap px-3 text-sm font-medium text-ink/80 transition-colors hover:text-ink"
              >
                {COPY.landing.ctaLogin}
              </Link>
              <PillButton
                variant="ink"
                size="sm"
                onClick={handleLaunch}
                loading={isNavigating}
                className="min-h-11 whitespace-nowrap font-semibold"
              >
                {COPY.landing.ctaGuest}
              </PillButton>
            </div>
          ) : (
            <div className="h-9 w-28 animate-pulse rounded-full bg-ink/5" />
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="mx-auto max-w-6xl px-5 pb-16 pt-12 lg:px-8 lg:pb-24 lg:pt-20">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-10">
          <div className="text-left lg:col-span-6">
            {user && (
              <p className="mb-5 inline-flex items-center gap-2 rounded-full bg-mint px-3.5 py-1 text-sm font-medium text-ink">
                <span className="h-1.5 w-1.5 rounded-full bg-ink" aria-hidden="true" />
                <span>{COPY.landing.loggedInBadge(user.name)}</span>
              </p>
            )}

            <h1 className="text-balance text-4xl font-bold tracking-tight text-ink sm:text-5xl lg:text-hero-lg lg:leading-[1.08]">
              {COPY.landing.heroTitle}
            </h1>

            <p className="mt-6 max-w-xl text-pretty text-lg leading-relaxed text-ink/80">
              {COPY.landing.heroSubtitle}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <PillButton
                size="lg"
                onClick={handleLaunch}
                loading={isNavigating}
                className="min-h-12 gap-2 px-6 font-semibold"
              >
                <span>{user ? COPY.landing.ctaGoToApp : COPY.landing.heroCtaPrimary}</span>
                <Icon icon={ArrowForwardIcon} size="sm" />
              </PillButton>
              {user ? (
                <Link href={ROUTES.dashboard} className={pillClassName('outline', 'lg', 'min-h-12 px-6 font-semibold')}>
                  {COPY.nav.stats}
                </Link>
              ) : (
                <a href="#domains" className={pillClassName('outline', 'lg', 'min-h-12 px-6 font-semibold')}>
                  {COPY.landing.heroCtaSecondary}
                </a>
              )}
            </div>

            <ul className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-ink/75">
              {COPY.landing.heroTrustPoints.map((point) => (
                <li key={point} className="flex items-center gap-1.5">
                  <Icon icon={CheckCircleOutlineIcon} size="xs" className="text-ink" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-6">
            <div className="relative aspect-[3/2] w-full overflow-hidden rounded-callout bg-canvas">
              <Image
                src="/images/hero-image.jpg"
                alt={COPY.landing.heroImageAlt}
                fill
                priority
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 650px"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Domains: the one color-blocked grid on the page */}
      <section id="domains" className="py-20 lg:py-28">
        <div className="mx-auto max-w-6xl px-5 lg:px-8">
          <div className="max-w-2xl">
            <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
              {COPY.landing.domainsTitle}
            </h2>
            <p className="mt-3 text-pretty text-lg text-ink/80">{COPY.landing.domainsSubtitle}</p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {COPY.landing.domains.map((domain) => {
              const DomainIcon = DOMAIN_ICONS[domain.id] || ScienceOutlinedIcon;
              const cardTone = toneStyles[domain.tone];

              return (
                <div key={domain.id} className={cn('flex flex-col justify-between rounded-callout p-6', cardTone.card)}>
                  <div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-semibold text-ink/80">{domain.tag}</span>
                      <IconTile variant="inverse" shape="circle" size={32}>
                        <Icon icon={DomainIcon} size="sm" />
                      </IconTile>
                    </div>

                    <h3 className="mt-4 text-balance text-xl font-bold leading-snug text-ink">{domain.title}</h3>
                    <p className="mt-2 text-base leading-relaxed text-ink/85">{domain.description}</p>
                  </div>

                  <p className="mt-6 border-t border-ink/15 pt-4 text-sm font-semibold text-ink/80">{domain.stat}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works: a real four-step sequence, so it is an ordered list */}
      <section id="how-it-works" className="py-20 lg:py-28">
        <div className="mx-auto max-w-6xl px-5 lg:px-8">
          <h2 className="max-w-2xl text-balance text-3xl font-bold tracking-tight sm:text-4xl">
            {COPY.landing.architectureTitle}
          </h2>

          <ol className="mt-12 grid grid-cols-1 gap-x-12 gap-y-10 md:grid-cols-2">
            {HOW_IT_WORKS_STEPS.map((step) => (
              <li key={step.number} className="flex gap-5">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ink text-base font-bold text-white">
                  {step.number}
                </span>
                <div>
                  <h3 className="text-xl font-bold text-ink">{step.title}</h3>
                  <p className="mt-2 max-w-prose text-base leading-relaxed text-ink/80">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Scientific Rigor & Scope Gatekeeper */}
      <section id="gatekeeper" className="py-12 lg:py-16">
        <div className="mx-auto max-w-6xl px-5 lg:px-8">
          <div className="rounded-callout bg-canvas p-8 sm:p-12">
            <p className="flex items-center gap-2 text-sm font-semibold text-ink">
              <Icon icon={ShieldOutlinedIcon} size="sm" />
              <span>{COPY.landing.scopeBadge}</span>
            </p>
            <h2 className="mt-4 max-w-2xl text-balance text-3xl font-bold tracking-tight sm:text-4xl">
              {COPY.landing.rigorTitle}
            </h2>
            <p className="mt-4 max-w-2xl text-pretty text-lg leading-relaxed text-ink/80">
              {COPY.landing.rigorSubtitle}
            </p>
            <p className="mt-4 max-w-2xl text-pretty text-base leading-relaxed text-ink/75">
              {COPY.landing.scopeNote}
            </p>
          </div>
        </div>
      </section>

      {/* Features: plain two-column list, no card chrome */}
      <section id="features" className="py-20 lg:py-28">
        <div className="mx-auto max-w-6xl px-5 lg:px-8">
          <h2 className="max-w-2xl text-balance text-3xl font-bold tracking-tight sm:text-4xl">
            {COPY.landing.capabilitiesTitle}
          </h2>

          <ul className="mt-12 grid grid-cols-1 gap-x-12 gap-y-8 md:grid-cols-2">
            {FEATURES.map((feature) => (
              <li key={feature.title} className="flex gap-4">
                <Icon icon={CheckCircleOutlineIcon} size="md" className="mt-0.5 shrink-0 text-ink" />
                <div>
                  <h3 className="text-lg font-bold text-ink">{feature.title}</h3>
                  <p className="mt-1 max-w-prose text-base leading-relaxed text-ink/80">{feature.body}</p>
                </div>
              </li>
            ))}
          </ul>

          {/* Closing call to action: flat panel, one button */}
          <div className="mt-20 rounded-callout bg-yellow px-6 py-12 text-center sm:px-14 sm:py-16">
            <h2 className="mx-auto max-w-2xl text-balance text-3xl font-bold tracking-tight sm:text-4xl">
              {COPY.landing.demoTitle}
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-pretty text-lg text-ink/85">{COPY.landing.demoSubtitle}</p>
            <div className="mt-8 flex justify-center">
              <PillButton
                variant="ink"
                size="lg"
                onClick={handleLaunch}
                loading={isNavigating}
                className="min-h-12 gap-2 px-6 font-semibold"
              >
                <span>{user ? COPY.landing.ctaGoToApp : COPY.landing.heroCtaPrimary}</span>
                <Icon icon={ArrowForwardIcon} size="sm" />
              </PillButton>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-canvas py-10 text-center text-sm text-ink/75">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 sm:flex-row lg:px-8">
          <div className="flex items-center gap-2">
            <Image
              src={COPY.brand.iconUrl}
              alt=""
              width={20}
              height={20}
              className="h-5 w-5 object-contain"
            />
            <p>{COPY.landing.footerTagline}</p>
          </div>
          <div className="flex items-center gap-5">
            {user ? (
              <>
                <Link href={ROUTES.routine} className="inline-flex min-h-11 items-center transition-colors hover:text-ink">
                  {COPY.landing.ctaGoToApp}
                </Link>
                <button
                  type="button"
                  onClick={logout}
                  className="inline-flex min-h-11 items-center transition-colors hover:text-ink"
                >
                  {COPY.auth.signOut}
                </button>
              </>
            ) : (
              <>
                <Link href={ROUTES.login} className="inline-flex min-h-11 items-center transition-colors hover:text-ink">
                  {COPY.landing.footerSignIn}
                </Link>
                <Link href={ROUTES.signup} className="inline-flex min-h-11 items-center transition-colors hover:text-ink">
                  {COPY.landing.footerCreateAccount}
                </Link>
              </>
            )}
            <a
              href="https://github.com/bayu1711/viskotun1-mono"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center underline underline-offset-2 transition-colors hover:text-ink"
            >
              {COPY.landing.footerGithub}
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
