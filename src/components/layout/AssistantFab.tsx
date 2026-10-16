import React from 'react';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import { useAssistant } from '../../contexts/AssistantContext';
import { useRoutine } from '../../contexts/RoutineContext';
import { COPY } from '../../data/copy';
import { Icon } from '../ui/Icon';
import { IconTile } from '../ui/IconTile';

/** Desktop floating entry point to the paper assistant. */
export function AssistantFab() {
  const { routine } = useRoutine();
  const { openAssistant, isOpen } = useAssistant();

  const label = routine
    ? COPY.shell.assistantFab(routine.shortTitle)
    : COPY.shell.openAssistant;

  return (
    <button
      type="button"
      onClick={() => openAssistant(routine ? 'ask' : 'upload')}
      aria-haspopup="dialog"
      aria-expanded={isOpen}
      className="fixed bottom-6 right-8 z-nav hidden items-center gap-3 rounded-full bg-ink py-2 pl-2 pr-5 text-sm text-white shadow-float transition-transform hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/30 lg:flex"
    >
      <IconTile variant="inverse" shape="circle" size={36}>
        <Icon icon={AutoAwesomeOutlinedIcon} size="md" />
      </IconTile>
      {label}
    </button>
  );
}