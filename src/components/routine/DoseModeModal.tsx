'use client';

import React, { useId, useMemo, useRef } from 'react';
import BoltOutlinedIcon from '@mui/icons-material/BoltOutlined';
import CloseIcon from '@mui/icons-material/Close';
import FitnessCenterOutlinedIcon from '@mui/icons-material/FitnessCenterOutlined';
import HelpOutlineOutlinedIcon from '@mui/icons-material/HelpOutlineOutlined';
import SpaOutlinedIcon from '@mui/icons-material/SpaOutlined';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import { AnimatePresence, motion } from 'framer-motion';
import { useLocale } from '../../contexts/LocaleContext';
import { useRoutine } from '../../contexts/RoutineContext';
import { MOTION } from '../../data/config';
import { useDialogA11y } from '../../hooks/useDialogA11y';
import type { DoseMode } from '../../types/routine';
import { cn } from '../../utils/cn';
import { CircleButton } from '../ui/CircleButton';
import { Icon } from '../ui/Icon';

interface DoseOption {
  id: DoseMode;
  label: string;
  description: string;
  icon: typeof BoltOutlinedIcon;
  badge?: string;
  iconColor?: string;
}

export function DoseModeModal() {
  const {
    isDoseModeModalOpen,
    closeDoseModeModal,
    doseMode,
    setDoseMode,
    openReEntryModal,
    pendingReEntryCheckin,
    activeAdaptation
  } = useRoutine();
  const { copy, locale, isRtl } = useLocale();

  const titleId = useId();
  const descId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useDialogA11y(panelRef, { open: isDoseModeModalOpen, onClose: closeDoseModeModal });

  const options: DoseOption[] = useMemo(
    () => [
      {
        id: 'standard',
        label: copy.doseMode.standard,
        description:
          locale === 'ar'
            ? 'الجرعة الكاملة: إنجاز جميع المجموعات والبروتوكولات المقررة (100% من الحجم المستهدف).'
            : 'Full prescribed volume: complete all target sets and interventional protocols.',
        icon: FitnessCenterOutlinedIcon,
        iconColor: 'text-ink'
      },
      {
        id: 'micro',
        label: copy.doseMode.micro,
        description:
          locale === 'ar'
            ? 'الحد الأدنى الفعال: مجموعة واحدة لكل خطوة لحماية وتيرة الالتزام ومنع الانقطاع.'
            : 'Minimum effective dose: 1 set per step preserves your habit loop and daily streak.',
        icon: BoltOutlinedIcon,
        iconColor: 'text-amber-600',
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
        description:
          locale === 'ar'
            ? 'استراحة إيجابية: تسجيل الاستشفاء والترطيب دون التأثير سلباً على سجل التزامك.'
            : 'Scheduled recovery: log rest and hydration without breaking adherence streaks.',
        icon: SpaOutlinedIcon,
        iconColor: 'text-emerald-700',
        ...(activeAdaptation?.recommendedDoseMode === 'rest'
          ? { badge: locale === 'ar' ? 'موصى به' : 'Recommended' }
          : {})
      }
    ],
    [copy, locale, activeAdaptation?.recommendedDoseMode]
  );

  const handleSelectMode = (mode: DoseMode) => {
    setDoseMode(mode);
  };

  const handleOpenReEntry = () => {
    closeDoseModeModal();
    openReEntryModal();
  };

  return (
    <AnimatePresence>
      {isDoseModeModalOpen && (
        <motion.div
          className="fixed inset-0 z-modal flex items-center justify-center p-3 sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={MOTION.fade}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
            onClick={closeDoseModeModal}
            aria-hidden="true"
          />

          {/* Modal Card */}
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descId}
            dir={isRtl ? 'rtl' : 'ltr'}
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={MOTION.dialogSpring}
            className="relative w-full max-w-md rounded-card border border-ink/20 bg-canvas p-5 sm:p-6 shadow-popover"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-2xs font-semibold uppercase tracking-wider text-ink/60">
                  {locale === 'ar' ? 'وتيرة الإنجاز والالتزام' : 'Daily Habit Pacing'}
                </span>
                <h2 id={titleId} className="font-serif text-lg font-bold text-ink">
                  {copy.doseMode.modalTitle || copy.doseMode.label}
                </h2>
              </div>
              <CircleButton label={locale === 'ar' ? 'إغلاق' : 'Close'} onClick={closeDoseModeModal}>
                <Icon icon={CloseIcon} size="sm" />
              </CircleButton>
            </div>

            <p id={descId} className="mt-2 text-xs leading-relaxed text-ink/75">
              {copy.doseMode.modalSubtitle}
            </p>

            {/* Dose Options Stack */}
            <div className="mt-4 space-y-2.5">
              {options.map((opt) => {
                const isSelected = doseMode === opt.id;
                const IconComp = opt.icon;

                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleSelectMode(opt.id)}
                    className={cn(
                      'flex w-full items-start gap-3 rounded-xl border p-3.5 text-left transition-all cursor-pointer',
                      isRtl && 'text-right',
                      isSelected
                        ? 'border-ink bg-white shadow-sm ring-1 ring-ink/10'
                        : 'border-ink/10 bg-white/60 hover:border-ink/30 hover:bg-white'
                    )}
                  >
                    <div className="mt-0.5 shrink-0">
                      <Icon
                        icon={isSelected ? CheckCircleIcon : RadioButtonUncheckedIcon}
                        size="sm"
                        className={isSelected ? 'text-ink' : 'text-ink/30'}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Icon icon={IconComp} size="xs" className={opt.iconColor} />
                        <span className="text-sm font-semibold text-ink">{opt.label}</span>
                        {opt.badge && (
                          <span className="rounded bg-mint/50 px-1.5 py-0.2 text-3xs font-semibold text-ink">
                            {opt.badge}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-2xs leading-normal text-ink/70">
                        {opt.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Contextual Notice */}
            {doseMode === 'micro' && (
              <div className="mt-3.5 rounded-xl border border-mint/60 bg-mint/25 p-3 text-2xs text-ink/90 flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 font-medium">
                  <Icon icon={BoltOutlinedIcon} size="xs" className="shrink-0 text-amber-600" />
                  <span>{copy.doseMode.microNotice}</span>
                </span>
                <span className="shrink-0 text-3xs text-ink/60 font-semibold">
                  {locale === 'ar' ? 'حماية الوتيرة' : 'Habit loop protected'}
                </span>
              </div>
            )}

            {doseMode === 'rest' && (
              <div className="mt-3.5 rounded-xl border border-sky/50 bg-sky/25 p-3 text-2xs text-ink/90 flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 font-medium">
                  <Icon icon={SpaOutlinedIcon} size="xs" className="shrink-0 text-emerald-700" />
                  <span>{copy.reEntry.doseModes.rest.desc}</span>
                </span>
              </div>
            )}

            {/* Life Disrupted Re-Entry Banner */}
            <div className="mt-4 flex items-center justify-between border-t border-ink/10 pt-3.5">
              <button
                type="button"
                onClick={handleOpenReEntry}
                className={cn(
                  'inline-flex items-center gap-1.5 text-xs transition-colors cursor-pointer',
                  pendingReEntryCheckin
                    ? 'rounded-full bg-mint/50 px-3 py-1 font-semibold text-ink hover:bg-mint'
                    : 'font-medium text-ink/70 hover:text-ink underline decoration-dotted'
                )}
              >
                <Icon icon={HelpOutlineOutlinedIcon} size="xs" />
                <span>{copy.doseMode.reEntryPrompt}</span>
                {pendingReEntryCheckin && (
                  <span className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
                )}
              </button>

              <button
                type="button"
                onClick={closeDoseModeModal}
                className="rounded-full bg-ink px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-ink/90 cursor-pointer"
              >
                {locale === 'ar' ? 'تم' : 'Done'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
