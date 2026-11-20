'use client';

import React, { useMemo } from 'react';
import BoltOutlinedIcon from '@mui/icons-material/BoltOutlined';
import FitnessCenterOutlinedIcon from '@mui/icons-material/FitnessCenterOutlined';
import SpaOutlinedIcon from '@mui/icons-material/SpaOutlined';
import HelpOutlineOutlinedIcon from '@mui/icons-material/HelpOutlineOutlined';
import { motion } from 'framer-motion';
import { useLocale } from '../../contexts/LocaleContext';
import { useRoutine } from '../../contexts/RoutineContext';
import type { DoseMode } from '../../types/routine';
import { cn } from '../../utils/cn';
import { Icon } from '../ui/Icon';

interface DoseOption {
  id: DoseMode;
  label: string;
  icon: typeof BoltOutlinedIcon;
  badge?: string;
}

export function DoseModeSelector({ className }: { className?: string }) {
  const { doseMode, setDoseMode, openReEntryModal, pendingReEntryCheckin, activeAdaptation } = useRoutine();
  const { copy, locale } = useLocale();

  const options: DoseOption[] = useMemo(
    () => [
      { id: 'standard', label: copy.doseMode.standard, icon: FitnessCenterOutlinedIcon },
      {
        id: 'micro',
        label: copy.doseMode.micro,
        icon: BoltOutlinedIcon,
        badge:
          activeAdaptation?.recommendedDoseMode === 'micro'
            ? locale === 'ar'
              ? 'موصى به'
              : 'Recommended'
            : locale === 'ar'
            ? 'متكيف'
            : 'Adaptive'
      },
      {
        id: 'rest',
        label: copy.doseMode.rest,
        icon: SpaOutlinedIcon,
        ...(activeAdaptation?.recommendedDoseMode === 'rest'
          ? { badge: locale === 'ar' ? 'موصى به' : 'Recommended' }
          : {})
      }
    ],
    [copy, locale, activeAdaptation?.recommendedDoseMode]
  );

  return (
    <div className={cn('rounded-card border border-ink/10 bg-white/70 p-3 sm:p-4 backdrop-blur-sm', className)}>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-1.5">
          <span className="text-2xs font-semibold uppercase tracking-wider text-ink/60">
            {copy.doseMode.label}
          </span>
          {pendingReEntryCheckin && (
            <span className="flex h-2 w-2 rounded-full bg-orange animate-pulse" title={copy.task.pendingCheckinTitle} aria-label={copy.task.pendingCheckinTitle} role="img" />
          )}
        </div>

        <button
          type="button"
          onClick={openReEntryModal}
          className={cn(
            'inline-flex items-center gap-1 text-3xs transition-colors cursor-pointer',
            pendingReEntryCheckin
              ? 'rounded-full bg-mint/50 px-2.5 py-0.5 font-semibold text-ink hover:bg-mint'
              : 'font-medium text-ink/70 hover:text-ink underline decoration-dotted'
          )}
        >
          <Icon icon={HelpOutlineOutlinedIcon} size="xs" />
          <span>{locale === 'ar' ? 'تعطل جدولك؟ تكييف الخطة' : 'Life disrupted? Adapt routine'}</span>
        </button>
      </div>

      {/* Segmented Dose Options */}
      <div className="grid grid-cols-3 gap-1.5 rounded-xl bg-ink/5 p-1">
        {options.map((opt) => {
          const isActive = doseMode === opt.id;
          const IconComp = opt.icon;

          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => setDoseMode(opt.id)}
              className={cn(
                'relative flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 rounded-lg py-2 px-2 text-center text-xs font-medium transition-all focus:outline-none',
                isActive
                  ? 'bg-white text-ink shadow-sm ring-1 ring-ink/10'
                  : 'text-ink/65 hover:text-ink hover:bg-white/40'
              )}
            >
              <Icon icon={IconComp} size="xs" className={cn(isActive && opt.id === 'micro' ? 'text-amber-600' : '')} />
              <span className="truncate">{opt.label}</span>
              {opt.badge && !isActive && (
                <span className="hidden sm:inline-block rounded bg-mint/50 px-1 py-0.5 text-3xs font-semibold text-ink">
                  {opt.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Contextual Notice */}
      {doseMode === 'micro' && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-2.5 rounded-lg bg-mint/30 border border-mint/60 px-3 py-2 text-3xs text-ink/90 flex items-center justify-between gap-2"
        >
          <span className="inline-flex items-center gap-1.5 font-medium">
            <Icon icon={BoltOutlinedIcon} size="xs" className="shrink-0 text-amber-600" />
            <span>{copy.doseMode.microNotice}</span>
          </span>
          <span className="shrink-0 text-3xs text-ink/60 hidden sm:inline">
            {locale === 'ar' ? 'حماية وتيرة الالتزام' : 'Preserves habit loop'}
          </span>
        </motion.div>
      )}

      {doseMode === 'rest' && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-2.5 rounded-lg bg-sky/30 border border-sky/50 px-3 py-2 text-3xs text-ink/90 flex items-center justify-between gap-2"
        >
          <span className="inline-flex items-center gap-1.5 font-medium">
            <Icon icon={SpaOutlinedIcon} size="xs" className="shrink-0 text-ink/75" />
            <span>{copy.reEntry.doseModes.rest.desc}</span>
          </span>
        </motion.div>
      )}
    </div>
  );
}
