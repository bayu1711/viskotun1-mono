import React from 'react';
import { COPY } from '../../data/copy';
import type { PaperFaq } from '../../types/protocol';

interface FaqSuggestionsProps {
  faqs: PaperFaq[];
  onSelect: (question: string) => void;
}

export function FaqSuggestions({ faqs, onSelect }: FaqSuggestionsProps) {
  if (faqs.length === 0) return null;

  return (
    <div role="group" aria-label={COPY.assistant.suggestionsLabel} className="flex gap-1.5 overflow-x-auto pb-0.5">
      {faqs.map((faq) =>
      <button
        key={faq.question}
        type="button"
        onClick={() => onSelect(faq.question)}
        className="shrink-0 rounded-full border border-ink/20 bg-white px-3.5 py-1.5 text-xs lowercase transition-colors hover:border-ink focus:outline-none focus-visible:border-ink">
        
          {faq.question}
        </button>
      )}
    </div>);

}