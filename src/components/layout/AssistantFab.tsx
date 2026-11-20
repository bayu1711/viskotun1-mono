import React from 'react';
import { useAssistant } from '../../contexts/AssistantContext';
import { useRoutine } from '../../contexts/RoutineContext';
import { formatRoutineTitle } from '../../utils/text';
import { AIIcon } from '../ui/AIIcon';
import { IconTile } from '../ui/IconTile';

import { useLocale } from '../../contexts/LocaleContext';
/** Desktop floating entry point to the paper assistant. */
export function AssistantFab() {
  const { copy } = useLocale();
  const { routine } = useRoutine();
  const { openAssistant, isOpen } = useAssistant();

  const label = routine
    ? copy.shell.assistantFab(formatRoutineTitle(routine.shortTitle))
    : copy.shell.openAssistant;

  return (
    <button
      type="button"
      onClick={() => openAssistant(routine ? 'ask' : 'upload')}
      aria-haspopup="dialog"
      aria-expanded={isOpen}
      className="fixed bottom-6 end-8 z-nav hidden items-center gap-3 rounded-full bg-ink py-2 ps-2 pe-5 text-sm text-white shadow-float transition-transform hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/30 lg:flex"
    >
      <IconTile variant="plain" shape="circle" size={36}>
        <AIIcon size="lg" />
      </IconTile>
      {label}
    </button>
  );
}