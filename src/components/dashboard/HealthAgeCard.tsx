'use client';

import React from 'react';
import Link from 'next/link';
import FavoriteBorderOutlinedIcon from '@mui/icons-material/FavoriteBorderOutlined';
import FitnessCenterOutlinedIcon from '@mui/icons-material/FitnessCenterOutlined';
import MonitorHeartOutlinedIcon from '@mui/icons-material/MonitorHeartOutlined';
import PsychologyOutlinedIcon from '@mui/icons-material/PsychologyOutlined';
import ScienceOutlinedIcon from '@mui/icons-material/ScienceOutlined';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';

import { useLocale } from '../../contexts/LocaleContext';
import { useRoutine } from '../../contexts/RoutineContext';
import { ROUTES } from '../../data/navigation';
import { calculateHealthAgeProjection } from '../../utils/healthAgeEngine';
import { Icon } from '../ui/Icon';
import { cn } from '../../utils/cn';

export function HealthAgeCard() {
  const {
    adherenceRate,
    streak,
    currentDay,
    totalDays,
    userProfile,
    lifestyleProfile,
    openBctLedger
  } = useRoutine();
  const { copy, isRtl } = useLocale();

  const t = copy.healthAge;

  const activeTags = lifestyleProfile?.activeTags ?? [];
  const projection = calculateHealthAgeProjection({
    adherenceRate,
    streak,
    currentDay,
    totalDays,
    microDoseCount: streak > 0 ? Math.min(streak, 4) : 0,
    barrierCount: activeTags.length,
    activeTags,
    chronologicalAge: userProfile?.age ?? 38
  });

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className="rounded-callout border border-ink/10 bg-white p-5 sm:p-6 shadow-xs"
    >
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/10 pb-4">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-peach px-2.5 py-0.5 text-2xs font-bold text-ink">
            <Icon icon={MonitorHeartOutlinedIcon} size="xs" />
            <span>{t.eyebrow}</span>
          </span>
          <h2 className="mt-1.5 font-display text-lg font-bold text-ink sm:text-xl">
            {t.title}
          </h2>
        </div>

        <button
          type="button"
          onClick={openBctLedger}
          className="inline-flex items-center gap-1.5 rounded-full border border-ink/20 bg-cream/70 hover:bg-cream px-3 py-1.5 text-xs font-semibold text-ink transition-colors cursor-pointer"
        >
          <Icon icon={ScienceOutlinedIcon} size="xs" />
          <span>{t.bctLinkText}</span>
        </button>
      </div>

      {/* Hero Numbers */}
      <div className="mt-5 grid grid-cols-1 gap-6 sm:grid-cols-2 items-center">
        {/* Left: Projected Health Age */}
        <div className="flex flex-col justify-center rounded-2xl bg-canvas/60 p-4 border border-ink/10">
          <span className="text-xs font-semibold text-ink/65">
            {t.projectedAgeLabel}
          </span>
          <div className="mt-1 flex items-baseline gap-3">
            <span className="font-display text-4xl font-black text-ink">
              {projection.projectedHealthAge}
            </span>
            <span className="rounded-full bg-mint px-2.5 py-0.5 text-xs font-bold text-ink">
              {t.deltaLabel(projection.healthAgeDelta)}
            </span>
          </div>
          <span className="mt-2 text-2xs font-medium text-ink/50">
            {t.baselineAgeLabel(projection.chronologicalAge)} · Based on {projection.sustainedStreak} day sustained habit loop
            {!userProfile?.age && (
              <>
                {' · '}
                <Link href={ROUTES.profile} className="font-semibold text-ink underline underline-offset-2 hover:text-ink/80">
                  {t.setAgeLink}
                </Link>
              </>
            )}
          </span>
        </div>

        {/* Right: Habit Resilience Index */}
        <div className="flex flex-col justify-center rounded-2xl bg-canvas/60 p-4 border border-ink/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-ink/65">
              {t.resilienceLabel}
            </span>
            <span className="font-display text-xl font-black text-ink">
              {projection.habitResilienceScore}%
            </span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-ink/10">
            <div
              className="h-full rounded-full bg-orange transition-all duration-500"
              style={{ width: `${projection.habitResilienceScore}%` }}
            />
          </div>
          <span className="mt-2 text-2xs text-ink/60">
            {t.resilienceCaption}
          </span>
        </div>
      </div>

      {/* Disease Risk Reductions */}
      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 pt-4 border-t border-ink/10">
        <div className="flex items-center justify-between rounded-xl bg-mint/15 p-3 border border-mint/30">
          <div className="flex items-center gap-2">
            <Icon icon={FavoriteBorderOutlinedIcon} size="xs" className="text-ink/80" />
            <span className="text-xs font-medium text-ink">
              {t.cvdRiskLabel}
            </span>
          </div>
          <span className="font-display font-black text-base text-ink">
            {projection.relativeCVDDelta}%
          </span>
        </div>

        <div className="flex items-center justify-between rounded-xl bg-sky/15 p-3 border border-sky/30">
          <div className="flex items-center gap-2">
            <Icon icon={FitnessCenterOutlinedIcon} size="xs" className="text-ink/80" />
            <span className="text-xs font-medium text-ink">
              {t.metabolicRiskLabel}
            </span>
          </div>
          <span className="font-display font-black text-base text-ink">
            {projection.relativeMetabolicDelta}%
          </span>
        </div>
      </div>
    </div>
  );
}
