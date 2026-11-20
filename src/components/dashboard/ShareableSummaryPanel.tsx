'use client';

import React, { useId, useState } from 'react';
import PrintOutlinedIcon from '@mui/icons-material/PrintOutlined';
import { useRoutine } from '../../contexts/RoutineContext';
import { formatRoutineTitle } from '../../utils/text';
import { Icon } from '../ui/Icon';
import { Panel } from '../ui/Panel';
import { PillButton } from '../ui/PillButton';
import { ShareableSummaryModal } from './ShareableSummaryModal';

import { useLocale } from '../../contexts/LocaleContext';
export function ShareableSummaryPanel() {
  const { copy } = useLocale();
  const { routine } = useRoutine();
  const headingId = useId();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Panel tone="ink" aria-labelledby={headingId}>
        <p className="text-sm leading-none text-white/65">
          {copy.shareableSummary.eyebrow}
        </p>
        <h2 id={headingId} className="mt-1 text-2xl">
          {copy.shareableSummary.title}
        </h2>
        <p className="mt-3 text-sm text-white/55">
          {copy.shareableSummary.body(formatRoutineTitle(routine.shortTitle))}
        </p>

        <PillButton
          variant="orange"
          size="md"
          fullWidth
          className="mt-5 gap-2"
          onClick={() => setIsModalOpen(true)}
        >
          <Icon icon={PrintOutlinedIcon} size="sm" />
          <span>{copy.shareableSummary.export}</span>
        </PillButton>
      </Panel>

      <ShareableSummaryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}

// Backwards-compatible alias for any legacy imports
export const PhysicianSummaryPanel = ShareableSummaryPanel;
