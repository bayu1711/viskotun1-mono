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
              selected ? 'bg-ink text-white' : 'border border-ink/20 text-ink/55 hover:border-ink'
            )}>
            
            {option.label}
          </button>);

      })}
    </div>);

}