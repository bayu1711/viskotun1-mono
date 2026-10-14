import React from 'react';
import CloseIcon from '@mui/icons-material/Close';
import type { AssistantMode } from '../../contexts/AssistantContext';
import { COPY } from '../../data/copy';
import { CircleButton } from '../ui/CircleButton';
import { Icon } from '../ui/Icon';
import { SegmentedTabs } from '../ui/SegmentedTabs';

const MODE_OPTIONS: {id: AssistantMode;label: string;}[] = [
{ id: 'ask', label: COPY.assistant.modes.ask },
{ id: 'upload', label: COPY.assistant.modes.upload }];


interface AssistantHeaderProps {
  mode: AssistantMode;
  protocolTitle: string;
  titleId: string;
  onModeChange: (mode: AssistantMode) => void;
  onClose: () => void;
}

export function AssistantHeader({ mode, protocolTitle, titleId, onModeChange, onClose }: AssistantHeaderProps) {
  const isAsk = mode === 'ask';

  return (
    <header className="shrink-0 px-5 pt-5">
      <div className="flex items-center justify-between gap-3 border-b border-ink pb-4">
        <CircleButton label={COPY.assistant.close} onClick={onClose}>
          <Icon icon={CloseIcon} size="md" />
        </CircleButton>
        <SegmentedTabs options={MODE_OPTIONS} value={mode} onChange={onModeChange} ariaLabel={COPY.assistant.modeLabel} />
        <span className="w-10" aria-hidden="true" />
      </div>
      <div className="pt-4">
        <p className="text-sm lowercase leading-none text-ink/45">
          {isAsk ? protocolTitle : COPY.assistant.eyebrowUpload}
        </p>
        <h2 id={titleId} className="mt-1 text-display-sm lowercase leading-tight tracking-tight">
          {isAsk ? COPY.assistant.titleAsk : COPY.assistant.titleUpload}
        </h2>
      </div>
    </header>);

}