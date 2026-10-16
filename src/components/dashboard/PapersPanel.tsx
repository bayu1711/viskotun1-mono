'use client';

import React, { useId } from 'react';
import { useRouter } from 'next/navigation';
import AddIcon from '@mui/icons-material/Add';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import NorthEastIcon from '@mui/icons-material/NorthEast';
import { useAssistant } from '../../contexts/AssistantContext';
import { useProtocol } from '../../contexts/ProtocolContext';
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
  const { protocol, protocols, queuedPapers, activeProtocolId, setActiveProtocol } = useProtocol();
  const { openAssistant } = useAssistant();
  const router = useRouter();
  const headingId = useId();

  const isEmpty = protocols.length === 0 && queuedPapers.length === 0;
  const openUpload = () => openAssistant('upload');

  const handleOpenProtocol = (id: string) => {
    setActiveProtocol(id);
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
          {protocols.map((item) => (
            <PaperListItem
              key={item.id}
              protocol={item}
              active={item.id === activeProtocolId}
              onOpen={handleOpenProtocol}
            />
          ))}
          {queuedPapers.map((paper) => (
            <QueuedPaperItem key={paper.id} paper={paper} variant="card" />
          ))}
        </ul>
      )}

      {protocol && (
        <div className="mt-5 flex flex-wrap items-center gap-1.5 border-t border-ink/10 pt-4">
          {protocol.paper.evidenceBadges.map((badge) => (
            <EvidenceBadgeChip key={badge} badge={badge} />
          ))}
          <a
            href={`${DOI_BASE_URL}${protocol.paper.doi}`}
            target="_blank"
            rel="noreferrer"
            className="ml-auto flex items-center gap-1 text-xs lowercase text-ink/55 transition-colors hover:text-ink focus:outline-none focus-visible:underline"
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