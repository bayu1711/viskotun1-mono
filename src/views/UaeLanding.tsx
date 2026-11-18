'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckIcon from '@mui/icons-material/Check';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import DirectionsWalkOutlinedIcon from '@mui/icons-material/DirectionsWalkOutlined';
import FitnessCenterOutlinedIcon from '@mui/icons-material/FitnessCenterOutlined';
import LocalHospitalOutlinedIcon from '@mui/icons-material/LocalHospitalOutlined';
import NightsStayOutlinedIcon from '@mui/icons-material/NightsStayOutlined';
import PsychologyOutlinedIcon from '@mui/icons-material/PsychologyOutlined';
import ScienceOutlinedIcon from '@mui/icons-material/ScienceOutlined';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import SmokeFreeOutlinedIcon from '@mui/icons-material/SmokeFreeOutlined';
import SpaOutlinedIcon from '@mui/icons-material/SpaOutlined';
import SyncAltIcon from '@mui/icons-material/SyncAlt';
import TimerOutlinedIcon from '@mui/icons-material/TimerOutlined';
import TuneOutlinedIcon from '@mui/icons-material/TuneOutlined';
import WbSunnyOutlinedIcon from '@mui/icons-material/WbSunnyOutlined';
import { toast } from 'sonner';

import { useAssistant } from '../contexts/AssistantContext';
import { useAuth } from '../contexts/AuthContext';
import { useLocale } from '../contexts/LocaleContext';
import { ROUTES } from '../data/navigation';
import { Avatar } from '../components/ui/Avatar';
import { Icon } from '../components/ui/Icon';
import { IconTile } from '../components/ui/IconTile';
import { PillButton } from '../components/ui/PillButton';
import { cn } from '../utils/cn';

type BarrierKey = 'heat' | 'shift' | 'ramadan';

