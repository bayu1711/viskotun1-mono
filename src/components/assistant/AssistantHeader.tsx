'use client';

import React, { useEffect, useRef, useState } from 'react';
import CloseIcon from '@mui/icons-material/Close';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import { AnimatePresence, motion } from 'framer-motion';
import type { AssistantMode } from '../../contexts/AssistantContext';
import type { AIEngineType } from '../../types/routine';
import { CircleButton } from '../ui/CircleButton';
import { Icon } from '../ui/Icon';
import { useLocale } from '../../contexts/LocaleContext';

interface AssistantHeaderProps {
  mode?: AssistantMode;
  routineTitle?: string;
  titleId: string;
  onModeChange?: (mode: AssistantMode) => void;
  onClose: () => void;
  customTitle?: string;
  customEyebrow?: string;
  /** Engine that produced the latest answer. */
  lastEngine?: AIEngineType;
}

export function AssistantHeader({
  routineTitle,
  titleId,
  onClose,
  customTitle,
  customEyebrow
}: AssistantHeaderProps) {
  const { copy } = useLocale();
  const displayTitle = routineTitle || '';
  const [isDisclaimerOpen, setIsDisclaimerOpen] = useState<boolean>(false);
  const disclaimerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isDisclaimerOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsDisclaimerOpen(false);
    };
    const handleClickOutside = (e: MouseEvent) => {
      if (disclaimerRef.current && !disclaimerRef.current.contains(e.target as Node)) {
        setIsDisclaimerOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDisclaimerOpen]);

  return (
    <header className="shrink-0 px-5 pt-4 pb-3 border-b border-ink/10">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <CircleButton label={copy.assistant.close} onClick={onClose}>
            <Icon icon={CloseIcon} size="md" />
          </CircleButton>
          <div className="min-w-0">
            <p className="truncate text-2xs font-medium uppercase tracking-wider text-ink/50">
              {customEyebrow || (displayTitle ? copy.assistant.unifiedEyebrowWithRoutine : copy.assistant.unifiedEyebrowNoRoutine)}
            </p>
            <h2 id={titleId} className="truncate text-sm sm:text-base font-semibold text-ink leading-tight">
              {customTitle || (displayTitle || copy.assistant.titleAsk)}
            </h2>
          </div>
        </div>

        <div ref={disclaimerRef} className="relative flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setIsDisclaimerOpen((prev) => !prev)}
            className="inline-flex items-center gap-1 rounded-full border border-ink/10 bg-cream/70 hover:bg-cream px-2 py-0.5 text-3xs font-medium text-ink transition-colors focus:outline-none focus:ring-1 focus:ring-ink cursor-pointer"
            title={copy.safety.clinicalDisclaimer}
            aria-expanded={isDisclaimerOpen}
            aria-haspopup="dialog"
            aria-label={copy.assistant.medicalDisclaimerChip}
          >
            <Icon icon={ShieldOutlinedIcon} size="xs" className="text-ink/60" />
            <span>{copy.assistant.medicalDisclaimerChip}</span>
          </button>

          <AnimatePresence>
            {isDisclaimerOpen && (
              <motion.div
                initial={{ opacity: 0, y: -4, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.96 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                className="absolute end-0 top-full mt-2 z-popover w-72 sm:w-80 rounded-card bg-white p-3.5 shadow-lg text-start"
                role="dialog"
                aria-label={copy.assistant.medicalDisclaimerChip}
              >
                <div className="flex items-start justify-between gap-2 pb-1.5 border-b border-ink/5">
                  <div className="flex items-center gap-1.5">
                    <Icon icon={ShieldOutlinedIcon} size="xs" className="text-ink/70" />
                    <h4 className="text-xs font-semibold text-ink">
                      {copy.assistant.medicalDisclaimerTitle}
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsDisclaimerOpen(false)}
                    className="text-ink/60 hover:text-ink transition-colors p-0.5 rounded cursor-pointer"
                    aria-label={copy.assistant.closeDisclaimer}
                  >
                    <Icon icon={CloseIcon} size="xs" />
                  </button>
                </div>
                <p className="mt-2 text-2xs leading-relaxed text-ink/75">
                  {copy.safety.clinicalDisclaimer}
                </p>
                <div className="mt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setIsDisclaimerOpen(false)}
                    className="rounded-full bg-ink px-3 py-1 text-3xs font-medium text-white transition-opacity hover:opacity-90 cursor-pointer"
                  >
                    {copy.assistant.medicalDisclaimerGotIt}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
