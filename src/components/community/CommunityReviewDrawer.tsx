'use client';

import React, { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useRoutine } from '../../contexts/RoutineContext';
import { MOTION } from '../../data/config';
import { COPY } from '../../data/copy';
import { useDialogA11y } from '../../hooks/useDialogA11y';
import { PillButton } from '../ui/PillButton';
import { Spinner } from '../feedback/Spinner';
import type { ReviewOutcome } from '../../types/routine';
import { cn } from '../../utils/cn';

interface CommunityReviewDrawerProps {
  open?: boolean;
  onClose?: () => void;
}

export function CommunityReviewDrawer({ open, onClose }: CommunityReviewDrawerProps = {}) {
  const {
    routine,
    protocol = routine,
    adherenceRate,
    isReviewDrawerOpen,
    closeReviewDrawer,
    submitCommunityReview
  } = useRoutine();

  const isOpen = open ?? isReviewDrawerOpen;
  const handleClose = onClose ?? closeReviewDrawer;

  const panelRef = useRef<HTMLDivElement>(null);
  useDialogA11y(panelRef, { open: isOpen, onClose: handleClose });

  const [outcome, setOutcome] = useState<ReviewOutcome>('improved');
  const [day, setDay] = useState<number>(protocol?.currentDay || 1);
  const [adherence, setAdherence] = useState<number>(adherenceRate || 100);
  const [handle, setHandle] = useState('');
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await submitCommunityReview({
        outcome,
        day,
        adherence,
        handle: handle.trim() || undefined,
        text: text.trim()
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
      active: 'bg-mint text-ink font-semibold border-ink',
      border: 'border-ink/20 hover:border-ink/40'
    },
    adjusted: {
      active: 'bg-cream text-ink font-semibold border-ink',
      border: 'border-ink/20 hover:border-ink/40'
    },
    paused: {
      active: 'bg-blush text-ink font-semibold border-ink',
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
            aria-label={COPY.community.shareModalTitle}
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
                  <span className="text-xs uppercase tracking-wider text-ink/40 font-mono">
                    {COPY.community.shareModalEyebrow}
                  </span>
                  <h2 className="text-lg font-medium text-ink mt-0.5">
                    {COPY.community.shareModalTitle}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={handleClose}
                  className="rounded-full p-1 text-ink/40 hover:bg-ink/5 hover:text-ink transition-colors"
                  aria-label={COPY.community.cancel}
                >
                  ✕
                </button>
              </div>

              {protocol && (
                <div className="mt-3 rounded-tile bg-canvas p-3 text-xs border border-ink/10">
                  <span className="font-semibold text-ink">{protocol.title}</span>
                  {protocol.paper?.doi && (
                    <span className="ml-2 text-ink/50 font-mono">
                      · {protocol.paper.doi}
                    </span>
                  )}
                </div>
              )}

              <div className="mt-4 space-y-4">
                {/* Clinical Outcome Selection */}
                <div>
                  <label className="block text-xs font-medium text-ink mb-1.5">
                    {COPY.community.outcomeLabel}
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['improved', 'adjusted', 'paused'] as ReviewOutcome[]).map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setOutcome(opt)}
                        className={cn(
                          'rounded-tile border py-2 px-2.5 text-xs text-center transition-all',
                          outcome === opt
                            ? outcomeColors[opt].active
                            : `bg-white text-ink/70 ${outcomeColors[opt].border}`
                        )}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Day & Adherence Inputs */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-ink mb-1">
                      {COPY.community.dayLabel}
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={protocol?.totalDays || 180}
                      value={day}
                      onChange={(e) => setDay(Number(e.target.value))}
                      className="w-full rounded-tile border border-ink/20 bg-white px-3 py-1.5 text-xs text-ink focus:border-ink focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-ink mb-1">
                      {COPY.community.adherenceLabel} (%)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={adherence}
                      onChange={(e) => setAdherence(Number(e.target.value))}
                      className="w-full rounded-tile border border-ink/20 bg-white px-3 py-1.5 text-xs text-ink focus:border-ink focus:outline-none"
                    />
                  </div>
                </div>

                {/* Demographic Handle */}
                <div>
                  <label className="block text-xs font-medium text-ink mb-1">
                    {COPY.community.handleLabel}
                  </label>
                  <input
                    type="text"
                    placeholder={COPY.community.handlePlaceholder}
                    value={handle}
                    onChange={(e) => setHandle(e.target.value)}
                    maxLength={50}
                    className="w-full rounded-tile border border-ink/20 bg-white px-3 py-1.5 text-xs text-ink placeholder:text-ink/30 focus:border-ink focus:outline-none"
                  />
                </div>

                {/* Experience & Observations Text */}
                <div>
                  <label className="block text-xs font-medium text-ink mb-1">
                    {COPY.community.notesLabel}
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder={COPY.community.notesPlaceholder}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    maxLength={300}
                    className="w-full rounded-tile border border-ink/20 bg-white p-3 text-xs leading-relaxed text-ink placeholder:text-ink/30 focus:border-ink focus:outline-none resize-none"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-5 flex items-center justify-end gap-2.5 pt-3 border-t border-ink/10">
                <PillButton type="button" size="sm" variant="outline" onClick={handleClose}>
                  {COPY.community.cancel}
                </PillButton>
                <PillButton
                  type="submit"
                  size="sm"
                  disabled={!text.trim() || isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-1.5">
                      <Spinner className="h-3 w-3" />
                      {COPY.community.submitting}
                    </span>
                  ) : (
                    COPY.community.submitReview
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
