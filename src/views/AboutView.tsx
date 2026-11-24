'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import AutoStoriesOutlinedIcon from '@mui/icons-material/AutoStoriesOutlined';
import FavoriteBorderOutlinedIcon from '@mui/icons-material/FavoriteBorderOutlined';
import HealthAndSafetyOutlinedIcon from '@mui/icons-material/HealthAndSafetyOutlined';
import ScienceOutlinedIcon from '@mui/icons-material/ScienceOutlined';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import { toast } from 'sonner';
import { LegalHeader } from '@/components/layout/LegalHeader';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { Icon } from '@/components/ui/Icon';
import { IconTile } from '@/components/ui/IconTile';
import { PillButton, pillClassName } from '@/components/ui/PillButton';
import { useAuth } from '@/contexts/AuthContext';
import { useLocale } from '@/contexts/LocaleContext';
import { ROUTES } from '@/data/navigation';
import { cn } from '@/utils/cn';

const PRINCIPLE_ICONS = [
  ShieldOutlinedIcon,
  ScienceOutlinedIcon,
  FavoriteBorderOutlinedIcon,
  HealthAndSafetyOutlinedIcon
] as const;

export function AboutView() {
  const { copy, isRtl } = useLocale();
  const { user, loginAsGuest } = useAuth();
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);

  const t = copy.about;

  const handleLaunch = () => {
    setIsNavigating(true);
    if (!user) {
      loginAsGuest();
      toast.info(copy.auth.toastGuestEntered);
    }
    router.push(ROUTES.routine);
  };

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className="min-h-screen bg-white font-sans text-ink selection:bg-orange/20 selection:text-ink"
    >
      <LegalHeader showCenterLink />

      <main>
        {/* Hero */}
        <section className="mx-auto max-w-6xl px-5 pb-16 pt-12 lg:px-8 lg:pb-20 lg:pt-16">
          <div className="max-w-3xl">
            <p className="inline-flex items-center gap-2 rounded-full bg-mint px-3.5 py-1 text-sm font-semibold text-ink">
              <Icon icon={AutoStoriesOutlinedIcon} size="xs" />
              <span>{t.badge}</span>
            </p>
            <h1 className="mt-5 text-balance font-display text-4xl font-bold leading-[1.06] tracking-tight text-ink sm:text-5xl lg:text-hero-lg">
              {t.heroTitle}
            </h1>
            <p className="mt-6 text-pretty text-lg leading-relaxed text-ink/80">
              {t.heroSubtitle}
            </p>
          </div>
        </section>

        {/* How TrialN1 Came to Be */}
        <section className="bg-canvas py-16 lg:py-24">
          <div className="mx-auto max-w-6xl px-5 lg:px-8">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-wider text-ink/60">
                {t.storyEyebrow}
              </p>
              <h2 className="mt-2 text-balance font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
                {t.storyTitle}
              </h2>
              <p className="mt-4 text-pretty text-base leading-relaxed text-ink/80 sm:text-lg">
                {t.storyIntro}
              </p>
            </div>

            <ol className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2">
              {t.milestones.map((item) => (
                <li
                  key={item.number}
                  className="flex gap-5 rounded-callout bg-white p-6 sm:p-7"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ink font-display text-base font-bold text-white">
                    {item.number}
                  </span>
                  <div>
                    <h3 className="font-display text-xl font-bold text-ink">{item.title}</h3>
                    <p className="mt-2 text-pretty text-sm leading-relaxed text-ink/80 sm:text-base">
                      {item.body}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Meet the Founders: Fazarath Fazal & Thoshi */}
        <section id="team" className="py-16 lg:py-24">
          <div className="mx-auto max-w-6xl px-5 lg:px-8">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-wider text-ink/60">
                {t.teamEyebrow}
              </p>
              <h2 className="mt-2 text-balance font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
                {t.teamTitle}
              </h2>
              <p className="mt-3 text-pretty text-base leading-relaxed text-ink/75 sm:text-lg">
                {t.teamSubtitle}
              </p>
            </div>

            <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
              {t.founders.map((founder) => (
                <article
                  key={founder.name}
                  className={cn(
                    'flex flex-col justify-between rounded-callout p-7 sm:p-8',
                    founder.tone === 'mint' ? 'bg-mint' : 'bg-cream'
                  )}
                >
                  <div>
                    <div className="flex items-center gap-4">
                      <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-ink font-display text-lg font-bold tracking-tight text-white">
                        {founder.initials}
                      </span>
                      <div>
                        <h3 className="font-display text-2xl font-bold text-ink">
                          {founder.name}
                        </h3>
                        <p className="text-sm font-semibold text-ink/75">{founder.role}</p>
                      </div>
                    </div>

                    <p className="mt-5 text-pretty text-base leading-relaxed text-ink/85">
                      {founder.bio}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Core Principles */}
        <section className="bg-canvas py-16 lg:py-24">
          <div className="mx-auto max-w-6xl px-5 lg:px-8">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-wider text-ink/60">
                {t.principlesEyebrow}
              </p>
              <h2 className="mt-2 text-balance font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
                {t.principlesTitle}
              </h2>
            </div>

            <ul className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
              {t.principles.map((principle, index) => {
                const PrincipleIcon = PRINCIPLE_ICONS[index] ?? ShieldOutlinedIcon;
                return (
                  <li
                    key={principle.title}
                    className="flex gap-4 rounded-callout bg-white p-6"
                  >
                    <IconTile
                      variant="plain"
                      shape="circle"
                      size={48}
                      className="shrink-0 bg-mint text-ink"
                    >
                      <Icon icon={PrincipleIcon} size="md" />
                    </IconTile>
                    <div>
                      <h3 className="font-display text-lg font-bold text-ink">
                        {principle.title}
                      </h3>
                      <p className="mt-1.5 text-pretty text-sm leading-relaxed text-ink/80 sm:text-base">
                        {principle.body}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        {/* Closing CTA */}
        <section className="py-16 lg:py-24">
          <div className="mx-auto max-w-6xl px-5 lg:px-8">
            <div className="rounded-callout bg-yellow px-6 py-12 text-center sm:px-14 sm:py-16">
              <h2 className="mx-auto max-w-2xl text-balance font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
                {t.ctaTitle}
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-pretty text-base text-ink/85 sm:text-lg">
                {t.ctaSubtitle}
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <PillButton
                  variant="ink"
                  size="lg"
                  onClick={handleLaunch}
                  loading={isNavigating}
                  className="group min-h-12 gap-2 px-6 font-semibold hover:-translate-y-0.5 hover:shadow-popover"
                >
                  <span>{user ? copy.landing.ctaGoToApp : t.ctaPrimary}</span>
                  <Icon
                    icon={ArrowForwardIcon}
                    size="sm"
                    className={cn(
                      'transition-transform duration-200 ease-out-strong group-hover:translate-x-1',
                      isRtl && 'rotate-180 group-hover:-translate-x-1'
                    )}
                  />
                </PillButton>
                <Link
                  href={ROUTES.legal}
                  className={pillClassName('outline', 'lg', 'min-h-12 bg-white/80 px-6 font-semibold hover:bg-white')}
                >
                  {t.ctaSecondary}
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter anchorPrefix="/" onLaunch={handleLaunch} />
    </div>
  );
}
