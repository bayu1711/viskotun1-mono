import React from 'react';
import type { TooltipProps } from 'recharts';
import { COPY } from '../../data/copy';
import type { DropOffUnit } from '../../types/protocol';

interface DropOffTooltipProps extends TooltipProps<number, string> {
  unit: DropOffUnit;
}

export function DropOffTooltip({ active, payload, label, unit }: DropOffTooltipProps) {
  const value = payload?.[0]?.value;
  if (!active || value === undefined) return null;

  return (
    <div className="rounded-xl bg-ink px-3 py-2 text-xs text-white">
      <p className="lowercase text-white/60">{COPY.community.periodLabel(unit, label)}</p>
      <p>{COPY.community.dropOffValue(value)}</p>
    </div>);

}