'use client';

import React, { useId } from 'react';
import { useRouter } from 'next/navigation';
import AddIcon from '@mui/icons-material/Add';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import NorthEastIcon from '@mui/icons-material/NorthEast';
import { useAssistant } from '../../contexts/AssistantContext';
import { useRoutine } from '../../contexts/RoutineContext';
import { DOI_BASE_URL } from '../../data/config';
import { ROUTES } from '../../data/navigation';
import { EmptyState } from '../feedback/EmptyState';
import { PaperListItem } from '../routine/PaperListItem';
import { QueuedPaperItem } from '../routine/QueuedPaperItem';
import { CircleButton } from '../ui/CircleButton';
import { EvidenceBadgeChip } from '../ui/EvidenceBadgeChip';
import { Icon } from '../ui/Icon';
import { Panel } from '../ui/Panel';
import { PillButton } from '../ui/PillButton';
import { SectionHeading } from '../ui/SectionHeading';

import { useLocale } from '../../contexts/LocaleContext';
export function PapersPanel() {
  const { copy } = useLocale();
  const { routine, routines, queuedPapers, activeRoutineId, setActiveRoutine } = useRoutine();
  const { openAssistant } = useAssistant();
  const router = useRouter();
  const headingId = useId();

  const isEmpty = routines.length === 0 && queuedPapers.length === 0;
  const openUpload = () => openAssistant('ask');

  const handleOpenRoutine = (id: string) => {
    setActiveRoutine(id);
    router.push(ROUTES.routine);
  };

  return (
    <Panel aria-labelledby={headingId}>
      <SectionHeading
        id={headingId}
        eyebrow={copy.dashboard.papersEyebrow}
        title={copy.dashboard.papersTitle}
        action={
          <CircleButton label={copy.shell.addPaper} onClick={openUpload}>
            <Icon icon={AddIcon} size="md" />
          </CircleButton>
        }
      />

      {isEmpty ? (
        <EmptyState
          className="mt-5"
          icon={DescriptionOutlinedIcon}
          title={copy.dashboard.emptyPapersTitle}
          description={copy.dashboard.emptyPapersBody}
          action={
            <PillButton size="sm" onClick={openUpload}>
              {copy.switcher.addPaper}
            </PillButton>
          }
        />
      ) : (
        <ul className="mt-5 space-y-2">
          {routines.map((item) => (
            <PaperListItem
              key={item.id}
              routine={item}
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
            className="ms-auto flex min-h-11 items-center gap-1 text-xs text-ink/60 transition-colors hover:text-ink focus:outline-none focus-visible:underline"
          >
            {copy.dashboard.sourcePaper}
            <Icon icon={NorthEastIcon} size="xs" className="rtl:-scale-x-100" />
            <span className="sr-only">{copy.common.opensInNewTab}</span>
          </a>
        </div>
      )}
    </Panel>
  );
}