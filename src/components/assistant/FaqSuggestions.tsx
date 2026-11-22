'use client';

import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import CheckIcon from '@mui/icons-material/Check';
import type { PaperFaq } from '../../types/routine';
import { Icon } from '../ui/Icon';

import { useLocale } from '../../contexts/LocaleContext';
interface FaqSuggestionsProps {
  suggestions?: readonly string[] | string[];
  faqs?: PaperFaq[];
  onSelect: (question: string) => void;
  disabled?: boolean;
  isMultiSelect?: boolean;
  selected?: readonly string[] | string[];
  onToggle?: (item: string) => void;
  onConfirm?: () => void;
  confirmLabel?: string;
  isNoneOption?: (item: string) => boolean;
  isPrimaryOption?: (item: string) => boolean;
}

export function FaqSuggestions({
  suggestions,
  faqs,
  onSelect,
  disabled = false,
  isMultiSelect = false,
  selected = [],
  onToggle,
  onConfirm,
  confirmLabel,
  isNoneOption,
  isPrimaryOption
}: FaqSuggestionsProps) {
  const { copy } = useLocale();
  const items = suggestions ?? (faqs || []).map((f) => f.question);
  if (items.length === 0) return null;

  const hasSelections = isMultiSelect && selected.length > 0;

  return (
    <div
      role="group"
      aria-label={copy.assistant.suggestionsLabel}
      className={`flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar transition-opacity ${
        disabled ? 'opacity-50 pointer-events-none' : 'opacity-100'
      }`}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        {hasSelections && onConfirm && (
          <motion.button
            key="__multiselect_confirm__"
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ duration: 0.15 }}
            type="button"
            disabled={disabled}
            onClick={onConfirm}
            className="sticky left-0 rtl:right-0 rtl:left-auto z-10 shrink-0 inline-flex items-center gap-1.5 rounded-full border border-ink bg-ink px-3.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-ink/85 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink cursor-pointer shadow-md"
          >
            <Icon icon={CheckIcon} size="xs" className="text-mint" />
            <span>{confirmLabel || `Continue (${selected.length})`}</span>
          </motion.button>
        )}

        {items.map((question) => {
          const isSelected = isMultiSelect && selected.includes(question);
          const isNone = Boolean(isNoneOption?.(question));
          const isPrimary = Boolean(isPrimaryOption?.(question));

          const handleClick = () => {
            if (disabled) return;
            if (isMultiSelect && !isNone && onToggle) {
              onToggle(question);
            } else {
              onSelect(question);
            }
          };

          return (
            <motion.button
              key={question}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.15 }}
              type="button"
              disabled={disabled}
              onClick={handleClick}
              aria-pressed={isMultiSelect && !isNone ? isSelected : undefined}
              className={`shrink-0 inline-flex items-center gap-1.5 rounded-full text-xs transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-ink cursor-pointer ${
                isSelected
                  ? 'border border-mint-dark/50 bg-mint/45 px-3.5 py-1.5 font-medium text-ink shadow-2xs hover:bg-mint/60'
                  : isPrimary
                  ? 'border border-mint bg-mint/50 px-4 py-1.5 font-semibold text-ink shadow-2xs hover:bg-mint/75'
                  : 'border border-ink/20 bg-white px-3.5 py-1.5 text-ink/80 hover:border-ink hover:text-ink'
              }`}
            >
              {isSelected && <Icon icon={CheckIcon} size="xs" className="text-ink" />}
              <span>{question}</span>
            </motion.button>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
