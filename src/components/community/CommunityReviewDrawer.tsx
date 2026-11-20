'use client';

import React, { useId, useRef, useState } from 'react';
import CloseIcon from '@mui/icons-material/Close';
import { AnimatePresence, motion } from 'framer-motion';
import { useRoutine } from '../../contexts/RoutineContext';
import { MOTION } from '../../data/config';
import { useDialogA11y } from '../../hooks/useDialogA11y';
import { Icon } from '../ui/Icon';
import { PillButton } from '../ui/PillButton';
import { Spinner } from '../feedback/Spinner';
import type { ReviewOutcome } from '../../types/routine';
import { cn } from '../../utils/cn';
import { deriveLifestyleCohort } from '../../utils/profile';

import { useLocale } from '../../contexts/LocaleContext';
interface CommunityReviewDrawerProps {
  open?: boolean;
  onClose?: () => void;
}

export function CommunityReviewDrawer({ open, onClose }: CommunityReviewDrawerProps = {}) {
  const { copy } = useLocale();
  const {
    routine,
    adherenceRate,
    isReviewDrawerOpen,
    closeReviewDrawer,
    submitCommunityReview,
    lifestyleProfile
  } = useRoutine();
  const currentRoutine = routine;

  const isOpen = open ?? isReviewDrawerOpen;
  const handleClose = onClose ?? closeReviewDrawer;

  const panelRef = useRef<HTMLDivElement>(null);
  const fieldId = useId();
  useDialogA11y(panelRef, { open: isOpen, onClose: handleClose });

  const [outcome, setOutcome] = useState<ReviewOutcome>('improved');
  const [day, setDay] = useState<number>(currentRoutine?.currentDay || 1);
  const [adherence, setAdherence] = useState<number>(adherenceRate || 100);
  const [handle, setHandle] = useState('');
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const lifestyleCohort = deriveLifestyleCohort(lifestyleProfile);

      await submitCommunityReview({
        outcome,
        day,
        adherence,
        handle: handle.trim() || undefined,
        text: text.trim(),
        lifestyleCohort,
        tags: lifestyleProfile?.activeTags || []
      });
      // Reset form
      setText('');
      setHandle('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const outcomeColors: Record<ReviewOutcome, { active: string; border: string }> = {
    improved: {
      active: 'bg-mint text-ink font-semibold border-mint ring-2 ring-mint/40 shadow-2xs',
      border: 'border-ink/20 hover:border-ink/40'
    },
    adjusted: {
      active: 'bg-yellow text-ink font-semibold border-yellow ring-2 ring-yellow/40 shadow-2xs',
      border: 'border-ink/20 hover:border-ink/40'
    },
    paused: {
      active: 'bg-peach text-ink font-semibold border-peach ring-2 ring-peach/40 shadow-2xs',
      border: 'border-ink/20 hover:border-ink/40'
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-dialog flex items-end justify-center sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-ink/40 backdrop-blur-xs" onClick={handleClose} aria-hidden="true" />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={copy.community.shareModalTitle}
            tabIndex={-1}
            initial={{ y: MOTION.dialogOffsetY, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: MOTION.dialogOffsetY, opacity: 0 }}
            transition={MOTION.dialogSpring}
            className="relative w-full max-w-lg overflow-hidden rounded-t-sheet bg-white font-sans text-ink focus:outline-none sm:rounded-sheet shadow-2xl"
          >
            <form onSubmit={handleSubmit} className="p-6">
              <div className="flex items-start justify-between border-b border-ink/10 pb-4">
                <div>
                  <span className="text-xs uppercase tracking-wider text-ink/60 font-mono">
                    {copy.community.shareModalEyebrow}
                  </span>
                  <h2 className="text-lg font-medium text-ink mt-0.5">
                    {copy.community.shareModalTitle}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={handleClose}
                  className="relative rounded-full p-1 text-ink/70 hover:bg-ink/5 hover:text-ink transition-colors before:absolute before:-inset-2.5"
                  aria-label={copy.community.cancel}
                >
                  <Icon icon={CloseIcon} size="sm" />
                </button>
              </div>

              {currentRoutine && (
                <div className="mt-3 rounded-tile bg-canvas p-3 text-xs border border-ink/10">
                  <span className="font-semibold text-ink">{currentRoutine.title}</span>
                  {currentRoutine.paper?.doi && (
                    <span className="ms-2 text-ink/60 font-mono">
                      · {currentRoutine.paper.doi}
                    </span>
                  )}
                </div>
              )}

              <div className="mt-4 space-y-4">
                {/* Clinical Outcome Selection */}
                <div>
                  <p id={`${fieldId}-outcome`} className="block text-xs font-medium text-ink mb-1.5">
                    {copy.community.outcomeLabel}
                  </p>
                  <div role="group" aria-labelledby={`${fieldId}-outcome`} className="grid grid-cols-3 gap-2">
                    {(['improved', 'adjusted', 'paused'] as ReviewOutcome[]).map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setOutcome(opt)}
                        aria-pressed={outcome === opt}
                        className={cn(
                          'min-h-10 rounded-tile border py-2 px-2.5 text-xs text-center transition-colors coarse:min-h-11',
                          outcome === opt
                            ? outcomeColors[opt].active
                            : `bg-white text-ink/70 ${outcomeColors[opt].border}`
                        )}
                      >
                        {copy.community.filters[opt]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Day & Adherence Inputs */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor={`${fieldId}-day`} className="block text-xs font-medium text-ink mb-1">
                      {copy.community.dayLabel}
                    </label>
                    <input
                      id={`${fieldId}-day`}
                      type="number"
                      min={1}
                      max={currentRoutine?.totalDays || 180}
                      value={day}
                      onChange={(e) => setDay(Number(e.target.value))}
                      className="w-full rounded-tile border border-ink/20 bg-white px-3 py-2 text-sm text-ink focus:border-ink focus:outline-none"
                    />
                  </div>
                  <div>
                    <label htmlFor={`${fieldId}-adherence`} className="block text-xs font-medium text-ink mb-1">
                      {copy.community.adherenceLabel} (%)
                    </label>
                    <input
                      id={`${fieldId}-adherence`}
                      type="number"
                      min={0}
                      max={100}
                      value={adherence}
                      onChange={(e) => setAdherence(Number(e.target.value))}
                      className="w-full rounded-tile border border-ink/20 bg-white px-3 py-2 text-sm text-ink focus:border-ink focus:outline-none"
                    />
                  </div>
                </div>

                {/* Demographic Handle */}
                <div>
                  <label htmlFor={`${fieldId}-handle`} className="block text-xs font-medium text-ink mb-1">
                    {copy.community.handleLabel}
                  </label>
                  <input
                    id={`${fieldId}-handle`}
                    type="text"
                    placeholder={copy.community.handlePlaceholder}
                    value={handle}
                    onChange={(e) => setHandle(e.target.value)}
                    maxLength={50}
                    className="w-full rounded-tile border border-ink/20 bg-white px-3 py-2 text-sm text-ink placeholder:text-ink/60 focus:border-ink focus:outline-none"
                  />
                </div>

                {/* Experience & Observations Text */}
                <div>
                  <label htmlFor={`${fieldId}-notes`} className="block text-xs font-medium text-ink mb-1">
                    {copy.community.notesLabel}
                  </label>
                  <textarea
                    id={`${fieldId}-notes`}
                    rows={3}
                    required
                    placeholder={copy.community.notesPlaceholder}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    maxLength={300}
                    className="w-full rounded-tile border border-ink/20 bg-white p-3 text-xs leading-relaxed text-ink placeholder:text-ink/60 focus:border-ink focus:outline-none resize-none"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-5 flex items-center justify-end gap-2.5 pt-3 border-t border-ink/10">
                <PillButton type="button" size="sm" variant="outline" onClick={handleClose}>
                  {copy.community.cancel}
                </PillButton>
                <PillButton
                  type="submit"
                  size="sm"
                  disabled={!text.trim() || isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-1.5">
                      <Spinner className="h-3 w-3" />
                      {copy.community.submitting}
                    </span>
                  ) : (
                    copy.community.submitReview
                  )}
                </PillButton>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
