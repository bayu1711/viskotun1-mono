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
}

export function SegmentedTabs<T extends string>({ options, value, onChange, ariaLabel }: SegmentedTabsProps<T>) {
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
              'rounded-full px-4 py-1.5 text-xs transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/30',
              selected ? 'bg-ink text-white' : 'text-ink/50 hover:text-ink'
            )}>
            
            {option.label}
          </button>);

      })}
    </div>);

}