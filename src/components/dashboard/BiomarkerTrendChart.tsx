'use client';

import React, { useId, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import ShowChartOutlinedIcon from '@mui/icons-material/ShowChartOutlined';
import TuneOutlinedIcon from '@mui/icons-material/TuneOutlined';
import { useProtocol } from '../../contexts/ProtocolContext';
import { COPY } from '../../data/copy';
import type { DataCollectionField } from '../../types/protocol';
import { CircleButton } from '../ui/CircleButton';
import { Icon } from '../ui/Icon';
import { Panel } from '../ui/Panel';
import { SectionHeading } from '../ui/SectionHeading';
import type { BiomarkerDataPoint } from './BiomarkerChartContent';

const BiomarkerChartContent = dynamic(
  () => import('./BiomarkerChartContent').then((mod) => mod.BiomarkerChartContent),
  {
    ssr: false,
    loading: () => <div className="mt-4 h-56 w-full animate-pulse rounded-card bg-canvas" />
  }
);

export function BiomarkerTrendChart() {
  const { protocol, morphingLogs, feedbackLogs, currentDay, openFeedbackDrawer } = useProtocol();
  const headingId = useId();

  const trackableFields = useMemo(() => {
    const spec = protocol.dataCollectionSpec || [];
    return spec.filter((f) => f.type === 'scale' || f.type === 'numeric' || f.type === 'timer');
  }, [protocol.dataCollectionSpec]);

  const [selectedFieldId, setSelectedFieldId] = useState<string>(
    () => trackableFields[0]?.id || ''
  );

  const activeField: DataCollectionField | undefined = useMemo(() => {
    return trackableFields.find((f) => f.id === selectedFieldId) || trackableFields[0];
  }, [trackableFields, selectedFieldId]);

  const chartData: BiomarkerDataPoint[] = useMemo(() => {
    if (!activeField) return [];

    // Check actual morphing logs
    const fieldLogs = morphingLogs
      .filter((l) => l.fieldId === activeField.id && typeof l.value === 'number')
      .map((l) => ({ day: l.day, value: Number(l.value) }));

    if (fieldLogs.length >= 2) {
      return fieldLogs.sort((a, b) => a.day - b.day);
    }

    // If activeField is default scale and we have feedbackLogs
    if (activeField.type === 'scale' && feedbackLogs.length > 0) {
      return feedbackLogs.map((log) => ({ day: log.day, value: log.score }));
    }

    // Default simulated progression data based on trial parameters
    const totalPoints = Math.max(currentDay, 7);
    const minVal = activeField.min ?? 0;
    const maxVal = activeField.max ?? 10;
    const points: BiomarkerDataPoint[] = [];

    const isImprovingDown = activeField.name.includes('pain') || activeField.name.includes('irritation');

    for (let day = 1; day <= totalPoints; day++) {
      let val: number;
      if (isImprovingDown) {
        // e.g. Pain starting at 7.5 dropping towards 2
        val = Number((maxVal * 0.75 - ((day - 1) / totalPoints) * (maxVal * 0.5)).toFixed(1));
      } else {
        // e.g. Dorsiflexion starting at 24 rising towards 42
        val = Number((minVal + ((day - 1) / totalPoints) * (maxVal - minVal) * 0.8).toFixed(1));
      }
      points.push({ day, value: Math.max(minVal, Math.min(maxVal, val)) });
    }

    return points;
  }, [activeField, morphingLogs, feedbackLogs, currentDay]);

  if (!activeField) return null;

  // Determine target bounds for reference shading
  let targetMin: number | undefined;
  let targetMax: number | undefined;

  if (activeField.name.includes('pain') || activeField.name.includes('irritation')) {
    targetMin = 0;
    targetMax = activeField.escalationThreshold ?? 3;
  } else if (activeField.name.includes('dorsiflexion') || activeField.name.includes('flexion')) {
    targetMin = 38;
    targetMax = 48;
  } else if (activeField.type === 'timer') {
    targetMin = 200;
    targetMax = 260;
  }

  const latestVal = chartData[chartData.length - 1]?.value ?? activeField.min ?? 0;

  return (
    <Panel aria-labelledby={headingId}>
      <SectionHeading
        id={headingId}
        eyebrow={COPY.morphing.dashboard.biomarkerTitle}
        title={activeField.label}
        action={
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-mint px-2.5 py-1 text-xs font-medium text-ink">
              {COPY.morphing.dashboard.currentReading(latestVal, activeField.unit)}
            </span>
            <CircleButton
              label={COPY.morphing.saveEntry}
              onClick={() => openFeedbackDrawer(activeField.id)}
            >
              <Icon icon={TuneOutlinedIcon} size="md" />
            </CircleButton>
          </div>
        }
      />

      {/* Field switcher if protocol tracks multiple parameters */}
      {trackableFields.length > 1 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {trackableFields.map((field) => {
            const isSelected = field.id === activeField.id;
            return (
              <button
                key={field.id}
                type="button"
                onClick={() => setSelectedFieldId(field.id)}
                className={`rounded-full px-3 py-1 text-xs transition-colors ${
                  isSelected
                    ? 'bg-ink font-medium text-white'
                    : 'bg-canvas text-ink/70 hover:bg-ink/10'
                }`}
              >
                {field.label}
              </button>
            );
          })}
        </div>
      )}

      <BiomarkerChartContent
        data={chartData}
        targetMin={targetMin}
        targetMax={targetMax}
        unit={activeField.unit}
        min={activeField.min}
        max={activeField.max}
      />

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-ink/10 pt-3 text-xs text-ink/60">
        <div className="flex items-center gap-2">
          <span className="inline-block h-3 w-5 rounded bg-[#c8ded1] opacity-70" />
          <span>{COPY.morphing.dashboard.targetZone}</span>
        </div>
        <div className="flex items-center gap-1">
          <Icon icon={ShowChartOutlinedIcon} size="xs" />
          <span>{COPY.morphing.dashboard.biomarkerSubtitle}</span>
        </div>
      </div>
    </Panel>
  );
}
