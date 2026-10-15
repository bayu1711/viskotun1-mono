'use client';

import React, { useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useProtocol } from '../../contexts/ProtocolContext';
import { MOTION } from '../../data/config';
import { COPY } from '../../data/copy';
import { useDialogA11y } from '../../hooks/useDialogA11y';
import { PainLogForm } from './PainLogForm';

interface PainLogDrawerProps {
  open?: boolean;
  onClose?: () => void;
}

export function PainLogDrawer({ open, onClose }: PainLogDrawerProps = {}) {
  const protocol = useProtocol();
  const isOpen = open ?? protocol.isPainLogOpen;
  const handleClose = onClose ?? protocol.closePainLog;

  const panelRef = useRef<HTMLDivElement>(null);
  useDialogA11y(panelRef, { open: isOpen, onClose: handleClose });

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-dialog flex items-end justify-center sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-ink/40" onClick={handleClose} aria-hidden="true" />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={COPY.painDrawer.metricDialogLabel(protocol.feedbackMetric?.name)}
            tabIndex={-1}
            initial={{ y: MOTION.dialogOffsetY, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: MOTION.dialogOffsetY, opacity: 0 }}
            transition={MOTION.dialogSpring}
            className="relative w-full max-w-md overflow-hidden rounded-t-sheet bg-white font-sans text-ink focus:outline-none sm:rounded-sheet"
          >
            <PainLogForm onClose={handleClose} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}