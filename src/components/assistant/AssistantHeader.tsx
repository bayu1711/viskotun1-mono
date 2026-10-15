'use client';

import React, { useEffect, useState } from 'react';
import CloseIcon from '@mui/icons-material/Close';
import type { AssistantMode } from '../../contexts/AssistantContext';
import { COPY } from '../../data/copy';
import { isEdgeGemmaAvailable } from '../../utils/edgeGemma';
import { CircleButton } from '../ui/CircleButton';
import { Icon } from '../ui/Icon';
import { SegmentedTabs } from '../ui/SegmentedTabs';

const MODE_OPTIONS: { id: AssistantMode; label: string }[] = [
  { id: 'ask', label: COPY.assistant.modes.ask },
  { id: 'upload', label: COPY.assistant.modes.upload }
];

interface AssistantHeaderProps {
  mode: AssistantMode;
  protocolTitle: string;
  titleId: string;
  onModeChange: (mode: AssistantMode) => void;
  onClose: () => void;
}

export function AssistantHeader({
  mode,
  protocolTitle,
  titleId,
  onModeChange,
  onClose
}: AssistantHeaderProps) {
  const isAsk = mode === 'ask';
  const [isEdgeAvailable, setIsEdgeAvailable] = useState<boolean>(false);

  useEffect(() => {
    let active = true;
    isEdgeGemmaAvailable().then((avail) => {
      if (active) setIsEdgeAvailable(avail);
    });
    return () => {
      active = false;
    };
  }, []);

  return (
    <header className="shrink-0 px-5 pt-5">
      <div className="flex items-center justify-between gap-3 border-b border-ink pb-4">
        <CircleButton label={COPY.assistant.close} onClick={onClose}>
          <Icon icon={CloseIcon} size="md" />
        </CircleButton>
        <SegmentedTabs
          options={MODE_OPTIONS}
          value={mode}
          onChange={onModeChange}
          ariaLabel={COPY.assistant.modeLabel}
        />
        <span className="w-10" aria-hidden="true" />
      </div>
      <div className="pt-4">
        <div className="flex items-center justify-between">
          <p className="text-sm lowercase leading-none text-ink/45">
            {isAsk ? protocolTitle : COPY.assistant.eyebrowUpload}
          </p>
          {isAsk && (
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-3xs font-medium ${
                isEdgeAvailable ? 'bg-mint text-ink' : 'bg-cream text-ink/80'
              }`}
            >
              {isEdgeAvailable
                ? COPY.assistant.engines.onDeviceGemma
                : COPY.assistant.engines.cloudGemini}
            </span>
          )}
        </div>
        <h2 id={titleId} className="mt-1 text-display-sm lowercase leading-tight tracking-tight">
          {isAsk ? COPY.assistant.titleAsk : COPY.assistant.titleUpload}
        </h2>
      </div>
    </header>
  );
}