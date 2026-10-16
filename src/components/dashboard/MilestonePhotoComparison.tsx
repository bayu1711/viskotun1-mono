'use client';

import React, { useId, useState } from 'react';
import CameraAltOutlinedIcon from '@mui/icons-material/CameraAltOutlined';
import CompareArrowsOutlinedIcon from '@mui/icons-material/CompareArrowsOutlined';
import GridOnOutlinedIcon from '@mui/icons-material/GridOnOutlined';
import { useProtocol } from '../../contexts/ProtocolContext';
import { COPY } from '../../data/copy';
import { CircleButton } from '../ui/CircleButton';
import { Icon } from '../ui/Icon';
import { Panel } from '../ui/Panel';
import { SectionHeading } from '../ui/SectionHeading';

const STANDARDIZED_BASELINE_MOCKUP = COPY.morphing.dashboard.baselineMockupSvg(
  COPY.morphing.dashboard.baselineMockupSvgText
);

const SAMPLE_PROGRESSION_MOCKUP = COPY.morphing.dashboard.progressionMockupSvg(
  COPY.morphing.dashboard.progressionMockupSvgText
);

export function MilestonePhotoComparison() {
  const { protocol, morphingLogs, openFeedbackDrawer } = useProtocol();
  const headingId = useId();

  const photoField = protocol.dataCollectionSpec?.find((field) => field.type === 'photo');

  const [sliderPos, setSliderPos] = useState<number>(50);
  const [showGrid, setShowGrid] = useState<boolean>(true);

  const milestoneDays = photoField?.milestoneDays || [1, 14, 28, 56, 84];
  const [selectedMilestoneDay, setSelectedMilestoneDay] = useState<number>(() => {
    const nonBaseline = milestoneDays.filter((d) => d > 1);
    return nonBaseline[0] ?? 14;
  });

  if (!photoField) return null;

  const baselineLog = morphingLogs.find(
    (log) => log.fieldId === photoField.id && log.day === 1 && typeof log.value === 'string'
  );
  const milestoneLog = morphingLogs.find(
    (log) => log.fieldId === photoField.id && log.day === selectedMilestoneDay && typeof log.value === 'string'
  );

  const baselineSrc = (baselineLog?.value as string) || STANDARDIZED_BASELINE_MOCKUP;
  const milestoneSrc = (milestoneLog?.value as string) || SAMPLE_PROGRESSION_MOCKUP;
  const isSimulated = !milestoneLog;

  return (
    <Panel aria-labelledby={headingId} className="overflow-hidden">
      <SectionHeading
        id={headingId}
        eyebrow={COPY.morphing.milestoneTag}
        title={COPY.morphing.dashboard.photoSplitTitle}
        action={
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setShowGrid((prev) => !prev)}
              aria-label={COPY.morphing.dashboard.gridToggle}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors ${
                showGrid
                  ? 'border-ink bg-ink text-white'
                  : 'border-ink/20 text-ink/70 hover:border-ink/40'
              }`}
            >
              <Icon icon={GridOnOutlinedIcon} size="xs" />
              <span>{COPY.morphing.dashboard.gridToggle}</span>
            </button>
            <CircleButton
              label={COPY.morphing.milestone.action}
              onClick={() => openFeedbackDrawer(photoField.id)}
            >
              <Icon icon={CameraAltOutlinedIcon} size="md" />
            </CircleButton>
          </div>
        }
      />

      <p className="mt-1 text-xs text-ink/60">
        {photoField.instructions || COPY.morphing.dashboard.photoSplitSubtitle}
      </p>

      {/* Milestone Day Switcher */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-ink/50">{COPY.morphing.dashboard.milestonePeriod}</span>
        {milestoneDays
          .filter((day) => day > 1)
          .map((day) => {
            const hasLog = morphingLogs.some(
              (log) => log.fieldId === photoField.id && log.day === day
            );
            const isSelected = selectedMilestoneDay === day;
            return (
              <button
                key={day}
                type="button"
                onClick={() => setSelectedMilestoneDay(day)}
                className={`rounded-full px-3 py-1 text-xs transition-colors ${
                  isSelected
                    ? 'bg-ink font-medium text-white'
                    : 'bg-canvas text-ink/70 hover:bg-ink/10'
                }`}
              >
                {COPY.morphing.dashboard.dayPill(day, hasLog)}
              </button>
            );
          })}
      </div>

      {/* Interactive Split View Container */}
      <div className="relative mt-4 aspect-[4/3] w-full select-none overflow-hidden rounded-panel border border-ink/15 bg-canvas shadow-inner">
        {/* Right / Milestone Layer (Full width underneath) */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={milestoneSrc}
          alt={COPY.morphing.dashboard.milestoneAlt(selectedMilestoneDay)}
          className="absolute inset-0 h-full w-full object-cover"
        />

        {/* Left / Baseline Layer (Clipped to slider position) */}
        <div
          className="absolute inset-0 h-full overflow-hidden"
          style={{ width: `${sliderPos}%` }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={baselineSrc}
            alt={COPY.morphing.dashboard.baselineAlt}
            className="absolute inset-0 h-full max-w-none object-cover"
            style={{ width: '100%', minWidth: '100%', height: '100%' }}
          />
        </div>

        {/* Optional Clinical Standardization Grid Overlay */}
        {showGrid && (
          <div
            className="pointer-events-none absolute inset-0 opacity-40"
            aria-hidden="true"
            style={{
              backgroundImage: `
                linear-gradient(to right, rgba(46, 58, 52, 0.25) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(46, 58, 52, 0.25) 1px, transparent 1px)
              `,
              backgroundSize: '40px 40px'
            }}
          >
            {/* Center crosshair */}
            <div className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full border border-ink/40" />
            <div className="absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2 bg-ink/30" />
            <div className="absolute top-1/2 left-0 right-0 h-px -translate-y-1/2 bg-ink/30" />
          </div>
        )}

        {/* Vertical Split Divider */}
        <div
          className="pointer-events-none absolute top-0 bottom-0 w-0.5 bg-ink shadow-lg"
          style={{ left: `${sliderPos}%` }}
        >
          <div className="absolute top-1/2 left-1/2 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-ink text-white shadow-md">
            <Icon icon={CompareArrowsOutlinedIcon} size="xs" />
          </div>
        </div>

        {/* Slider Input Handle for Dragging */}
        <input
          type="range"
          min={0}
          max={100}
          value={sliderPos}
          onChange={(e) => setSliderPos(Number(e.target.value))}
          aria-label={COPY.morphing.dashboard.sliderAria}
          className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0"
        />

        {/* Labels Overlay */}
        <div className="pointer-events-none absolute top-3 left-3 rounded-full bg-ink/80 px-3 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
          {COPY.morphing.dashboard.baselineLabel}
        </div>
        <div className="pointer-events-none absolute top-3 right-3 rounded-full bg-ink/80 px-3 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
          {COPY.morphing.dashboard.currentLabel(selectedMilestoneDay)}
          {isSimulated && COPY.morphing.dashboard.previewBadge}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between text-[11px] text-ink/50">
        <span>{COPY.morphing.dashboard.dragHint}</span>
        <span>{COPY.morphing.dashboard.overheadStandard}</span>
      </div>
    </Panel>
  );
}
