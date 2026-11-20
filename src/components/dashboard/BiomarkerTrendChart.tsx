'use client';

import React, { useId, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import ShowChartOutlinedIcon from '@mui/icons-material/ShowChartOutlined';
import TuneOutlinedIcon from '@mui/icons-material/TuneOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { useRoutine } from '../../contexts/RoutineContext';
import type { DataCollectionField } from '../../types/routine';
import {
  isFieldScheduledForDay,
  resolveBiomarkerPoints,
  resolveFieldTargetBounds
} from '../../utils/routineMetrics';
import { EmptyState } from '../feedback/EmptyState';
import { CircleButton } from '../ui/CircleButton';
import { Icon } from '../ui/Icon';
import { Panel } from '../ui/Panel';
import { PillButton } from '../ui/PillButton';
import { SectionHeading } from '../ui/SectionHeading';
import type { BiomarkerDataPoint } from './BiomarkerChartContent';

import { useLocale } from '../../contexts/LocaleContext';
const BiomarkerChartContent = dynamic(
  () => import('./BiomarkerChartContent').then((mod) => mod.BiomarkerChartContent),
  {
    ssr: false,
    loading: () => <div className="mt-4 h-56 w-full animate-pulse rounded-card bg-canvas" />
  }
);

export function BiomarkerTrendChart() {
  const { copy } = useLocale();
  const { routine, morphingLogs, feedbackLogs, currentDay, openFeedbackDrawer } = useRoutine();
  const headingId = useId();

  const trackableFields = useMemo(() => {
    const spec = routine.dataCollectionSpec || [];
    return spec.filter((f) => f.type === 'scale' || f.type === 'numeric' || f.type === 'timer');
  }, [routine.dataCollectionSpec]);

  const [selectedFieldId, setSelectedFieldId] = useState<string>(
    () => trackableFields[0]?.id || ''
  );

  const activeField: DataCollectionField | undefined = useMemo(() => {
    return trackableFields.find((f) => f.id === selectedFieldId) || trackableFields[0];
  }, [trackableFields, selectedFieldId]);

  const chartData: BiomarkerDataPoint[] = useMemo(
    () => resolveBiomarkerPoints(activeField, morphingLogs, feedbackLogs),
    [activeField, morphingLogs, feedbackLogs]
  );

  if (!activeField) return null;

  const { targetMin, targetMax } = resolveFieldTargetBounds(activeField);
  const latestPoint = chartData[chartData.length - 1];
  const isScheduledToday = isFieldScheduledForDay(activeField, currentDay);

  return (
    <Panel aria-labelledby={headingId}>
      <SectionHeading
        id={headingId}
        eyebrow={copy.morphing.dashboard.biomarkerTitle}
        title={activeField.label}
        action={
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-mint px-2.5 py-1 text-xs font-medium text-ink">
              {latestPoint
                ? copy.morphing.dashboard.currentReading(latestPoint.value, activeField.unit)
                : copy.morphing.dashboard.noReadingsBadge}
            </span>
            <CircleButton
              label={
                isScheduledToday
                  ? copy.morphing.saveEntry
                  : copy.morphing.dashboard.notScheduledBiomarkerTooltip
              }
              onClick={() => openFeedbackDrawer(activeField.id)}
              disabled={!isScheduledToday}
            >
              <Icon icon={TuneOutlinedIcon} size="md" />
            </CircleButton>
          </div>
        }
      />

      {!isScheduledToday && (
        <div className="mt-3 flex items-start gap-2.5 rounded-tile border border-ink/10 bg-canvas p-3 text-xs text-ink/75">
          <Icon icon={InfoOutlinedIcon} size="sm" className="mt-0.5 shrink-0 text-ink/60" />
          <div className="flex-1 leading-relaxed">
            <span className="font-medium text-ink">
              {copy.morphing.dashboard.notScheduledBadge}:
            </span>{' '}
            {copy.morphing.dashboard.notScheduledBiomarkerNote(activeField.name, currentDay)}
          </div>
        </div>
      )}

      {/* Field switcher if routine tracks multiple parameters */}
      {trackableFields.length > 1 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {trackableFields.map((field) => {
            const isSelected = field.id === activeField.id;
            return (
              <button
                key={field.id}
                type="button"
                onClick={() => setSelectedFieldId(field.id)}
                className={`inline-flex min-h-11 items-center rounded-full px-4 text-xs transition-colors ${
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

      {chartData.length > 0 ? (
        <BiomarkerChartContent
          data={chartData}
          targetMin={targetMin}
          targetMax={targetMax}
          unit={activeField.unit}
          min={activeField.min}
          max={activeField.max}
        />
      ) : (
        <EmptyState
          className="mt-4"
          icon={ShowChartOutlinedIcon}
          title={copy.morphing.dashboard.emptyBiomarkerTitle}
          description={copy.morphing.dashboard.emptyBiomarkerBody(activeField.label)}
          action={
            isScheduledToday ? (
              <PillButton size="sm" onClick={() => openFeedbackDrawer(activeField.id)}>
                {copy.morphing.dashboard.logFirstReading}
              </PillButton>
            ) : undefined
          }
        />
      )}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-ink/10 pt-3 text-xs text-ink/60">
        <div className="flex items-center gap-2">
          <span className="inline-block h-3 w-5 rounded bg-mint opacity-85 shadow-2xs" />
          <span>{copy.morphing.dashboard.targetZone}</span>
        </div>
        <div className="flex items-center gap-1">
          <Icon icon={ShowChartOutlinedIcon} size="xs" />
          <span>{copy.morphing.dashboard.biomarkerSubtitle}</span>
        </div>
      </div>
    </Panel>
  );
}
