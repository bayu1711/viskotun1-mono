'use client';

import React from 'react';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import type { AvailableTimeWindow } from '../../types/schedule';
import { cn } from '../../utils/cn';
import { formatWindowRange, inferWindowLabel, parseTimeToMinutes } from '../../utils/schedule';
import { Icon } from './Icon';

interface AvailableWindowsEditorProps {
  windows: AvailableTimeWindow[];
  onChange: (next: AvailableTimeWindow[]) => void;
  presets?: readonly AvailableTimeWindow[];
  addLabel?: string;
  labelPlaceholder?: string;
  presetsHeading?: string;
  removeAria?: (label: string) => string;
  compact?: boolean;
  maxWindows?: number;
}

export function AvailableWindowsEditor({
  windows,
  onChange,
  presets = [],
  addLabel = '+ Add time window',
  labelPlaceholder = 'Label (e.g. Morning)',
  presetsHeading,
  removeAria = (label) => `Remove ${label} window`,
  compact = false,
  maxWindows = 4
}: AvailableWindowsEditorProps) {
  const handleUpdate = (index: number, patch: Partial<AvailableTimeWindow>) => {
    const next = windows.map((win, idx) => (idx === index ? { ...win, ...patch } : win));
    onChange(next);
  };

  const handleRemove = (index: number) => {
    onChange(windows.filter((_, idx) => idx !== index));
  };

  const handleAddBlank = () => {
    if (windows.length >= maxWindows) return;
    const defaultStart = windows.length === 0 ? '07:30' : windows.length === 1 ? '19:00' : '12:30';
    const defaultEnd = windows.length === 0 ? '09:00' : windows.length === 1 ? '21:00' : '13:30';
    const startMins = parseTimeToMinutes(defaultStart) ?? 480;
    onChange([
      ...windows,
      {
        id: `win-${Date.now()}-${windows.length}`,
        label: inferWindowLabel(startMins),
        start: defaultStart,
        end: defaultEnd
      }
    ]);
  };

  const isPresetActive = (preset: AvailableTimeWindow) =>
    windows.some((w) => w.start === preset.start && w.end === preset.end);

  const handleTogglePreset = (preset: AvailableTimeWindow) => {
    if (isPresetActive(preset)) {
      onChange(windows.filter((w) => !(w.start === preset.start && w.end === preset.end)));
      return;
    }
    if (windows.length >= maxWindows) return;
    onChange([...windows, { ...preset, id: `${preset.id}-${Date.now()}` }]);
  };

  return (
    <div className={cn('space-y-2.5', compact && 'space-y-2')}>
      {windows.length > 0 && (
        <div className="space-y-2">
          {windows.map((win, index) => (
            <div
              key={win.id || index}
              className={cn(
                'flex flex-wrap items-center gap-2 rounded-xl border border-ink/15 bg-canvas/60',
                compact ? 'p-2' : 'p-2.5'
              )}
            >
              <input
                type="text"
                value={win.label}
                onChange={(e) => handleUpdate(index, { label: e.target.value })}
                placeholder={labelPlaceholder}
                aria-label={`Window ${index + 1} label`}
                className={cn(
                  'min-w-[96px] flex-1 rounded-lg border border-ink/15 bg-white px-2.5 text-ink outline-none focus:border-ink',
                  compact ? 'py-1 text-2xs' : 'py-1.5 text-xs'
                )}
              />
              <div className="flex items-center gap-1.5">
                <input
                  type="time"
                  value={win.start}
                  onChange={(e) => handleUpdate(index, { start: e.target.value })}
                  aria-label={`${win.label || `Window ${index + 1}`} start time`}
                  className={cn(
                    'rounded-lg border border-ink/15 bg-white px-2 text-ink tabular-nums outline-none focus:border-ink',
                    compact ? 'py-1 text-2xs' : 'py-1.5 text-xs'
                  )}
                />
                <span className="text-2xs text-ink/70">–</span>
                <input
                  type="time"
                  value={win.end}
                  onChange={(e) => handleUpdate(index, { end: e.target.value })}
                  aria-label={`${win.label || `Window ${index + 1}`} end time`}
                  className={cn(
                    'rounded-lg border border-ink/15 bg-white px-2 text-ink tabular-nums outline-none focus:border-ink',
                    compact ? 'py-1 text-2xs' : 'py-1.5 text-xs'
                  )}
                />
              </div>
              <button
                type="button"
                onClick={() => handleRemove(index)}
                aria-label={removeAria(win.label || formatWindowRange(win))}
                className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-ink/15 bg-white text-ink/60 hover:border-ink hover:text-ink transition-colors cursor-pointer"
              >
                <Icon icon={CloseIcon} size="xs" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-1.5">
        {windows.length < maxWindows && (
          <button
            type="button"
            onClick={handleAddBlank}
            className={cn(
              'inline-flex items-center gap-1 rounded-full border border-dashed border-ink/30 bg-white font-medium text-ink transition-colors hover:border-ink hover:bg-cream cursor-pointer',
              compact ? 'px-2.5 py-1 text-3xs' : 'px-3 py-1.5 text-xs'
            )}
          >
            <Icon icon={AddIcon} size="xs" />
            <span>{addLabel.replace(/^\+\s*/, '')}</span>
          </button>
        )}

        {presets.length > 0 && presetsHeading && !compact && (
          <span className="ms-1 text-2xs text-ink/70">{presetsHeading}:</span>
        )}

        {presets.map((preset) => {
          const active = isPresetActive(preset);
          return (
            <button
              key={`${preset.id}-${preset.start}-${preset.end}`}
              type="button"
              onClick={() => handleTogglePreset(preset)}
              className={cn(
                'rounded-full border font-medium transition-colors tabular-nums cursor-pointer',
                compact ? 'px-2.5 py-1 text-3xs' : 'px-3 py-1.5 text-xs',
                active
                  ? 'border-ink bg-mint text-ink font-semibold'
                  : 'border-ink/15 bg-canvas/60 text-ink/80 hover:border-ink/40'
              )}
            >
              {preset.label} · {formatWindowRange(preset)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
