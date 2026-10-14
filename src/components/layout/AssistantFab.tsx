import React from 'react';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import { useAssistant } from '../../contexts/AssistantContext';
import { useProtocol } from '../../contexts/ProtocolContext';
import { COPY } from '../../data/copy';
import { Icon } from '../ui/Icon';
import { IconTile } from '../ui/IconTile';

/** Desktop floating entry point to the paper assistant. */
export function AssistantFab() {
  const { protocol } = useProtocol();
  const { openAssistant, isOpen } = useAssistant();

  return (
    <button
      type="button"
      onClick={() => openAssistant('ask')}
      aria-haspopup="dialog"
      aria-expanded={isOpen}
      className="fixed bottom-6 right-8 z-nav hidden items-center gap-3 rounded-full bg-ink py-2 pl-2 pr-5 text-sm lowercase text-white shadow-float transition-transform hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/30 lg:flex">
      
      <IconTile variant="inverse" shape="circle" size={36}>
        <Icon icon={AutoAwesomeOutlinedIcon} size="md" />
      </IconTile>
      {COPY.shell.assistantFab(protocol.shortTitle)}
    </button>);

}