export function UaeLandingView() {
  const router = useRouter();
  const { user, isLoading, loginAsGuest, logout, updateLifestyleProfile } = useAuth();
  const { openLifestyleTuning } = useAssistant();
  const { locale, toggleLocale, copy, isRtl } = useLocale();

  const [isNavigating, setIsNavigating] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [selectedBarrier, setSelectedBarrier] = useState<BarrierKey>('heat');
  const [simulatedMicroDone, setSimulatedMicroDone] = useState(false);

  const t = copy.uaeLanding;

  useEffect(() => {
    router.prefetch(ROUTES.routine);
  }, [router]);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleStartUae = (tags: string[] = ['extreme_heat_summer', 'healthcare_shift_worker']) => {
    setIsNavigating(true);
    if (!user) {
      loginAsGuest();
    }
    updateLifestyleProfile({
      region: {
        countryCode: 'AE',
        countryName: 'United Arab Emirates',
        city: 'Abu Dhabi',
        detectedBy: 'user_selected',
        confirmed: true
      },
      activeTags: tags
    });
    toast.success(
      locale === 'ar'
        ? 'تم ضبط الخطة بخصائص أبوظبي والإمارات'
        : 'UAE & Abu Dhabi profile loaded successfully'
    );
    router.push(ROUTES.routine);
  };

  const handleSimulateMicro = () => {
    setSimulatedMicroDone(true);
    toast.success(
      locale === 'ar'
        ? 'أحسنت! أتممت الخطوة الميسّرة وحفظت سلسلة التزامك دون عقاب.'
        : 'Micro-dose step completed! Streak conserved without penalty.'
    );
  };

  const barriers: { key: BarrierKey; label: string; icon: typeof WbSunnyOutlinedIcon }[] = [
    { key: 'heat', label: t.simulator.barrierHeat, icon: WbSunnyOutlinedIcon },
    { key: 'shift', label: t.simulator.barrierShift, icon: LocalHospitalOutlinedIcon },
    { key: 'ramadan', label: t.simulator.barrierRamadan, icon: NightsStayOutlinedIcon }
  ];

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className="min-h-screen bg-white font-sans text-ink selection:bg-orange/20 selection:text-ink"
    >
      {/* Top Challenge Notice Banner */}
      <div className="bg-yellow text-ink border-b border-ink/10">
        <div className="mx-auto flex min-h-11 max-w-6xl items-center justify-between gap-3 px-5 py-2 text-xs font-semibold sm:text-sm">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-ink px-2.5 py-0.5 text-2xs font-bold text-white">
              GITEX 2026
            </span>
            <span className="hidden sm:inline">{t.challengeBadge}</span>
            <span className="sm:hidden">Future Health Challenge · Abu Dhabi</span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={ROUTES.landing}
              className="text-xs text-ink/75 underline underline-offset-2 transition-colors hover:text-ink"
            >
              {t.backToGlobal}
            </Link>

            {/* Language Switcher Pill */}
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

      {/* Sticky Header */}
      <header
        className={cn(
          'sticky top-0 z-40 border-b bg-white/95 backdrop-blur-md transition-colors',
          isScrolled ? 'border-ink/10 shadow-sm' : 'border-transparent'
        )}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3.5 lg:px-8">
          <div className="flex items-center gap-4">
            <Link
              href={ROUTES.uae}
              className="flex min-h-11 items-center gap-2.5 transition-opacity hover:opacity-85"
            >
              <Image
                src={copy.brand.logoUrl}
                alt={copy.brand.name}
                width={130}
                height={32}
                priority
                className="h-7 w-auto object-contain"
              />
              <span className="rounded-full border border-ink/20 bg-cream px-2 py-0.5 text-2xs font-bold text-ink">
                🇦🇪 Abu Dhabi
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            {!isLoading && user ? (
              <div className="flex items-center gap-3">
                <Avatar initials={user.initials} />
                <PillButton
                  variant="ink"
                  size="sm"
                  onClick={() => router.push(ROUTES.routine)}
                  className="hidden min-h-11 whitespace-nowrap font-semibold sm:inline-flex"
                >
                  {copy.landing.ctaGoToApp}
                </PillButton>
                <button
                  type="button"
                  onClick={logout}
                  className="inline-flex min-h-11 items-center whitespace-nowrap px-2 text-xs text-ink/75 transition-colors hover:text-ink"
                >
                  {copy.auth.signOut}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <PillButton
                  variant="ink"
                  size="sm"
                  onClick={() => handleStartUae()}
                  loading={isNavigating}
                  className="min-h-11 px-4 text-xs font-semibold sm:text-sm"
                >
                  <span>{t.ctaStartTrial}</span>
                  <Icon
                    icon={ArrowForwardIcon}
                    size="xs"
                    className={cn(
                      'transition-transform duration-200',
                      isRtl ? 'rotate-180' : ''
                    )}
                  />
                </PillButton>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-canvas py-16 lg:py-24 border-b border-ink/10">
        <div className="mx-auto max-w-6xl px-5 lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex flex-wrap items-center gap-2 rounded-full border border-ink/20 bg-white px-3 py-1 text-xs font-semibold text-ink shadow-xs">
              <span className="text-sm">🇦🇪</span>
              <span>{t.challengeSubbadge}</span>
            </div>

            <h1 className="mt-6 text-balance font-display text-3xl font-extrabold tracking-tight text-ink sm:text-5xl sm:leading-tight">
              {t.heroTitle}
            </h1>

            <p className="mt-5 text-pretty text-lg leading-relaxed text-ink/80 sm:text-xl">
              {t.heroSubtitle}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <PillButton
                variant="primary"
                size="lg"
                onClick={() => handleStartUae()}
                loading={isNavigating}
                className="group min-h-12 gap-2 px-7 font-bold shadow-md hover:-translate-y-0.5"
              >
                <span>{t.ctaStartTrial}</span>
                <Icon
                  icon={ArrowForwardIcon}
                  size="sm"
                  className={cn(
                    'transition-transform duration-200 ease-out-strong group-hover:translate-x-1',
                    isRtl ? 'rotate-180 group-hover:-translate-x-1' : ''
                  )}
                />
              </PillButton>

              <button
                type="button"
                onClick={openLifestyleTuning}
                className="inline-flex min-h-12 items-center gap-2 rounded-full border border-ink/20 bg-white px-5 text-sm font-semibold text-ink transition-colors hover:bg-ink/5"
              >
                <Icon icon={TuneOutlinedIcon} size="sm" />
                <span>{copy.lifestyleTuning.tuneButton}</span>
              </button>
            </div>
          </div>

          {/* Trust Metrics Bar */}
          <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-ink/10 bg-white p-5 shadow-xs">
              <div className="flex items-center gap-2 text-ink">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-mint text-ink">
                  <Icon icon={CheckCircleOutlineIcon} size="xs" />
                </span>
                <h3 className="font-display font-bold text-base text-ink">
                  {t.trustMetrics.noStreakBreakTitle}
                </h3>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-ink/75">
                {t.trustMetrics.noStreakBreakDesc}
              </p>
            </div>

            <div className="rounded-2xl border border-ink/10 bg-white p-5 shadow-xs">
              <div className="flex items-center gap-2 text-ink">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-peach text-ink">
                  <Icon icon={ScienceOutlinedIcon} size="xs" />
                </span>
                <h3 className="font-display font-bold text-base text-ink">
                  {t.trustMetrics.clinicalRigourTitle}
                </h3>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-ink/75">
                {t.trustMetrics.clinicalRigourDesc}
              </p>
            </div>

            <div className="rounded-2xl border border-ink/10 bg-white p-5 shadow-xs">
              <div className="flex items-center gap-2 text-ink">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow text-ink">
                  <Icon icon={TimerOutlinedIcon} size="xs" />
                </span>
                <h3 className="font-display font-bold text-base text-ink">
                  {t.trustMetrics.microDoseTitle}
                </h3>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-ink/75">
                {t.trustMetrics.microDoseDesc}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Behavioral Simulator Section */}
      <section id="simulator" className="py-20 lg:py-28">
        <div className="mx-auto max-w-6xl px-5 lg:px-8">
          <div className="max-w-2xl">
            <span className="inline-block rounded-full bg-orange/15 px-3 py-1 text-xs font-bold text-ink">
              {t.simulator.tag}
            </span>
            <h2 className="mt-3 text-balance font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
              {t.simulator.title}
            </h2>
            <p className="mt-3 text-pretty text-base leading-relaxed text-ink/80">
              {t.simulator.subtitle}
            </p>
          </div>

          {/* Barrier Selector Tabs */}
          <div className="mt-8">
            <p className="text-xs font-bold tracking-wider uppercase text-ink/60">
              {t.simulator.barrierLabel}
            </p>
            <div className="mt-3 flex flex-wrap gap-2.5">
              {barriers.map((barrier) => {
                const isActive = selectedBarrier === barrier.key;
                const BarrierIcon = barrier.icon;
                return (
                  <button
                    key={barrier.key}
                    type="button"
                    onClick={() => {
                      setSelectedBarrier(barrier.key);
                      setSimulatedMicroDone(false);
                    }}
                    className={cn(
                      'inline-flex min-h-11 items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all cursor-pointer',
                      isActive
                        ? 'border border-ink bg-ink text-white shadow-sm'
                        : 'border border-ink/15 bg-white text-ink hover:border-ink/40 hover:bg-ink/5'
                    )}
                  >
                    <Icon icon={BarrierIcon} size="xs" />
                    <span>{barrier.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Contrast Simulator Grid */}
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Conventional App Card */}
            <div className="relative flex flex-col justify-between rounded-callout border-2 border-blush/80 bg-blush/20 p-6 sm:p-8">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded-full bg-blush px-3 py-1 text-2xs font-bold text-ink">
                    {t.simulator.traditionalBadge}
                  </span>
                  <span className="text-xs font-medium text-ink/60">
                    {t.simulator.traditionalAppTitle}
                  </span>
                </div>

                <div className="mt-6 flex items-baseline gap-2">
                  <h3 className="text-2xl font-black text-ink">
                    {t.simulator.traditionalResultTitle}
                  </h3>
                  <span className="text-xs font-bold text-ink/60">❌ Reset</span>
                </div>

                <p className="mt-3 text-sm leading-relaxed text-ink/85">
                  {t.simulator.traditionalResultBody}
                </p>

                <div className="mt-6 rounded-xl border border-ink/10 bg-white/70 p-4">
                  <p className="text-xs font-bold text-ink/75">
                    {locale === 'ar' ? 'النتيجة السلوكية المترتبة:' : 'Clinical Drop-Off Trigger:'}
                  </p>
                  <p className="mt-1 text-xs text-ink/70">
                    {locale === 'ar'
                      ? 'ظاهرة "انتهاك الامتناع" (Abstinence Violation Effect) تؤدي إلى شعور بالذنب ثم التخلي عن المنظومة كلياً خلال أسبوعين.'
                      : 'The Abstinence Violation Effect triggers cognitive friction and guilt, leading 82% of users to permanently uninstall.'}
                  </p>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-ink/10">
                <span className="text-xs font-semibold text-ink/60 line-through">
                  {locale === 'ar' ? 'اليوم المقرر: 45 دقيقة ركض خارجي' : 'Scheduled: 45m Outdoor Cardio'}
                </span>
              </div>
            </div>

            {/* ViskotuN1 Adaptive Engine Card */}
            <div className="relative flex flex-col justify-between rounded-callout border-2 border-mint bg-mint/20 p-6 sm:p-8 shadow-sm">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded-full bg-mint px-3 py-1 text-2xs font-bold text-ink">
                    {t.simulator.viskotuBadge}
                  </span>
                  <span className="text-xs font-medium text-ink/70">
                    {t.simulator.viskotuAppTitle}
                  </span>
                </div>

                <div className="mt-6 flex items-baseline gap-2">
                  <h3 className="text-2xl font-black text-ink">
                    {simulatedMicroDone
                      ? locale === 'ar'
                        ? 'استمرار السلسلة: اليوم 20 (+1)'
                        : 'Streak Advanced: Day 20 (+1)'
                      : t.simulator.viskotuResultTitle}
                  </h3>
                  <span className="text-xs font-bold text-ink">
                    {simulatedMicroDone ? '🔥 Preserved' : '✅ Conserved'}
                  </span>
                </div>

                <p className="mt-3 text-sm leading-relaxed text-ink/85">
                  {t.simulator.viskotuResultBody}
                </p>

                <div className="mt-6 rounded-xl border border-ink/10 bg-white p-4 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-ink">
                      {selectedBarrier === 'heat'
                        ? locale === 'ar'
                          ? 'الخطوة الميسّرة: 4 دقائق ثبات حركي داخل التكييف'
                          : 'Micro-Dose: 4m AC Indoor Isometric Press'
                        : selectedBarrier === 'shift'
                        ? locale === 'ar'
                          ? 'الخطوة الميسّرة: 3 دقائق تنفس مهدئ واستشفاء'
                          : 'Micro-Dose: 3m Decompression Breathwork'
                        : locale === 'ar'
                        ? 'الخطوة الميسّرة: 5 دقائق تمدد لطيف بعد الإفطار'
                        : 'Micro-Dose: 5m Post-Iftar Light Pacing'}
                    </span>
                    <span className="text-2xs font-semibold rounded-full bg-mint px-2 py-0.5 text-ink">
                      {locale === 'ar' ? 'بديل آمن' : 'Safe Fallback'}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-ink/75">
                    {locale === 'ar'
                      ? 'تم تقليص الحمل بنسبة 85% لحماية العادة السلوكية في أصعب الظروف دون لوم أو تصفير.'
                      : 'Load reduced by 85% to protect neurological habit loop under extreme friction without resetting.'}
                  </p>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-ink/10 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleSimulateMicro}
                  disabled={simulatedMicroDone}
                  className={cn(
                    'inline-flex min-h-11 items-center gap-2 rounded-full px-5 text-xs font-bold transition-all cursor-pointer',
                    simulatedMicroDone
                      ? 'bg-mint text-ink cursor-default'
                      : 'bg-ink text-white hover:bg-ink/85'
                  )}
                >
                  <Icon icon={CheckIcon} size="xs" />
                  <span>
                    {simulatedMicroDone
                      ? locale === 'ar'
                        ? 'تم إنجاز الخطوة بنجاح ✓'
                        : 'Micro-Dose Logged ✓'
                      : locale === 'ar'
                      ? 'محاكاة إنجاز الخطوة الميسّرة'
                      : 'Simulate Completing Micro-Dose'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedBarrier(selectedBarrier === 'heat' ? 'shift' : selectedBarrier === 'shift' ? 'ramadan' : 'heat');
                    setSimulatedMicroDone(false);
                  }}
                  className="text-xs font-semibold text-ink underline underline-offset-2 hover:text-ink/80"
                >
                  {t.simulator.tryActionText}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Three Architectural Pillars for Gulf Wellbeing */}
      <section className="bg-cream/40 py-20 lg:py-28 border-y border-ink/10">
        <div className="mx-auto max-w-6xl px-5 lg:px-8">
          <div className="max-w-2xl">
            <h2 className="font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
              {t.pillarsTitle}
            </h2>
            <p className="mt-3 text-pretty text-base leading-relaxed text-ink/80">
              {t.pillarsSubtitle}
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
            {/* Pillar 1 */}
            <div className="flex flex-col justify-between rounded-callout border border-ink/10 bg-white p-7 shadow-xs">
              <div>
                <IconTile variant="plain" shape="circle" size={48} className="bg-yellow text-ink">
                  <Icon icon={WbSunnyOutlinedIcon} size="md" />
                </IconTile>
                <span className="mt-4 inline-block text-2xs font-bold uppercase tracking-wider text-ink/60">
                  {t.pillar1.tag}
                </span>
                <h3 className="mt-1 font-display text-xl font-bold text-ink">
                  {t.pillar1.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-ink/80">
                  {t.pillar1.body}
                </p>
              </div>
            </div>

            {/* Pillar 2 */}
            <div className="flex flex-col justify-between rounded-callout border border-ink/10 bg-white p-7 shadow-xs">
              <div>
                <IconTile variant="plain" shape="circle" size={48} className="bg-sky text-ink">
                  <Icon icon={NightsStayOutlinedIcon} size="md" />
                </IconTile>
                <span className="mt-4 inline-block text-2xs font-bold uppercase tracking-wider text-ink/60">
                  {t.pillar2.tag}
                </span>
                <h3 className="mt-1 font-display text-xl font-bold text-ink">
                  {t.pillar2.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-ink/80">
                  {t.pillar2.body}
                </p>
              </div>
            </div>

            {/* Pillar 3 */}
            <div className="flex flex-col justify-between rounded-callout border border-ink/10 bg-white p-7 shadow-xs">
              <div>
                <IconTile variant="plain" shape="circle" size={48} className="bg-mint text-ink">
                  <Icon icon={SmokeFreeOutlinedIcon} size="md" />
                </IconTile>
                <span className="mt-4 inline-block text-2xs font-bold uppercase tracking-wider text-ink/60">
                  {t.pillar3.tag}
                </span>
                <h3 className="mt-1 font-display text-xl font-bold text-ink">
                  {t.pillar3.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-ink/80">
                  {t.pillar3.body}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Curated Abu Dhabi Research Routines */}
      <section id="routines" className="py-20 lg:py-28">
        <div className="mx-auto max-w-6xl px-5 lg:px-8">
          <div className="max-w-2xl">
            <h2 className="font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
              {t.routinesTitle}
            </h2>
            <p className="mt-3 text-pretty text-base leading-relaxed text-ink/80">
              {t.routinesSubtitle}
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
            {/* Heat Routine */}
            <div className="flex flex-col justify-between rounded-callout border border-ink/10 bg-white p-6 shadow-sm hover:border-ink/30 transition-colors">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded-full bg-yellow/80 px-2.5 py-0.5 text-2xs font-bold text-ink">
                    {t.routineCards.heat.tag}
                  </span>
                  <span className="text-2xs font-medium text-ink/60">
                    {t.routineCards.heat.duration}
                  </span>
                </div>
                <h3 className="mt-4 font-display text-lg font-bold text-ink">
                  {t.routineCards.heat.title}
                </h3>
                <p className="mt-1 text-xs font-semibold text-ink/65">
                  {t.routineCards.heat.institution}
                </p>
                <p className="mt-3 text-xs leading-relaxed text-ink/80">
                  {t.routineCards.heat.action}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-ink/10">
                <button
                  type="button"
                  onClick={() => handleStartUae(['extreme_heat_summer'])}
                  className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-ink bg-ink text-white px-4 text-xs font-bold hover:bg-ink/85 transition-colors cursor-pointer"
                >
                  <span>{t.launchRoutineCta}</span>
                  <Icon
                    icon={ArrowForwardIcon}
                    size="xs"
                    className={cn(isRtl ? 'rotate-180' : '')}
                  />
                </button>
              </div>
            </div>

            {/* Ramadan Routine */}
            <div className="flex flex-col justify-between rounded-callout border border-ink/10 bg-white p-6 shadow-sm hover:border-ink/30 transition-colors">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded-full bg-sky/80 px-2.5 py-0.5 text-2xs font-bold text-ink">
                    {t.routineCards.ramadan.tag}
                  </span>
                  <span className="text-2xs font-medium text-ink/60">
                    {t.routineCards.ramadan.duration}
                  </span>
                </div>
                <h3 className="mt-4 font-display text-lg font-bold text-ink">
                  {t.routineCards.ramadan.title}
                </h3>
                <p className="mt-1 text-xs font-semibold text-ink/65">
                  {t.routineCards.ramadan.institution}
                </p>
                <p className="mt-3 text-xs leading-relaxed text-ink/80">
                  {t.routineCards.ramadan.action}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-ink/10">
                <button
                  type="button"
                  onClick={() => handleStartUae(['ramadan_fasting'])}
                  className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-ink bg-ink text-white px-4 text-xs font-bold hover:bg-ink/85 transition-colors cursor-pointer"
                >
                  <span>{t.launchRoutineCta}</span>
                  <Icon
                    icon={ArrowForwardIcon}
                    size="xs"
                    className={cn(isRtl ? 'rotate-180' : '')}
                  />
                </button>
              </div>
            </div>

            {/* Midwakh Routine */}
            <div className="flex flex-col justify-between rounded-callout border border-ink/10 bg-white p-6 shadow-sm hover:border-ink/30 transition-colors">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded-full bg-mint/80 px-2.5 py-0.5 text-2xs font-bold text-ink">
                    {t.routineCards.midwakh.tag}
                  </span>
                  <span className="text-2xs font-medium text-ink/60">
                    {t.routineCards.midwakh.duration}
                  </span>
                </div>
                <h3 className="mt-4 font-display text-lg font-bold text-ink">
                  {t.routineCards.midwakh.title}
                </h3>
                <p className="mt-1 text-xs font-semibold text-ink/65">
                  {t.routineCards.midwakh.institution}
                </p>
                <p className="mt-3 text-xs leading-relaxed text-ink/80">
                  {t.routineCards.midwakh.action}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-ink/10">
                <button
                  type="button"
                  onClick={() => handleStartUae(['midwakh_dokha', 'shisha_waterpipe'])}
                  className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-ink bg-ink text-white px-4 text-xs font-bold hover:bg-ink/85 transition-colors cursor-pointer"
                >
                  <span>{t.launchRoutineCta}</span>
                  <Icon
                    icon={ArrowForwardIcon}
                    size="xs"
                    className={cn(isRtl ? 'rotate-180' : '')}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Clinical Adherence Summary Section (SEHA / Cleveland Clinic) */}
      <section className="bg-canvas py-20 lg:py-28 border-t border-ink/10">
        <div className="mx-auto max-w-6xl px-5 lg:px-8">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 items-center">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-bold text-ink border border-ink/10 shadow-xs">
                <Icon icon={LocalHospitalOutlinedIcon} size="xs" />
                <span>Abu Dhabi Health Authority Integration</span>
              </span>
              <h2 className="mt-4 text-balance font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
                {t.clinicalBriefTitle}
              </h2>
              <p className="mt-3 text-pretty text-base leading-relaxed text-ink/80">
                {t.clinicalBriefSubtitle}
              </p>

              <ul className="mt-6 space-y-3">
                {t.clinicalBriefPoints.map((point) => (
                  <li key={point} className="flex items-start gap-3 text-sm text-ink/85">
                    <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-mint text-ink">
                      <Icon icon={CheckIcon} size="xs" />
                    </span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-callout border border-ink/10 bg-white p-6 sm:p-8 shadow-sm">
              <div className="flex items-center justify-between border-b border-ink/10 pb-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-ink/50">
                    Clinical Brief Export
                  </p>
                  <p className="font-display font-bold text-base text-ink">
                    Cleveland Clinic Abu Dhabi / SEHA Consultation
                  </p>
                </div>
                <span className="rounded-full bg-mint px-2.5 py-0.5 text-2xs font-bold text-ink">
                  Verified Format
                </span>
              </div>

              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-ink/70">Adherence Consistency:</span>
                  <span className="font-bold text-ink">92% (Day 19 of 28)</span>
                </div>
                <div className="h-2 w-full rounded-full bg-ink/10 overflow-hidden">
                  <div className="h-full bg-orange w-[92%] rounded-full" />
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-ink/70">Adaptive Micro-Dose Conversions:</span>
                  <span className="font-bold text-ink">4 Sessions (Zero Lapses)</span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-ink/70">Reported Morning Pain Score:</span>
                  <span className="font-bold text-ink">1.8 / 10 (Down from 6.4)</span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-ink/70">Cessation Urge Frequency:</span>
                  <span className="font-bold text-ink">-65% Reduction</span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-ink/10 text-center">
                <span className="text-2xs text-ink/60">
                  Formatted according to Abu Dhabi Public Health Centre (ADPHC) digital health standards.
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Banner */}
      <section className="py-20 lg:py-28">
        <div className="mx-auto max-w-6xl px-5 lg:px-8">
          <div className="rounded-callout bg-yellow px-6 py-12 text-center sm:px-14 sm:py-16 shadow-popover">
            <h2 className="mx-auto max-w-2xl text-balance font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
              {t.ctaBannerTitle}
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-pretty text-base text-ink/85 sm:text-lg">
              {t.ctaBannerSubtitle}
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <PillButton
                variant="ink"
                size="lg"
                onClick={() => handleStartUae()}
                loading={isNavigating}
                className="group min-h-12 gap-2 px-8 font-bold shadow-md hover:-translate-y-0.5"
              >
                <span>{t.ctaBannerButton}</span>
                <Icon
                  icon={ArrowForwardIcon}
                  size="sm"
                  className={cn(
                    'transition-transform duration-200 ease-out-strong group-hover:translate-x-1',
                    isRtl ? 'rotate-180 group-hover:-translate-x-1' : ''
                  )}
                />
              </PillButton>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-canvas py-10 text-center text-sm text-ink/75 border-t border-ink/10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 sm:flex-row lg:px-8">
          <div className="flex items-center gap-2">
            <Image
              src={copy.brand.iconUrl}
              alt=""
              width={20}
              height={20}
              unoptimized
              className="h-5 w-5 object-contain"
            />
            <p>TrialN1 · Abu Dhabi & UAE Edition</p>
          </div>
          <div className="flex items-center gap-5">
            <Link
              href={ROUTES.landing}
              className="inline-flex min-h-11 items-center font-medium transition-colors hover:text-ink"
            >
              {t.backToGlobal}
            </Link>
            <Link
              href={ROUTES.routine}
              className="inline-flex min-h-11 items-center transition-colors hover:text-ink"
            >
              {copy.landing.ctaGoToApp}
            </Link>
            <a
              href="https://github.com/bayu1711/viskotun1-mono"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center underline underline-offset-2 transition-colors hover:text-ink"
            >
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
