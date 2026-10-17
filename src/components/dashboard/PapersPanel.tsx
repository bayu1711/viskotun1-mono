'use client';

import React, { useId } from 'react';
import { useRouter } from 'next/navigation';
import AddIcon from '@mui/icons-material/Add';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import NorthEastIcon from '@mui/icons-material/NorthEast';
import { useAssistant } from '../../contexts/AssistantContext';
import { useRoutine } from '../../contexts/RoutineContext';
import { DOI_BASE_URL } from '../../data/config';
import { COPY } from '../../data/copy';
import { ROUTES } from '../../data/navigation';
import { EmptyState } from '../feedback/EmptyState';
import { PaperListItem } from '../protocol/PaperListItem';
import { QueuedPaperItem } from '../protocol/QueuedPaperItem';
import { CircleButton } from '../ui/CircleButton';
import { EvidenceBadgeChip } from '../ui/EvidenceBadgeChip';
import { Icon } from '../ui/Icon';
import { Panel } from '../ui/Panel';
import { PillButton } from '../ui/PillButton';
import { SectionHeading } from '../ui/SectionHeading';

export function PapersPanel() {
  const { routine, routines, queuedPapers, activeRoutineId, setActiveRoutine } = useRoutine();
  const { openAssistant } = useAssistant();
  const router = useRouter();
  const headingId = useId();

  const isEmpty = routines.length === 0 && queuedPapers.length === 0;
  const openUpload = () => openAssistant('upload');

  const handleOpenRoutine = (id: string) => {
    setActiveRoutine(id);
    router.push(ROUTES.routine);
  };

  return (
    <Panel aria-labelledby={headingId}>
      <SectionHeading
        id={headingId}
        eyebrow={COPY.dashboard.papersEyebrow}
        title={COPY.dashboard.papersTitle}
        action={
          <CircleButton label={COPY.shell.addPaper} onClick={openUpload}>
            <Icon icon={AddIcon} size="md" />
          </CircleButton>
        }
      />

      {isEmpty ? (
        <EmptyState
          className="mt-5"
          icon={DescriptionOutlinedIcon}
          title={COPY.dashboard.emptyPapersTitle}
          description={COPY.dashboard.emptyPapersBody}
          action={
            <PillButton size="sm" onClick={openUpload}>
              {COPY.switcher.addPaper}
            </PillButton>
          }
        />
      ) : (
        <ul className="mt-5 space-y-2">
          {routines.map((item) => (
            <PaperListItem
              key={item.id}
              protocol={item}
              active={item.id === activeRoutineId}
              onOpen={handleOpenRoutine}
            />
          ))}
          {queuedPapers.map((paper) => (
            <QueuedPaperItem key={paper.id} paper={paper} variant="card" />
          ))}
        </ul>
      )}

      {routine && (
        <div className="mt-5 flex flex-wrap items-center gap-1.5 border-t border-ink/10 pt-4">
          {routine.paper.evidenceBadges.map((badge) => (
            <EvidenceBadgeChip key={badge} badge={badge} />
          ))}
          <a
            href={`${DOI_BASE_URL}${routine.paper.doi}`}
            target="_blank"
            rel="noreferrer"
            className="ml-auto flex min-h-11 items-center gap-1 text-xs text-ink/60 transition-colors hover:text-ink focus:outline-none focus-visible:underline"
          >
            {COPY.dashboard.sourcePaper}
            <Icon icon={NorthEastIcon} size="xs" />
            <span className="sr-only">{COPY.common.opensInNewTab}</span>
          </a>
        </div>
      )}
    </Panel>
  );
}