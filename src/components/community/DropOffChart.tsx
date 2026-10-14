import React from 'react';
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import InsightsOutlinedIcon from '@mui/icons-material/InsightsOutlined';
import { CHART_BAR_RADIUS, CHART_MARGIN, CHART_TICK_FONT_SIZE, DROP_OFF_HIGH_MIN } from '../../data/config';
import { COPY } from '../../data/copy';
import type { DropOffPoint, DropOffUnit } from '../../types/protocol';
import { EmptyState } from '../feedback/EmptyState';
import { DropOffTooltip } from './DropOffTooltip';

interface DropOffChartProps {
  data: DropOffPoint[];
  peakPeriod: number;
  unit: DropOffUnit;
}

export function DropOffChart({ data, peakPeriod, unit }: DropOffChartProps) {
  if (data.length === 0) {
    return <EmptyState className="mt-5" icon={InsightsOutlinedIcon} title={COPY.community.emptyChart} />;
  }

  return (
    <div className="mt-5 h-44 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={CHART_MARGIN}>
          <XAxis
            dataKey="period"
            tickLine={false}
            axisLine={false}
            interval={0}
            tick={{ className: 'fill-ink/40', fontSize: CHART_TICK_FONT_SIZE }} />
          
          <Tooltip cursor={{ className: 'fill-canvas' }} content={<DropOffTooltip unit={unit} />} />
          <Bar dataKey="dropOff" radius={CHART_BAR_RADIUS}>
            {data.map((point) =>
            <Cell key={point.period} className={barClassName(point, peakPeriod)} />
            )}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>);

}

function barClassName(point: DropOffPoint, peakPeriod: number) {
  if (point.period === peakPeriod) return 'fill-ink';
  if (point.dropOff >= DROP_OFF_HIGH_MIN) return 'fill-cream';
  return 'fill-mint';
}