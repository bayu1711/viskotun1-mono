'use client';

import React, { useRef, useState } from 'react';
import CloseIcon from '@mui/icons-material/Close';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined';
import BatteryAlertOutlinedIcon from '@mui/icons-material/BatteryAlertOutlined';
import HealingOutlinedIcon from '@mui/icons-material/HealingOutlined';
import FlightTakeoffOutlinedIcon from '@mui/icons-material/FlightTakeoffOutlined';
import BedtimeOutlinedIcon from '@mui/icons-material/BedtimeOutlined';
import MoreHorizOutlinedIcon from '@mui/icons-material/MoreHorizOutlined';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { AnimatePresence, motion } from 'framer-motion';
import { useRoutine } from '../../contexts/RoutineContext';
import { MOTION } from '../../data/config';
import { COPY } from '../../data/copy';
import { useDialogA11y } from '../../hooks/useDialogA11y';
import type { BarrierType, DoseMode } from '../../types/routine';
import { cn } from '../../utils/cn';
import { CircleButton } from '../ui/CircleButton';
import { Icon } from '../ui/Icon';
import { PillButton } from '../ui/PillButton';

const BARRIER_ICONS: Record<BarrierType, typeof AccessTimeOutlinedIcon> = {
  time_crunch: AccessTimeOutlinedIcon,
  fatigue_energy: BatteryAlertOutlinedIcon,
  discomfort_pain: HealingOutlinedIcon,
  routine_travel: FlightTakeoffOutlinedIcon,
  fasting_deficit: BedtimeOutlinedIcon,
  other: MoreHorizOutlinedIcon
};

