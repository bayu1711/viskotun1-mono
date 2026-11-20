import React from 'react';
import { cn } from '../../utils/cn';

interface TabOption<T extends string> {
  id: T;
  label: string;
}

interface SegmentedTabsProps<T extends string> {
  options: TabOption<T>[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
  variant?: 'segmented' | 'pills';
}

export function SegmentedTabs<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  variant = 'segmented'
}: SegmentedTabsProps<T>) {
  if (variant === 'pills') {
    return (
      <div role="tablist" aria-label={ariaLabel} className="flex flex-wrap items-center gap-2.5">
        {options.map((option) => {
          const selected = option.id === value;
          return (
            <button
              key={option.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => onChange(option.id)}
              className={cn(
                'inline-flex min-h-11 items-center gap-1.5 rounded-full border px-3.5 text-xs transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/30 cursor-pointer',
                selected
                  ? 'border-ink bg-mint font-semibold text-ink'
                  : 'border-ink/20 bg-cream/70 font-medium text-ink hover:border-ink hover:bg-mint'
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div role="tablist" aria-label={ariaLabel} className="flex rounded-full border border-ink/15 bg-white p-1">
      {options.map((option) => {
        const selected = option.id === value;
        return (
          <button
            key={option.id}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(option.id)}
            className={cn(
              'rounded-full px-4 py-1.5 text-xs transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/30 cursor-pointer',
              selected ? 'bg-orange text-ink font-medium shadow-2xs' : 'text-ink/65 hover:text-ink'
            )}>
            
            {option.label}
          </button>);

      })}
    </div>);

}