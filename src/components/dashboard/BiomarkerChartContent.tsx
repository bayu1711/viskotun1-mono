'use client';

import React from 'react';
import {
  Area,
  AreaChart,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { CHART_MARGIN, CHART_TICK_FONT_SIZE } from '../../data/config';
import { COPY } from '../../data/copy';

export interface BiomarkerDataPoint {
  day: number;
  value: number;
}

interface BiomarkerChartContentProps {
  data: BiomarkerDataPoint[];
  targetMin?: number;
  targetMax?: number;
  unit?: string;
  min?: number;
  max?: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: number;
  unit?: string;
}

function CustomTooltip({ active, payload, label, unit }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null;
  const val = payload[0]?.value;

  return (
    <div className="rounded-card border border-ink/15 bg-white p-2.5 shadow-md">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-ink/50">
        {COPY.morphing.dashboard.dayTooltip(Number(label))}
      </p>
      <p className="mt-0.5 text-sm font-medium text-ink">
        {val} {unit || ''}
      </p>
    </div>
  );
}

export function BiomarkerChartContent({
  data,
  targetMin,
  targetMax,
  unit,
  min,
  max
}: BiomarkerChartContentProps) {
  if (data.length === 0) return null;

  return (
    <div className="mt-4 h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={CHART_MARGIN}>
          <defs>
            <linearGradient id="biomarkerGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#486a57" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#486a57" stopOpacity={0.02} />
            </linearGradient>
          </defs>

          <XAxis
            dataKey="day"
            tickLine={false}
            axisLine={false}
            tick={{ className: 'fill-ink/40', fontSize: CHART_TICK_FONT_SIZE }}
            tickFormatter={(day) => `d${day}`}
          />
          <YAxis
            domain={[min ?? 'auto', max ?? 'auto']}
            tickLine={false}
            axisLine={false}
            tick={{ className: 'fill-ink/40', fontSize: CHART_TICK_FONT_SIZE }}
            tickFormatter={(v) => `${v}${unit ? ` ${unit}` : ''}`}
          />

          <Tooltip content={<CustomTooltip unit={unit} />} />

          {/* Target Reference Range Band */}
          {typeof targetMin === 'number' && typeof targetMax === 'number' && (
            <ReferenceArea
              y1={targetMin}
              y2={targetMax}
              fill="#c8ded1"
              fillOpacity={0.35}
              strokeDasharray="4 4"
            />
          )}

          {typeof targetMin === 'number' && typeof targetMax !== 'number' && (
            <ReferenceLine y={targetMin} stroke="#486a57" strokeDasharray="3 3" />
          )}

          <Area
            type="monotone"
            dataKey="value"
            stroke="#2e3a34"
            strokeWidth={2.5}
            fill="url(#biomarkerGrad)"
            activeDot={{ r: 5, fill: '#2e3a34', stroke: '#ffffff', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