export function ReEntryModal() {
  const {
    isReEntryOpen,
    closeReEntryModal,
    dismissReEntryCheckin,
    logBarrier,
    lapseDays
  } = useRoutine();

  const [selectedBarrier, setSelectedBarrier] = useState<BarrierType>('time_crunch');
  const [selectedDose, setSelectedDose] = useState<DoseMode>('micro');
  const [note, setNote] = useState('');
  const panelRef = useRef<HTMLDivElement>(null);

  useDialogA11y(panelRef, { open: isReEntryOpen, onClose: closeReEntryModal });

  const handleConfirm = () => {
    logBarrier(selectedBarrier, selectedDose, note.trim() ? note.trim() : undefined);
  };

  const barrierKeys: BarrierType[] = [
    'time_crunch',
    'fatigue_energy',
    'discomfort_pain',
    'routine_travel',
    'fasting_deficit',
    'other'
  ];

  return (
    <AnimatePresence>
      {isReEntryOpen && (
        <motion.div
          className="fixed inset-0 z-modal flex items-center justify-center p-3 sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
            onClick={closeReEntryModal}
            aria-hidden="true"
          />

          {/* Modal Container */}
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={COPY.reEntry.title}
            tabIndex={-1}
            initial={{ scale: 0.96, opacity: 0, y: MOTION.dialogOffsetY }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: MOTION.dialogOffsetY }}
            transition={MOTION.dialogSpring}
            className="relative flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-sheet bg-canvas font-sans text-ink shadow-float focus:outline-none"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-ink/10 px-6 py-4 bg-white/80 backdrop-blur">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-mint text-ink">
                  <Icon icon={AutoAwesomeOutlinedIcon} size="sm" />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-mint/40 px-1.5 py-0.5 text-3xs font-semibold uppercase tracking-wider text-ink/75">
                      {COPY.reEntry.badge}
                    </span>
                    {lapseDays > 0 && (
                      <span className="text-3xs font-medium text-ink/50">
                        {lapseDays} days elapsed
                      </span>
                    )}
                  </div>
                  <h2 className="text-base font-semibold text-ink leading-tight">
                    {COPY.reEntry.title}
                  </h2>
                </div>
              </div>

              <CircleButton label="Close" onClick={closeReEntryModal} size={36}>
                <Icon icon={CloseIcon} size="sm" />
              </CircleButton>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
              {/* Empathy Introduction */}
              <div className="rounded-xl border border-ink/10 bg-white/60 p-4">
                <p className="text-xs text-ink/80 leading-relaxed">
                  {COPY.reEntry.subtitle(lapseDays)}
                </p>
              </div>

              {/* Step 1: Barrier Detection */}
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  {COPY.reEntry.question}
                </label>
                <p className="text-3xs text-ink/60 mb-3">
                  {COPY.reEntry.barrierHint}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {barrierKeys.map((key) => {
                    const barrier = COPY.reEntry.barriers[key];
                    const isSelected = selectedBarrier === key;
                    const IconComp = BARRIER_ICONS[key];

                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setSelectedBarrier(key)}
                        className={cn(
                          'flex items-start gap-3 rounded-xl border p-3 text-left transition-all',
                          isSelected
                            ? 'border-ink bg-white shadow-sm ring-1 ring-ink'
                            : 'border-ink/10 bg-white/40 hover:bg-white/80'
                        )}
                      >
                        <span
                          className={cn(
                            'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg',
                            isSelected ? 'bg-mint text-ink' : 'bg-ink/5 text-ink/60'
                          )}
                        >
                          <Icon icon={IconComp} size="xs" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-ink leading-snug">
                            {barrier.label}
                          </p>
                          <p className="mt-0.5 text-3xs text-ink/60 line-clamp-2">
                            {barrier.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 2: Adaptive Action / Dose Selection */}
              <div>
                <label className="block text-xs font-semibold text-ink mb-2">
                  {COPY.reEntry.doseModeHeading}
                </label>

                <div className="space-y-2.5">
                  {(['micro', 'standard', 'rest'] as const).map((mode) => {
                    const info = COPY.reEntry.doseModes[mode];
                    const isSelected = selectedDose === mode;

                    return (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setSelectedDose(mode)}
                        className={cn(
                          'flex w-full items-start gap-3.5 rounded-xl border p-3.5 text-left transition-all',
                          isSelected
                            ? 'border-ink bg-white shadow-sm ring-2 ring-ink/80'
                            : 'border-ink/10 bg-white/40 hover:bg-white/80'
                        )}
                      >
                        <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center">
                          {isSelected ? (
                            <Icon icon={CheckCircleIcon} size="sm" className="text-mint-dark" />
                          ) : (
                            <span className="h-4 w-4 rounded-full border border-ink/30" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-ink">{info.title}</span>
                            <span
                              className={cn(
                                'rounded px-1.5 py-0.5 text-3xs font-medium',
                                mode === 'micro'
                                  ? 'bg-mint text-ink font-semibold'
                                  : 'bg-ink/5 text-ink/60'
                              )}
                            >
                              {info.badge}
                            </span>
                          </div>
                          <p className="mt-1 text-3xs text-ink/70 leading-relaxed">{info.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Optional Note */}
              <div>
                <label htmlFor="reentry-note" className="block text-3xs font-medium text-ink/60 mb-1">
                  Optional personal reflection / journal
                </label>
                <input
                  id="reentry-note"
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. Flight delay, felt fatigued after long workday..."
                  className="w-full rounded-lg border border-ink/15 bg-white px-3 py-2 text-xs text-ink placeholder:text-ink/30 focus:border-ink focus:outline-none"
                />
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 border-t border-ink/10 px-6 py-4 bg-white/80 backdrop-blur">
              <button
                type="button"
                onClick={dismissReEntryCheckin}
                className="text-xs font-medium text-ink/60 hover:text-ink transition-colors py-2"
              >
                {COPY.reEntry.dismiss}
              </button>

              <PillButton
                variant="primary"
                onClick={handleConfirm}
                className="w-full sm:w-auto"
              >
                {COPY.reEntry.confirmBarrier}
              </PillButton>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
