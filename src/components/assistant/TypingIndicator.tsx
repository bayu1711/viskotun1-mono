import React from 'react';
import { motion } from 'framer-motion';
import { MOTION, TYPING_DOT_COUNT } from '../../data/config';
import { COPY } from '../../data/copy';

const DOTS = Array.from({ length: TYPING_DOT_COUNT }, (_, index) => index);

export function TypingIndicator() {
  return (
    <div
      role="status"
      aria-label={COPY.assistant.typing}
      className="flex w-16 items-center justify-center gap-1 rounded-full bg-white py-3">
      
      {DOTS.map((dot) =>
      <motion.span
        key={dot}
        aria-hidden="true"
        className="h-1.5 w-1.5 rounded-full bg-ink/50"
        animate={{ y: [0, MOTION.typingDot.liftPx, 0] }}
        transition={{
          duration: MOTION.typingDot.duration,
          repeat: Infinity,
          delay: dot * MOTION.typingDot.staggerS
        }} />

      )}
    </div>);

}