'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import BedtimeOutlinedIcon from '@mui/icons-material/BedtimeOutlined';
import CheckIcon from '@mui/icons-material/Check';
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
  { icon: ShieldOutlinedIcon, title: COPY.landing.features.gatekeeperTitle, body: COPY.landing.features.gatekeeperBody },
  { icon: ScienceOutlinedIcon, title: COPY.landing.features.auditingTitle, body: COPY.landing.features.auditingBody },
  { icon: HealthAndSafetyOutlinedIcon, title: COPY.landing.features.safetyTitle, body: COPY.landing.features.safetyBody },
  { icon: DescriptionOutlinedIcon, title: COPY.landing.features.summaryTitle, body: COPY.landing.features.summaryBody }
];

const PREVIEW = COPY.landing.interactivePreview;
const PREVIEW_STEPS = [
  { action: PREVIEW.step1Action, detail: PREVIEW.step1Detail, meta: PREVIEW.step1Meta, done: true },
  { action: PREVIEW.step2Action, detail: PREVIEW.step2Detail, meta: PREVIEW.step2Meta, done: false }
];

/** Hero demo of a day in the app: tap a step to check it off and watch progress update. */
function RoutinePreview() {
  const [doneSteps, setDoneSteps] = useState(() => PREVIEW_STEPS.map((step) => step.done));
  const doneCount = doneSteps.filter(Boolean).length;
  const percent = Math.round((doneCount / PREVIEW_STEPS.length) * 100);
  const allDone = doneCount === PREVIEW_STEPS.length;

  const toggleStep = (index: number) =>
    setDoneSteps((prev) => prev.map((done, i) => (i === index ? !done : done)));

  return (
    <section
      aria-label={PREVIEW.title}
      className="relative mx-4 -mt-10 animate-rise rounded-callout bg-white p-5 shadow-popover sm:ml-auto sm:mr-6 sm:w-[22rem]"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="font-display text-base font-bold text-ink">{PREVIEW.title}</p>
        <span className="shrink-0 rounded-full bg-mint px-2.5 py-0.5 text-xs font-semibold text-ink">{PREVIEW.tag}</span>
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-ink/70">
        <span>{PREVIEW.progressLabel}</span>
        <span className="font-semibold tabular-nums text-ink">
          {percent}
          {COPY.common.percentSign}
        </span>
      </div>
      {/* Outer layer plays the first-load fill; inner layer follows the user's taps */}
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-ink/10">
        <div className="h-full origin-left animate-fill">
          <div
            className="h-full origin-left rounded-full bg-orange transition-transform duration-500 ease-out-strong"
            style={{ transform: `scaleX(${percent / 100})` }}
          />
        </div>
      </div>

      <ul className="mt-3 space-y-1">
        {PREVIEW_STEPS.map((step, index) => {
          const done = doneSteps[index];
          return (
            <li key={step.action}>
              <button
                type="button"
                aria-pressed={done}
                onClick={() => toggleStep(index)}
                className="group -mx-2 flex min-h-11 w-[calc(100%+1rem)] items-start gap-3 rounded-2xl px-2 py-2 text-left transition-colors duration-150 hover:bg-ink/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/30"
              >
                <span
                  className={cn(
                    'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-[background-color,border-color,transform] duration-200 ease-out-strong group-active:scale-90',
                    done ? 'border-ink bg-ink text-white' : 'border-ink/30 group-hover:border-ink/60'
                  )}
                >
                  <Icon
                    icon={CheckIcon}
                    size="xs"
                    className={cn(
                      'transition-[opacity,transform] duration-200 ease-out-strong',
                      done ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
                    )}
                  />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-3">
                    <span
                      className={cn(
                        'text-sm font-semibold leading-snug transition-colors duration-200',
                        done ? 'text-ink/60' : 'text-ink'
                      )}
                    >
                      {step.action}
                    </span>
                    <span className="shrink-0 text-xs font-medium tabular-nums text-ink/70">{step.meta}</span>
                  </span>
                  <span className="mt-0.5 block text-xs leading-snug text-ink/65">{step.detail}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <p aria-live="polite" className="mt-2 text-xs font-medium text-ink/70">
        {allDone ? PREVIEW.allDone : PREVIEW.tryHint}
      </p>
    </section>
  );
}

export function LandingPage() {
  const router = useRouter();
  const { user, isLoading, loginAsGuest, logout } = useAuth();
  const [isNavigating, setIsNavigating] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    router.prefetch(ROUTES.routine);
  }, [router]);

  // The sticky header gets a hairline only once content scrolls under it
  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

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
      <div className="bg-yellow text-ink">
        <a
          href="#gatekeeper"
          className="group mx-auto block min-h-11 max-w-6xl text-pretty px-5 py-3 text-center text-sm font-medium"
        >
          <span className="underline-offset-4 group-hover:underline">{COPY.landing.topBanner}</span>
          <Icon
            icon={ArrowForwardIcon}
            size="xs"
            className="ml-1.5 inline-block align-[-0.2em] transition-transform duration-200 ease-out-strong group-hover:translate-x-0.5"
          />
        </a>
      </div>

      {/* Public Top Navigation */}
      <header
        className={cn(
          'sticky top-0 z-40 border-b bg-white/90 backdrop-blur-md transition-colors',
          isScrolled ? 'border-ink/10' : 'border-transparent'
        )}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3 lg:px-8">
          <div className="flex items-center gap-8">
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

            <nav className="hidden items-center gap-1 whitespace-nowrap text-sm font-medium text-ink/80 xl:flex">
              <a href="#domains" className="rounded-full px-3 py-2.5 transition-colors hover:bg-ink/5 hover:text-ink">
                {COPY.landing.nav.domains}
              </a>
              <a href="#how-it-works" className="rounded-full px-3 py-2.5 transition-colors hover:bg-ink/5 hover:text-ink">
                {COPY.landing.nav.howItWorks}
              </a>
              <a href="#gatekeeper" className="rounded-full px-3 py-2.5 transition-colors hover:bg-ink/5 hover:text-ink">
                {COPY.landing.nav.gatekeeper}
              </a>
              <a href="#features" className="rounded-full px-3 py-2.5 transition-colors hover:bg-ink/5 hover:text-ink">
                {COPY.landing.nav.features}
              </a>
            </nav>
          </div>

          {!isLoading && user ? (
            <div className="flex items-center gap-3">
              <Avatar initials={user.initials} />
              <span className="sr-only">{user.name}</span>
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
            <div className="flex items-center gap-2">
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
            <div className="h-11 w-40 animate-pulse rounded-full bg-ink/5" />
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="mx-auto max-w-6xl px-5 pb-16 pt-10 lg:px-8 lg:pb-24 lg:pt-14">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-10">
          <div className="text-left lg:col-span-6">
            {user && (
              <p className="mb-5 inline-flex animate-enter items-center gap-2 rounded-full bg-mint px-3.5 py-1 text-sm font-medium text-ink">
                <span className="h-1.5 w-1.5 rounded-full bg-ink" aria-hidden="true" />
                <span>{COPY.landing.loggedInBadge(user.name)}</span>
              </p>
            )}

            <h1 className="animate-enter text-balance text-[2.5rem] [animation-delay:90ms] font-semibold leading-[1.04] tracking-[-0.015em] text-ink sm:text-5xl sm:leading-[1.04] lg:text-hero-lg lg:leading-[1.04]">
              {COPY.landing.heroTitle}
            </h1>

            <p className="mt-6 max-w-[34rem] animate-enter text-pretty text-lg leading-relaxed text-ink/80 [animation-delay:180ms]">
              {COPY.landing.heroSubtitle}
            </p>

            <div className="mt-9 flex animate-enter flex-wrap items-center gap-3 [animation-delay:270ms]">
              <PillButton
                size="lg"
                onClick={handleLaunch}
                loading={isNavigating}
                className="group min-h-12 gap-2 px-6 font-semibold hover:-translate-y-0.5 hover:shadow-popover"
              >
                <span>{user ? COPY.landing.ctaGoToApp : COPY.landing.heroCtaPrimary}</span>
                <Icon icon={ArrowForwardIcon} size="sm" className="transition-transform duration-200 ease-out-strong group-hover:translate-x-1" />
              </PillButton>
              {user ? (
                <Link href={ROUTES.dashboard} className={pillClassName('outline', 'lg', 'min-h-12 px-6 font-semibold hover:-translate-y-0.5')}>
                  {COPY.nav.stats}
                </Link>
              ) : (
                <a href="#domains" className={pillClassName('outline', 'lg', 'min-h-12 px-6 font-semibold hover:-translate-y-0.5')}>
                  {COPY.landing.heroCtaSecondary}
                </a>
              )}
            </div>

            <ul className="mt-9 flex animate-enter flex-col gap-2.5 text-sm text-ink/75 [animation-delay:360ms]">
              {COPY.landing.heroTrustPoints.map((point) => (
                <li key={point} className="flex items-center gap-2">
                  <Icon icon={CheckCircleOutlineIcon} size="sm" className="text-ink/70" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="relative lg:col-span-6">
            <div className="relative aspect-[3/2] w-full animate-enter overflow-hidden rounded-callout bg-canvas">
              <Image
                src="/images/hero-image.jpg"
                alt={COPY.landing.heroImageAlt}
                fill
                priority
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 650px"
                className="animate-settle object-cover"
              />
            </div>

            <RoutinePreview />
          </div>
        </div>
      </section>

      {/* Domains: the one color-blocked grid on the page */}
      <section id="domains" className="scroll-mt-20 py-20 lg:py-28">
        <div className="mx-auto max-w-6xl px-5 lg:px-8">
          <div className="reveal max-w-2xl">
            <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
              {COPY.landing.domainsTitle}
            </h2>
            <p className="mt-3 text-pretty text-lg text-ink/80">{COPY.landing.domainsSubtitle}</p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {COPY.landing.domains.map((domain, index) => {
              const isFeatured = index === 0;
              const DomainIcon = DOMAIN_ICONS[domain.id] || ScienceOutlinedIcon;
              const cardTone = toneStyles[domain.tone];

              return (
                <div
                  key={domain.id}
                  className={cn(
                    'reveal relative overflow-hidden flex flex-col justify-between rounded-callout p-6',
                    isFeatured && 'sm:col-span-2 lg:row-span-2 sm:min-h-[380px] lg:min-h-0 lg:p-8',
                    cardTone.card
                  )}
                >
                  <div className={cn(isFeatured && 'flex flex-1 flex-col')}>
                    <div className="relative z-10 flex items-center justify-between gap-3">
                      <span className="text-sm font-semibold text-ink/80">{domain.tag}</span>
                      <IconTile variant="inverse" shape="circle" size={isFeatured ? 48 : 32}>
                        <Icon icon={DomainIcon} size={isFeatured ? 'md' : 'sm'} />
                      </IconTile>
                    </div>

                    {'image' in domain && domain.image && (
                      <div className="pointer-events-none select-none relative my-4 flex justify-center sm:absolute sm:bottom-0 sm:right-4 sm:my-0 lg:right-8">
                        <Image
                          src={domain.image}
                          alt={'imageAlt' in domain && domain.imageAlt ? domain.imageAlt : domain.title}
                          width={407}
                          height={612}
                          className="h-48 w-auto object-contain sm:h-72 md:h-80 lg:h-[360px] xl:h-[400px]"
                          priority
                        />
                      </div>
                    )}

                    <h3
                      className={cn(
                        'relative z-10 mt-4 text-balance font-display font-bold leading-snug text-ink',
                        isFeatured ? 'text-3xl sm:text-4xl sm:max-w-xs md:max-w-sm lg:max-w-[340px] xl:max-w-md lg:mt-auto lg:pt-16' : 'text-xl'
                      )}
                    >
                      {domain.title}
                    </h3>
                    <p
                      className={cn(
                        'relative z-10 mt-2 leading-relaxed text-ink/85',
                        isFeatured ? 'text-base sm:text-lg sm:max-w-xs md:max-w-sm lg:max-w-[340px] xl:max-w-md' : 'text-base'
                      )}
                    >
                      {domain.description}
                    </p>
                  </div>

                  <p
                    className={cn(
                      'relative z-10 mt-6 border-t border-ink/15 pt-4 text-sm font-semibold text-ink/80',
                      isFeatured && 'sm:max-w-xs md:max-w-sm lg:max-w-[340px] xl:max-w-md'
                    )}
                  >
                    {domain.stat}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works: a real four-step sequence, so it is an ordered list */}
      <section id="how-it-works" className="scroll-mt-20 bg-canvas py-20 lg:py-28">
        <div className="mx-auto max-w-6xl px-5 lg:px-8">
          <h2 className="reveal max-w-2xl text-balance text-3xl font-bold tracking-tight sm:text-4xl">
            {COPY.landing.architectureTitle}
          </h2>

          <ol className="mt-12 grid grid-cols-1 gap-x-12 gap-y-10 md:grid-cols-2">
            {HOW_IT_WORKS_STEPS.map((step) => (
              <li key={step.number} className="reveal flex gap-5">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ink font-display text-base font-bold text-white">
                  {step.number}
                </span>
                <div>
                  <h3 className="font-display text-xl font-bold text-ink">{step.title}</h3>
                  <p className="mt-2 max-w-prose text-base leading-relaxed text-ink/80">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Scientific Rigor & Scope Gatekeeper */}
      <section id="gatekeeper" className="scroll-mt-20 pt-20 lg:pt-28">
        <div className="mx-auto max-w-6xl px-5 lg:px-8">
          <div className="reveal grid gap-8 rounded-callout bg-mint p-8 sm:p-12 lg:grid-cols-2 lg:gap-16">
            <div>
              <p className="flex items-center gap-2 text-sm font-semibold text-ink">
                <Icon icon={ShieldOutlinedIcon} size="sm" />
                <span>{COPY.landing.scopeBadge}</span>
              </p>
              <h2 className="mt-4 text-balance text-3xl font-bold tracking-tight sm:text-4xl">
                {COPY.landing.rigorTitle}
              </h2>
            </div>
            <div className="lg:pt-9">
              <p className="text-pretty text-lg leading-relaxed text-ink/85">{COPY.landing.rigorSubtitle}</p>
              <p className="mt-4 text-pretty text-base leading-relaxed text-ink/80">{COPY.landing.scopeNote}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features: plain two-column list, no card chrome */}
      <section id="features" className="scroll-mt-20 py-20 lg:py-28">
        <div className="mx-auto max-w-6xl px-5 lg:px-8">
          <h2 className="reveal max-w-2xl text-balance text-3xl font-bold tracking-tight sm:text-4xl">
            {COPY.landing.capabilitiesTitle}
          </h2>

          <ul className="mt-12 grid grid-cols-1 gap-x-12 gap-y-8 md:grid-cols-2">
            {FEATURES.map((feature) => (
              <li key={feature.title} className="reveal flex gap-4">
                <IconTile variant="plain" shape="circle" size={48} className="shrink-0 bg-mint text-ink">
                  <Icon icon={feature.icon} size="md" />
                </IconTile>
                <div>
                  <h3 className="font-display text-lg font-bold text-ink">{feature.title}</h3>
                  <p className="mt-1 max-w-prose text-base leading-relaxed text-ink/80">{feature.body}</p>
                </div>
              </li>
            ))}
          </ul>

          {/* Closing call to action: flat panel, one button */}
          <div className="reveal mt-20 rounded-callout bg-yellow px-6 py-12 text-center sm:px-14 sm:py-16">
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
                className="group min-h-12 gap-2 px-6 font-semibold hover:-translate-y-0.5 hover:shadow-popover"
              >
                <span>{user ? COPY.landing.ctaGoToApp : COPY.landing.heroCtaPrimary}</span>
                <Icon icon={ArrowForwardIcon} size="sm" className="transition-transform duration-200 ease-out-strong group-hover:translate-x-1" />
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
              unoptimized
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
