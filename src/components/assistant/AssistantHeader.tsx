'use client';

import React, { useEffect, useRef, useState } from 'react';
import CloseIcon from '@mui/icons-material/Close';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import { AnimatePresence, motion } from 'framer-motion';
import type { AssistantMode } from '../../contexts/AssistantContext';
import { COPY } from '../../data/copy';
import type { AIEngineType } from '../../types/routine';
import { isEdgeGemmaAvailable } from '../../utils/edgeGemma';
import { CircleButton } from '../ui/CircleButton';
import { Icon } from '../ui/Icon';
import { SegmentedTabs } from '../ui/SegmentedTabs';

const ENGINE_LABELS: Record<AIEngineType, string> = {
  'on-device-gemma': COPY.assistant.engines.onDeviceGemma,
  'server-gemma': COPY.assistant.engines.serverGemma,
  'cloud-gemini': COPY.assistant.engines.cloudGemini,
  'local-rules': COPY.assistant.engines.localRules
};

const MODE_OPTIONS: { id: AssistantMode; label: string }[] = [
  { id: 'ask', label: COPY.assistant.modes.ask },
  { id: 'upload', label: COPY.assistant.modes.upload }
];

interface AssistantHeaderProps {
  mode: AssistantMode;
  protocolTitle: string;
  titleId: string;
  onModeChange: (mode: AssistantMode) => void;
  onClose: () => void;
  customTitle?: string;
  customEyebrow?: string;
  /** Engine that produced the latest answer, so the badge reflects what actually responded. */
  lastEngine?: AIEngineType;
}

export function AssistantHeader({
  mode,
  protocolTitle,
  titleId,
  onModeChange,
  onClose,
  customTitle,
  customEyebrow,
  lastEngine
}: AssistantHeaderProps) {
  const isAsk = mode === 'ask';
  const [isEdgeAvailable, setIsEdgeAvailable] = useState<boolean>(false);
  const [isDisclaimerOpen, setIsDisclaimerOpen] = useState<boolean>(false);
  const disclaimerRef = useRef<HTMLDivElement>(null);
  const engine = lastEngine ?? (isEdgeAvailable ? 'on-device-gemma' : undefined);

  useEffect(() => {
    let active = true;
    isEdgeGemmaAvailable().then((avail) => {
      if (active) setIsEdgeAvailable(avail);
    });
    return () => {
      active = false;
    };
  }, []);

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
    <header className="shrink-0 px-5 pt-5">
      <div className="flex items-center justify-between gap-3 border-b border-ink pb-4">
        <CircleButton label={COPY.assistant.close} onClick={onClose}>
          <Icon icon={CloseIcon} size="md" />
        </CircleButton>
        <SegmentedTabs
          options={MODE_OPTIONS}
          value={mode}
          onChange={onModeChange}
          ariaLabel={COPY.assistant.modeLabel}
        />
        <span className="w-10" aria-hidden="true" />
      </div>
      <div className="pt-4">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm leading-none text-ink/45">
            {customEyebrow || (isAsk ? protocolTitle : COPY.assistant.eyebrowUpload)}
          </p>
          <div ref={disclaimerRef} className="relative flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setIsDisclaimerOpen((prev) => !prev)}
              className="inline-flex items-center gap-1 rounded-full border border-ink/10 bg-cream/70 hover:bg-cream px-2 py-0.5 text-3xs font-medium text-ink transition-colors focus:outline-none focus:ring-1 focus:ring-ink cursor-pointer"
              title={COPY.safety.clinicalDisclaimer}
              aria-expanded={isDisclaimerOpen}
              aria-haspopup="dialog"
              aria-label={COPY.assistant.medicalDisclaimerChip}
            >
              <Icon icon={ShieldOutlinedIcon} size="xs" className="text-ink/60" />
              <span>{COPY.assistant.medicalDisclaimerChip}</span>
            </button>

            {isAsk && engine && (
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-3xs font-medium ${
                  engine === 'on-device-gemma' ? 'bg-mint text-ink' : 'bg-cream text-ink/80'
                }`}
              >
                {ENGINE_LABELS[engine]}
              </span>
            )}

            <AnimatePresence>
              {isDisclaimerOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -4, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.96 }}
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                  className="absolute right-0 top-full mt-2 z-30 w-72 sm:w-80 rounded-card bg-white p-3.5 shadow-lg border border-ink/10 text-left"
                  role="dialog"
                  aria-label={COPY.assistant.medicalDisclaimerChip}
                >
                  <div className="flex items-start justify-between gap-2 pb-1.5 border-b border-ink/5">
                    <div className="flex items-center gap-1.5">
                      <Icon icon={ShieldOutlinedIcon} size="xs" className="text-ink/70" />
                      <h4 className="text-xs font-semibold text-ink">
                        {COPY.assistant.medicalDisclaimerTitle}
                      </h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsDisclaimerOpen(false)}
                      className="text-ink/40 hover:text-ink transition-colors p-0.5 rounded cursor-pointer"
                      aria-label={COPY.assistant.closeDisclaimer}
                    >
                      <Icon icon={CloseIcon} size="xs" />
                    </button>
                  </div>
                  <p className="mt-2 text-2xs leading-relaxed text-ink/75">
                    {COPY.safety.clinicalDisclaimer}
                  </p>
                  <div className="mt-3 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setIsDisclaimerOpen(false)}
                      className="rounded-full bg-ink px-3 py-1 text-3xs font-medium text-white transition-opacity hover:opacity-90 cursor-pointer"
                    >
                      {COPY.assistant.medicalDisclaimerGotIt}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        <h2 id={titleId} className="mt-1 text-display-sm leading-tight tracking-tight">
          {customTitle || (isAsk ? COPY.assistant.titleAsk : COPY.assistant.titleUpload)}
        </h2>
      </div>
    </header>
  );
}