'use client';

import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { COPY } from '../../data/copy';
import type { PaperFaq } from '../../types/routine';

interface FaqSuggestionsProps {
  suggestions?: string[];
  faqs?: PaperFaq[];
  onSelect: (question: string) => void;
  disabled?: boolean;
}

export function FaqSuggestions({
  suggestions,
  faqs,
  onSelect,
  disabled = false
}: FaqSuggestionsProps) {
  const items = suggestions ?? (faqs || []).map((f) => f.question);
  if (items.length === 0) return null;

  return (
    <div
      role="group"
      aria-label={COPY.assistant.suggestionsLabel}
      className={`flex gap-1.5 overflow-x-auto pb-0.5 no-scrollbar transition-opacity ${
        disabled ? 'opacity-50 pointer-events-none' : 'opacity-100'
      }`}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        {items.map((question) => (
          <motion.button
            key={question}
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.15 }}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(question)}
            className="shrink-0 rounded-full border border-ink/20 bg-white px-3.5 py-1.5 text-xs text-ink/80 transition-colors hover:border-ink hover:text-ink focus:outline-none focus-visible:border-ink cursor-pointer"
          >
            {question}
          </motion.button>
        ))}
      </AnimatePresence>
    </div>
  );
}