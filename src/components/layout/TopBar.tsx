import React from 'react';
import AddIcon from '@mui/icons-material/Add';
import { useAssistant } from '../../contexts/AssistantContext';
import { useProtocol } from '../../contexts/ProtocolContext';
import { COPY } from '../../data/copy';
import { currentUser } from '../../data/user';
import { greeting } from '../../utils/time';
import { Avatar } from '../ui/Avatar';
import { CircleButton } from '../ui/CircleButton';
import { Icon } from '../ui/Icon';

export function TopBar() {
  const { streak } = useProtocol();
  const { openAssistant } = useAssistant();

  return (
    <header className="mx-auto w-full max-w-6xl px-5 pt-5 lg:px-10 lg:pt-8">
      <div className="flex items-center gap-3 border-b border-ink pb-4">
        <Avatar initials={currentUser.initials} />
        <div className="leading-tight">
          <p className="text-xs text-ink/45">{greeting()}</p>
          <p className="text-sm">{currentUser.name}</p>
        </div>
        <p className="ml-auto text-sm lowercase text-ink/60">{COPY.shell.streak(streak)}</p>
        <CircleButton label={COPY.shell.addPaper} onClick={() => openAssistant('upload')}>
          <Icon icon={AddIcon} size="lg" />
        </CircleButton>
      </div>
    </header>);

}