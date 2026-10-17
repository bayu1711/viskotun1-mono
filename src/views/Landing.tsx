'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import BedtimeOutlinedIcon from '@mui/icons-material/BedtimeOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import FitnessCenterOutlinedIcon from '@mui/icons-material/FitnessCenterOutlined';
import HealthAndSafetyOutlinedIcon from '@mui/icons-material/HealthAndSafetyOutlined';
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
import { PillButton } from '../components/ui/PillButton';
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
    <div className="min-h-screen bg-canvas font-sans text-ink selection:bg-orange/20 selection:text-ink">
      {/* Top Warm Evergreen Notice Banner */}
      <div className="border-b border-ink/10 bg-yellow px-4 py-2 text-center text-xs font-medium text-ink transition-colors">
        <a
          href="#gatekeeper"
          className="inline-flex items-center gap-1.5 underline decoration-ink/30 underline-offset-2 hover:decoration-ink"
        >
          {COPY.landing.topBanner}
        </a>
      </div>

      {/* Public Top Navigation */}
      <header className="sticky top-0 z-40 border-b border-ink/10 bg-canvas/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 lg:px-8">
          <Link href={ROUTES.landing} className="flex items-center transition-opacity hover:opacity-85">
            <Image
              src={COPY.brand.logoUrl}
              alt={COPY.brand.name}
              width={140}
              height={34}
              priority
              className="h-8 w-auto object-contain"
            />
          </Link>

          <nav className="hidden items-center gap-7 text-sm font-medium text-ink/70 md:flex">
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
                  <p className="text-xs font-medium text-ink">{user.name}</p>
                  <p className="text-2xs text-ink/50">
                    {user.isGuest
                      ? COPY.auth.guestBadge
                      : user.role === 'admin'
                        ? COPY.auth.adminBadge
                        : user.email || ''}
                  </p>
                </div>
              </div>
              <PillButton size="sm" onClick={handleLaunch} loading={isNavigating}>
                {COPY.landing.ctaGoToApp}
              </PillButton>
              <button
                type="button"
                onClick={logout}
                className="px-2 py-1 text-xs text-ink/60 transition-colors hover:text-ink focus:outline-none focus-visible:underline"
              >
                {COPY.auth.signOut}
              </button>
            </div>
          ) : !isLoading ? (
            <div className="flex items-center gap-3">
              <Link
                href={ROUTES.login}
                className="px-3 py-1.5 text-xs font-medium text-ink/70 transition-colors hover:text-ink"
              >
                {COPY.landing.ctaLogin}
              </Link>
              <PillButton size="sm" onClick={handleLaunch} loading={isNavigating}>
                {COPY.landing.ctaGuest}
              </PillButton>
            </div>
          ) : (
            <div className="h-9 w-28 animate-pulse rounded-full bg-ink/5" />
          )}
        </div>
      </header>

      {/* Hero Section — Headspace-Style Split Layout */}
      <section className="mx-auto max-w-6xl px-5 pb-16 pt-12 lg:px-8 lg:pb-24 lg:pt-20">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-10">
          {/* Left Column: Headline, Value Proposition, Action Buttons */}
          <div className="text-left lg:col-span-6">
            {user && (
              <div className="mb-5 inline-block">
                <span className="inline-flex items-center gap-2 rounded-full border border-ink/10 bg-mint/70 px-3.5 py-1 text-2xs font-semibold text-ink">
                  <span className="h-1.5 w-1.5 rounded-full bg-ink" aria-hidden="true" />
                  <span>{COPY.landing.loggedInBadge(user.name)}</span>
                </span>
              </div>
            )}

            <h1 className="text-4xl font-normal tracking-tight text-ink sm:text-5xl lg:text-[3.5rem] lg:leading-[1.08]">
              {COPY.landing.heroTitle}
            </h1>

            <p className="mt-6 max-w-xl text-base leading-relaxed text-ink/70 sm:text-lg">
              {COPY.landing.heroSubtitle}
            </p>

            {/* CTAs */}
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <PillButton
                size="lg"
                onClick={handleLaunch}
                loading={isNavigating}
                className="gap-2 text-sm font-semibold shadow-sm"
              >
                <span>{user ? COPY.landing.ctaGoToApp : COPY.landing.heroCtaPrimary}</span>
                <Icon icon={ArrowForwardIcon} size="sm" />
              </PillButton>
              {user ? (
                <Link href={ROUTES.dashboard}>
                  <PillButton variant="outline" size="lg" className="text-sm">
                    {COPY.nav.stats}
                  </PillButton>
                </Link>
              ) : (
                <a href="#domains">
                  <PillButton variant="outline" size="lg" className="text-sm">
                    {COPY.landing.heroCtaSecondary}
                  </PillButton>
                </a>
              )}
            </div>

            {/* Micro-trust indicators */}
            <div className="mt-8 flex flex-wrap items-center gap-y-2 gap-x-5 text-xs text-ink/60">
              {COPY.landing.heroTrustPoints.map((point) => (
                <span key={point} className="flex items-center gap-1.5">
                  <Icon icon={CheckCircleOutlineIcon} size="xs" className="text-orange" />
                  <span>{point}</span>
                </span>
              ))}
            </div>
          </div>

          {/* Right Column: Hero Photo of Many People (Human Community) */}
          <div className="lg:col-span-6">
            <div className="relative rounded-sheet border border-ink/10 bg-white/90 p-3 shadow-float backdrop-blur-md sm:p-4">
              <div className="relative aspect-[3/2] w-full overflow-hidden rounded-[1.25rem] bg-ink/5">
                <Image
                  src="/images/hero-image.jpg"
                  alt={COPY.landing.heroImageAlt}
                  fill
                  priority
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 600px"
                  className="object-cover transition-transform duration-500 hover:scale-[1.02]"
                />

                {/* Top Floating Cohort Badge */}
                <div className="absolute left-3 top-3 sm:left-4 sm:top-4">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-ink/80 px-3 py-1 text-2xs font-semibold text-white shadow-sm backdrop-blur-md">
                    <span className="h-2 w-2 rounded-full bg-mint animate-pulse" aria-hidden="true" />
                    <span>{COPY.landing.heroImageBadge}</span>
                  </span>
                </div>

                {/* Bottom Floating Glass Card */}
                <div className="absolute bottom-3 left-3 right-3 sm:bottom-4 sm:left-4 sm:right-4">
                  <div className="flex items-center justify-between gap-3 rounded-card border border-white/20 bg-ink/80 px-4 py-2.5 text-white shadow-lg backdrop-blur-md">
                    <div className="min-w-0">
                      <p className="text-3xs font-semibold uppercase tracking-wider text-white/70">
                        {COPY.landing.heroImageSubheading}
                      </p>
                      <p className="truncate text-xs font-medium text-white/95">
                        {COPY.landing.heroImageCaption}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-orange px-2.5 py-1 text-3xs font-semibold uppercase tracking-wider text-white">
                      {COPY.landing.heroImageStat}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Headspace-Style Color-Blocked Domains Grid */}
      <section id="domains" className="border-t border-ink/10 bg-white/60 py-20 lg:py-28">
        <div className="mx-auto max-w-6xl px-5 lg:px-8">
          <div className="text-center">
            <span className="rounded-full bg-orange/15 px-3 py-1 text-2xs font-semibold uppercase tracking-wider text-orange">
              {COPY.landing.nav.domains}
            </span>
            <h2 className="mt-3 text-3xl font-normal tracking-tight sm:text-4xl">
              {COPY.landing.domainsTitle}
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-base text-ink/65">
              {COPY.landing.domainsSubtitle}
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {COPY.landing.domains.map((domain) => {
              const DomainIcon = DOMAIN_ICONS[domain.id] || ScienceOutlinedIcon;
              const cardTone = toneStyles[domain.tone];

              return (
                <div
                  key={domain.id}
                  className={cn(
                    'flex flex-col justify-between rounded-card p-6 transition-transform hover:-translate-y-1',
                    cardTone.card
                  )}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="rounded-full bg-white/70 px-2.5 py-0.5 text-3xs font-semibold uppercase tracking-wider text-ink/80 shadow-2xs">
                        {domain.tag}
                      </span>
                      <IconTile variant="inverse" shape="circle" size={32}>
                        <Icon icon={DomainIcon} size="sm" />
                      </IconTile>
                    </div>

                    <h3 className="mt-4 text-xl font-medium leading-snug text-ink">
                      {domain.title}
                    </h3>
                    <p className="mt-2 text-xs leading-relaxed text-ink/75">
                      {domain.description}
                    </p>
                  </div>

                  <div className="mt-6 flex items-center justify-between border-t border-ink/10 pt-4">
                    <span className="text-2xs font-semibold text-ink/60">{domain.stat}</span>
                    <button
                      type="button"
                      onClick={handleLaunch}
                      className="inline-flex items-center gap-1 rounded-full bg-ink px-3 py-1 text-xs font-medium text-white transition-opacity hover:opacity-90"
                    >
                      <span>Explore</span>
                      <Icon icon={ArrowForwardIcon} size="xs" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="border-t border-ink/10 py-20 lg:py-28">
        <div className="mx-auto max-w-6xl px-5 lg:px-8">
          <div className="text-center">
            <span className="rounded-full bg-ink/10 px-3 py-1 text-2xs font-semibold uppercase tracking-wider text-ink/60">
              {COPY.landing.architecture}
            </span>
            <h2 className="mt-3 text-3xl font-normal tracking-tight sm:text-4xl">
              {COPY.landing.architectureTitle}
            </h2>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex flex-col rounded-card border border-ink/10 bg-white p-6 shadow-sm">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-sky text-sm font-bold text-ink">
                {COPY.landing.steps.step1Number}
              </span>
              <h3 className="mt-5 text-lg font-medium">{COPY.landing.steps.step1Title}</h3>
              <p className="mt-2 text-xs leading-relaxed text-ink/65">
                {COPY.landing.steps.step1Body}
              </p>
            </div>

            <div className="flex flex-col rounded-card border border-ink/10 bg-white p-6 shadow-sm">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-orange text-sm font-bold text-ink">
                {COPY.landing.steps.step2Number}
              </span>
              <h3 className="mt-5 text-lg font-medium">{COPY.landing.steps.step2Title}</h3>
              <p className="mt-2 text-xs leading-relaxed text-ink/65">
                {COPY.landing.steps.step2Body}
              </p>
            </div>

            <div className="flex flex-col rounded-card border border-ink/10 bg-white p-6 shadow-sm">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-mint text-sm font-bold text-ink">
                {COPY.landing.steps.step3Number}
              </span>
              <h3 className="mt-5 text-lg font-medium">{COPY.landing.steps.step3Title}</h3>
              <p className="mt-2 text-xs leading-relaxed text-ink/65">
                {COPY.landing.steps.step3Body}
              </p>
            </div>

            <div className="flex flex-col rounded-card border border-ink/10 bg-white p-6 shadow-sm">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-lavender text-sm font-bold text-ink">
                {COPY.landing.steps.step4Number}
              </span>
              <h3 className="mt-5 text-lg font-medium">{COPY.landing.steps.step4Title}</h3>
              <p className="mt-2 text-xs leading-relaxed text-ink/65">
                {COPY.landing.steps.step4Body}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Scientific Rigor & Scope Gatekeeper Callout */}
      <section id="gatekeeper" className="border-t border-ink/10 bg-white/50 py-20 lg:py-24">
        <div className="mx-auto max-w-5xl px-5 lg:px-8">
          <div className="rounded-panel border border-ink/15 bg-white p-7 shadow-sm sm:p-10">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-success/15 px-3 py-1 text-2xs font-semibold uppercase tracking-wider text-success">
                  <Icon icon={ShieldOutlinedIcon} size="xs" />
                  {COPY.landing.scopeBadge}
                </span>
                <h3 className="mt-3 text-2xl font-normal sm:text-3xl">
                  {COPY.landing.rigorTitle}
                </h3>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink/70">
                  {COPY.landing.rigorSubtitle}
                </p>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-4 border-t border-ink/10 pt-6 sm:grid-cols-3">
              {COPY.landing.rigorStats.map((item) => (
                <div key={item.label} className="rounded-card bg-canvas/70 p-4">
                  <p className="text-3xl font-normal text-orange">{item.value}</p>
                  <p className="mt-1 text-xs font-semibold text-ink">{item.label}</p>
                  <p className="mt-0.5 text-2xs text-ink/55">{item.sub}</p>
                </div>
              ))}
            </div>

            <p className="mt-6 text-2xs leading-relaxed text-ink/55">
              {COPY.landing.scopeNote}
            </p>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="border-t border-ink/10 py-20 lg:py-28">
        <div className="mx-auto max-w-6xl px-5 lg:px-8">
          <div className="text-center">
            <span className="rounded-full bg-ink/10 px-3 py-1 text-2xs font-semibold uppercase tracking-wider text-ink/60">
              {COPY.landing.capabilities}
            </span>
            <h2 className="mt-3 text-3xl font-normal tracking-tight sm:text-4xl">
              {COPY.landing.capabilitiesTitle}
            </h2>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="flex gap-4 rounded-card border border-ink/10 bg-white p-6 shadow-2xs">
              <div className="shrink-0 text-orange">
                <Icon icon={CheckCircleOutlineIcon} size="md" />
              </div>
              <div>
                <h3 className="text-base font-medium">{COPY.landing.features.gatekeeperTitle}</h3>
                <p className="mt-1 text-xs leading-relaxed text-ink/60">
                  {COPY.landing.features.gatekeeperBody}
                </p>
              </div>
            </div>

            <div className="flex gap-4 rounded-card border border-ink/10 bg-white p-6 shadow-2xs">
              <div className="shrink-0 text-orange">
                <Icon icon={CheckCircleOutlineIcon} size="md" />
              </div>
              <div>
                <h3 className="text-base font-medium">{COPY.landing.features.auditingTitle}</h3>
                <p className="mt-1 text-xs leading-relaxed text-ink/60">
                  {COPY.landing.features.auditingBody}
                </p>
              </div>
            </div>

            <div className="flex gap-4 rounded-card border border-ink/10 bg-white p-6 shadow-2xs">
              <div className="shrink-0 text-orange">
                <Icon icon={CheckCircleOutlineIcon} size="md" />
              </div>
              <div>
                <h3 className="text-base font-medium">{COPY.landing.features.safetyTitle}</h3>
                <p className="mt-1 text-xs leading-relaxed text-ink/60">
                  {COPY.landing.features.safetyBody}
                </p>
              </div>
            </div>

            <div className="flex gap-4 rounded-card border border-ink/10 bg-white p-6 shadow-2xs">
              <div className="shrink-0 text-orange">
                <Icon icon={CheckCircleOutlineIcon} size="md" />
              </div>
              <div>
                <h3 className="text-base font-medium">{COPY.landing.features.summaryTitle}</h3>
                <p className="mt-1 text-xs leading-relaxed text-ink/60">
                  {COPY.landing.features.summaryBody}
                </p>
              </div>
            </div>
          </div>

          {/* Warm Headspace Sunset Callout */}
          <div className="mt-16 rounded-panel border border-orange/20 bg-gradient-to-br from-orange/15 via-yellow/15 to-peach/20 p-8 text-center sm:p-14">
            <Icon icon={AutoAwesomeOutlinedIcon} size="xl" className="mx-auto text-orange" />
            <h2 className="mt-4 text-3xl font-normal sm:text-4xl">{COPY.landing.demoTitle}</h2>
            <p className="mx-auto mt-2 max-w-lg text-sm text-ink/70">
              {COPY.landing.demoSubtitle}
            </p>
            <div className="mt-8 flex justify-center">
              <PillButton
                variant="primary"
                size="lg"
                onClick={handleLaunch}
                loading={isNavigating}
                className="gap-2 text-sm font-semibold shadow-sm"
              >
                <span>{user ? COPY.landing.ctaGoToApp : COPY.landing.heroCtaPrimary}</span>
                <Icon icon={ArrowForwardIcon} size="sm" />
              </PillButton>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-ink/10 bg-canvas py-10 text-center text-xs text-ink/50">
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
                <Link href={ROUTES.routine} className="transition-colors hover:text-ink">
                  {COPY.landing.ctaGoToApp}
                </Link>
                <button
                  type="button"
                  onClick={logout}
                  className="transition-colors hover:text-ink"
                >
                  {COPY.auth.signOut}
                </button>
              </>
            ) : (
              <>
                <Link href={ROUTES.login} className="transition-colors hover:text-ink">
                  {COPY.landing.footerSignIn}
                </Link>
                <Link href={ROUTES.signup} className="transition-colors hover:text-ink">
                  {COPY.landing.footerCreateAccount}
                </Link>
              </>
            )}
            <a
              href="https://github.com/bayu1711/viskotun1-mono"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 transition-colors hover:text-ink"
            >
              {COPY.landing.footerGithub}
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
