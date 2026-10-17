import React from 'react';
import { COPY } from '../../data/copy';
import { cn } from '../../utils/cn';

const LEGEND_ITEMS = [
  { label: COPY.calendar.legend.complete, swatch: 'bg-mint' },
  { label: COPY.calendar.legend.partial, swatch: 'border-2 border-orange border-l-transparent' },
  { label: COPY.calendar.legend.today, swatch: 'bg-orange' }
];


export function CalendarLegend() {
  return (
    <ul className="mt-5 flex flex-wrap gap-4 text-xs text-ink/60">
      {LEGEND_ITEMS.map((item) =>
      <li key={item.label} className="flex items-center gap-1.5">
          <span aria-hidden="true" className={cn('h-3 w-3 rounded-full', item.swatch)} />
          {item.label}
        </li>
      )}
    </ul>);

}