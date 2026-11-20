import React from 'react';
import type { TooltipProps } from 'recharts';
import type { DropOffUnit } from '../../types/routine';

import { useLocale } from '../../contexts/LocaleContext';
interface DropOffTooltipProps extends TooltipProps<number, string> {
  unit: DropOffUnit;
}

export function DropOffTooltip({ active, payload, label, unit }: DropOffTooltipProps) {
  const { copy } = useLocale();
  const value = payload?.[0]?.value;
  if (!active || value === undefined) return null;

  return (
    <div className="rounded-xl bg-ink px-3 py-2 text-xs text-white">
      <p className="text-white/60">{copy.community.periodLabel(unit, label)}</p>
      <p>{copy.community.dropOffValue(value)}</p>
    </div>);

}