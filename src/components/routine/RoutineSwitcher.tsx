import React, { useCallback, useId, useRef, useState } from 'react';
import AddIcon from '@mui/icons-material/Add';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { AnimatePresence, motion } from 'framer-motion';
import { useAssistant } from '../../contexts/AssistantContext';
import { useRoutine } from '../../contexts/RoutineContext';
import { MOTION } from '../../data/config';
import { COPY } from '../../data/copy';
import { useDismissable } from '../../hooks/useDismissable';
import { cn } from '../../utils/cn';
import { Icon } from '../ui/Icon';
import { IconTile } from '../ui/IconTile';
import { StepIcon } from '../ui/StepIcon';
import { RoutineOption } from './RoutineOption';
import { QueuedPaperItem } from '../protocol/QueuedPaperItem';

export function RoutineSwitcher() {
  const { routines, queuedPapers, activeRoutineId, setActiveRoutine, routine } = useRoutine();
  const { openAssistant } = useAssistant();
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const headingId = useId();

  const close = useCallback(() => setIsOpen(false), []);
  useDismissable(rootRef, isOpen, close);

  const handleSelect = (id: string) => {
    setActiveRoutine(id);
    close();
  };

  const handleAddPaper = () => {
    close();
    openAssistant('upload');
  };

  if (!routine) {
    return (
      <button
        type="button"
        onClick={handleAddPaper}
        className="flex min-h-11 items-center gap-2 rounded-full border border-dashed border-ink/40 py-1.5 px-3 text-sm text-ink/70 hover:border-ink hover:text-ink transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/30"
      >
        <Icon icon={AddIcon} size="sm" />
        <span>{COPY.switcher.addPaper}</span>
      </button>
    );
  }

  return (
    <div ref={rootRef} className="relative inline-block">
      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={isOpen ? listId : undefined}
        className="flex min-h-11 items-center gap-2 rounded-full border border-ink py-1.5 pl-1.5 pr-3 text-sm transition-colors hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/30"
      >
        <IconTile variant="orange" shape="circle" size={28}>
          <StepIcon icon={routine.icon} size="xs" />
        </IconTile>
        <span className="max-w-switcher truncate">{routine.title}</span>
        <Icon icon={ExpandMoreIcon} size="md" className={cn('transition-transform', isOpen && 'rotate-180')} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: MOTION.popoverOffsetY }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: MOTION.popoverOffsetY }}
            transition={MOTION.fade}
            className="absolute left-0 top-full z-popover mt-2 w-popover max-w-inset rounded-card bg-white p-2 shadow-popover"
          >
            <p id={headingId} className="px-2 py-1 text-2xs uppercase tracking-wider text-ink/60">
              {COPY.switcher.heading}
            </p>
            <ul id={listId} role="listbox" aria-labelledby={headingId} className="space-y-1">
              {routines.map((item) => (
                <RoutineOption
                  key={item.id}
                  routine={item}
                  active={item.id === activeRoutineId}
                  onSelect={handleSelect}
                />
              ))}
            </ul>

            {queuedPapers.length > 0 && (
              <div className="mt-2 border-t border-ink/10 pt-2">
                {queuedPapers.map((paper) => (
                  <QueuedPaperItem key={paper.id} paper={paper} variant="menu" />
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={handleAddPaper}
              className="mt-2 flex w-full items-center gap-2 rounded-tile border border-dashed border-ink/40 p-2 text-sm text-ink/70 hover:border-ink hover:text-ink transition-colors"
            >
              <Icon icon={AddIcon} size="sm" />
              <span>{COPY.switcher.addPaper}</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export const ProtocolSwitcher = RoutineSwitcher;
