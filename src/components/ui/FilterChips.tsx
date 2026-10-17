import React from 'react';
import { cn } from '../../utils/cn';

interface FilterOption<T extends string> {
  id: T;
  label: string;
}

interface FilterChipsProps<T extends string> {
  options: FilterOption<T>[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
  className?: string;
}

/** Horizontally scrolling toggle chips (single select). */
export function FilterChips<T extends string>({ options, value, onChange, ariaLabel, className }: FilterChipsProps<T>) {
  return (
    <div role="group" aria-label={ariaLabel} className={cn('flex gap-1.5 overflow-x-auto pb-1', className)}>
      {options.map((option) => {
        const selected = option.id === value;
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            aria-pressed={selected}
            className={cn(
              'shrink-0 rounded-full px-4 py-1.5 text-xs transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/30',
              selected
                ? 'bg-orange text-white font-medium shadow-2xs'
                : 'border border-ink/15 bg-white text-ink/65 hover:border-ink/40 hover:bg-canvas'
            )}>
            
            {option.label}
          </button>);

      })}
    </div>);

}