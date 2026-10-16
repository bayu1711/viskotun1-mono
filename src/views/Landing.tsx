'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import HealthAndSafetyOutlinedIcon from '@mui/icons-material/HealthAndSafetyOutlined';
import ScienceOutlinedIcon from '@mui/icons-material/ScienceOutlined';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { COPY } from '../data/copy';
import { ROUTES } from '../data/navigation';
import { Icon } from '../components/ui/Icon';
import { PillButton } from '../components/ui/PillButton';

export function LandingPage() {
  const router = useRouter();
  const { loginAsGuest } = useAuth();
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    router.prefetch(ROUTES.routine);
  }, [router]);

  const handleLaunchGuest = () => {
    setIsNavigating(true);
    loginAsGuest();
    toast.info(COPY.auth.toastGuestEntered);
    router.push(ROUTES.routine);
  };

  return (
    <div className="min-h-screen bg-canvas font-sans text-ink selection:bg-mint selection:text-ink">
      {/* Public Top Navigation */}
      <header className="sticky top-0 z-40 border-b border-ink/10 bg-canvas/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 lg:px-8">
          <Link href={ROUTES.landing} className="flex items-center gap-2.5 font-medium tracking-tight">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-xs font-semibold text-white">
              pe
            </span>
            <span className="text-lg lowercase font-medium">{COPY.brand.name}</span>
          </Link>

          <nav className="hidden items-center gap-6 text-sm lowercase text-ink/70 md:flex">
            <a href="#how-it-works" className="hover:text-ink transition-colors">
              {COPY.landing.nav.howItWorks}
            </a>
            <a href="#gatekeeper" className="hover:text-ink transition-colors">
              {COPY.landing.nav.gatekeeper}
            </a>
            <a href="#features" className="hover:text-ink transition-colors">
              {COPY.landing.nav.features}
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href={ROUTES.login}
              className="text-xs lowercase font-medium text-ink/70 hover:text-ink px-3 py-1.5 transition-colors"
            >
              {COPY.landing.ctaLogin}
            </Link>
            <PillButton size="sm" onClick={handleLaunchGuest} loading={isNavigating}>
              {COPY.landing.ctaGuest}
            </PillButton>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="mx-auto max-w-5xl px-5 pb-16 pt-16 text-center lg:px-8 lg:pt-24">
        <div className="inline-flex items-center gap-2 rounded-full border border-ink/10 bg-white/80 px-3.5 py-1 text-2xs lowercase font-medium text-ink/70 backdrop-blur">
          <span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden="true" />
          {COPY.landing.badge}
        </div>

        <h1 className="mt-6 text-4xl font-normal lowercase tracking-tight text-ink sm:text-5xl lg:text-6xl">
          {COPY.landing.heroTitle}
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed lowercase text-ink/65 sm:text-lg">
          {COPY.landing.heroSubtitle}
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <PillButton size="lg" onClick={handleLaunchGuest} loading={isNavigating} className="gap-2 text-sm">
            <span>{COPY.landing.ctaGuest}</span>
            <Icon icon={ArrowForwardIcon} size="sm" />
          </PillButton>
          <Link href={ROUTES.signup}>
            <PillButton variant="outline" size="lg" className="text-sm">
              {COPY.landing.ctaSignup}
            </PillButton>
          </Link>
        </div>

        {/* Scope Guardrail Callout */}
        <div id="gatekeeper" className="mx-auto mt-12 max-w-2xl rounded-card border border-ink/15 bg-white p-5 text-left shadow-sm">
          <div className="flex items-center gap-2 text-xs font-semibold lowercase tracking-wide text-ink">
            <Icon icon={ShieldOutlinedIcon} size="sm" className="text-success" />
            <span>{COPY.landing.scopeBadge}</span>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-ink/60 lowercase">
            {COPY.landing.scopeNote}
          </p>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="border-t border-ink/10 bg-white/50 py-20">
        <div className="mx-auto max-w-6xl px-5 lg:px-8">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-ink/45">{COPY.landing.architecture}</p>
            <h2 className="mt-2 text-3xl lowercase">{COPY.landing.architectureTitle}</h2>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-card border border-ink/10 bg-white p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cream text-ink">
                <Icon icon={DescriptionOutlinedIcon} size="md" />
              </div>
              <p className="mt-4 text-xs font-mono lowercase text-ink/40">{COPY.landing.steps.step1Number}</p>
              <h3 className="mt-1 text-lg font-medium lowercase">{COPY.landing.steps.step1Title}</h3>
              <p className="mt-2 text-xs leading-relaxed lowercase text-ink/60">
                {COPY.landing.steps.step1Body}
              </p>
            </div>

            <div className="rounded-card border border-ink/10 bg-white p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-mint text-ink">
                <Icon icon={ScienceOutlinedIcon} size="md" />
              </div>
              <p className="mt-4 text-xs font-mono lowercase text-ink/40">{COPY.landing.steps.step2Number}</p>
              <h3 className="mt-1 text-lg font-medium lowercase">{COPY.landing.steps.step2Title}</h3>
              <p className="mt-2 text-xs leading-relaxed lowercase text-ink/60">
                {COPY.landing.steps.step2Body}
              </p>
            </div>

            <div className="rounded-card border border-ink/10 bg-white p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blush text-ink">
                <Icon icon={ShieldOutlinedIcon} size="md" />
              </div>
              <p className="mt-4 text-xs font-mono lowercase text-ink/40">{COPY.landing.steps.step3Number}</p>
              <h3 className="mt-1 text-lg font-medium lowercase">{COPY.landing.steps.step3Title}</h3>
              <p className="mt-2 text-xs leading-relaxed lowercase text-ink/60">
                {COPY.landing.steps.step3Body}
              </p>
            </div>

            <div className="rounded-card border border-ink/10 bg-white p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-ink text-white">
                <Icon icon={HealthAndSafetyOutlinedIcon} size="md" />
              </div>
              <p className="mt-4 text-xs font-mono lowercase text-white/50">{COPY.landing.steps.step4Number}</p>
              <h3 className="mt-1 text-lg font-medium lowercase">{COPY.landing.steps.step4Title}</h3>
              <p className="mt-2 text-xs leading-relaxed lowercase text-white/70">
                {COPY.landing.steps.step4Body}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20">
        <div className="mx-auto max-w-6xl px-5 lg:px-8">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-ink/45">{COPY.landing.capabilities}</p>
            <h2 className="mt-2 text-3xl lowercase">{COPY.landing.capabilitiesTitle}</h2>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="flex gap-4 rounded-card border border-ink/10 bg-white p-6">
              <div className="shrink-0 text-success">
                <Icon icon={CheckCircleOutlineIcon} size="md" />
              </div>
              <div>
                <h3 className="text-base font-medium lowercase">{COPY.landing.features.gatekeeperTitle}</h3>
                <p className="mt-1 text-xs leading-relaxed lowercase text-ink/60">
                  {COPY.landing.features.gatekeeperBody}
                </p>
              </div>
            </div>

            <div className="flex gap-4 rounded-card border border-ink/10 bg-white p-6">
              <div className="shrink-0 text-success">
                <Icon icon={CheckCircleOutlineIcon} size="md" />
              </div>
              <div>
                <h3 className="text-base font-medium lowercase">{COPY.landing.features.auditingTitle}</h3>
                <p className="mt-1 text-xs leading-relaxed lowercase text-ink/60">
                  {COPY.landing.features.auditingBody}
                </p>
              </div>
            </div>

            <div className="flex gap-4 rounded-card border border-ink/10 bg-white p-6">
              <div className="shrink-0 text-success">
                <Icon icon={CheckCircleOutlineIcon} size="md" />
              </div>
              <div>
                <h3 className="text-base font-medium lowercase">{COPY.landing.features.safetyTitle}</h3>
                <p className="mt-1 text-xs leading-relaxed lowercase text-ink/60">
                  {COPY.landing.features.safetyBody}
                </p>
              </div>
            </div>

            <div className="flex gap-4 rounded-card border border-ink/10 bg-white p-6">
              <div className="shrink-0 text-success">
                <Icon icon={CheckCircleOutlineIcon} size="md" />
              </div>
              <div>
                <h3 className="text-base font-medium lowercase">{COPY.landing.features.summaryTitle}</h3>
                <p className="mt-1 text-xs leading-relaxed lowercase text-ink/60">
                  {COPY.landing.features.summaryBody}
                </p>
              </div>
            </div>
          </div>

          {/* Interactive Demo Callout */}
          <div className="mt-16 rounded-card border border-ink bg-ink p-8 text-center text-white sm:p-12">
            <Icon icon={AutoAwesomeOutlinedIcon} size="xl" className="text-mint mx-auto" />
            <h2 className="mt-4 text-3xl font-normal lowercase">{COPY.landing.demoTitle}</h2>
            <p className="mx-auto mt-2 max-w-lg text-sm lowercase text-white/70">
              {COPY.landing.demoSubtitle}
            </p>
            <div className="mt-6 flex justify-center">
              <PillButton variant="inverse" size="lg" onClick={handleLaunchGuest} loading={isNavigating} className="text-sm">
                {COPY.landing.ctaGuest}
              </PillButton>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-ink/10 bg-canvas py-8 text-center text-xs text-ink/45 lowercase">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 sm:flex-row lg:px-8">
          <p>{COPY.landing.footerTagline}</p>
          <div className="flex items-center gap-4">
            <Link href={ROUTES.login} className="hover:text-ink">{COPY.landing.footerSignIn}</Link>
            <Link href={ROUTES.signup} className="hover:text-ink">{COPY.landing.footerCreateAccount}</Link>
            <a
              href="https://github.com/bayu1711/viskotun1-mono"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-ink underline underline-offset-2"
            >
              {COPY.landing.footerGithub}
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
