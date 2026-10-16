import React, { useCallback, useId, useRef, useState } from 'react';
import AddIcon from '@mui/icons-material/Add';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { AnimatePresence, motion } from 'framer-motion';
import { useAssistant } from '../../contexts/AssistantContext';
import { useProtocol } from '../../contexts/ProtocolContext';
import { MOTION } from '../../data/config';
import { COPY } from '../../data/copy';
import { useDismissable } from '../../hooks/useDismissable';
import { cn } from '../../utils/cn';
import { Icon } from '../ui/Icon';
import { IconTile } from '../ui/IconTile';
import { StepIcon } from '../ui/StepIcon';
import { ProtocolOption } from './ProtocolOption';
import { QueuedPaperItem } from './QueuedPaperItem';

export function ProtocolSwitcher() {
  const { protocols, queuedPapers, activeProtocolId, setActiveProtocol, protocol } = useProtocol();
  const { openAssistant } = useAssistant();
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const headingId = useId();

  const close = useCallback(() => setIsOpen(false), []);
  useDismissable(rootRef, isOpen, close);

  const handleSelect = (id: string) => {
    setActiveProtocol(id);
    close();
  };

  const handleAddPaper = () => {
    close();
    openAssistant('upload');
  };

  if (!protocol) {
    return (
      <button
        type="button"
        onClick={handleAddPaper}
        className="flex items-center gap-2 rounded-full border border-dashed border-ink/40 py-1.5 px-3 text-sm lowercase text-ink/70 hover:border-ink hover:text-ink transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/30"
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
        className="flex items-center gap-2 rounded-full border border-ink py-1.5 pl-1.5 pr-3 text-sm lowercase transition-colors hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/30">
        
        <IconTile variant="solid" shape="circle" size={28}>
          <StepIcon icon={protocol.icon} size="xs" />
        </IconTile>
        <span className="max-w-switcher truncate">{protocol.title}</span>
        <Icon icon={ExpandMoreIcon} size="md" className={cn('transition-transform', isOpen && 'rotate-180')} />
      </button>

      <AnimatePresence>
        {isOpen &&
        <motion.div
          initial={{ opacity: 0, y: MOTION.popoverOffsetY }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: MOTION.popoverOffsetY }}
          transition={MOTION.fade}
          className="absolute left-0 top-full z-popover mt-2 w-popover max-w-inset rounded-card border border-ink/10 bg-white p-2 shadow-popover">
          
            <p id={headingId} className="px-3 pb-1 pt-2 text-xs lowercase text-ink/45">
              {COPY.switcher.heading}
            </p>
            <ul id={listId} role="listbox" aria-labelledby={headingId}>
              {protocols.map((item) =>
            <ProtocolOption
              key={item.id}
              protocol={item}
              active={item.id === activeProtocolId}
              onSelect={handleSelect} />

            )}
              {queuedPapers.map((paper) =>
            <QueuedPaperItem key={paper.id} paper={paper} variant="menu" />
            )}
            </ul>
            <div className="mt-1 border-t border-ink/10 pt-1">
              <button
              type="button"
              onClick={handleAddPaper}
              className="flex w-full items-center gap-3 rounded-tile p-2.5 text-left text-sm lowercase transition-colors hover:bg-canvas focus:outline-none focus-visible:bg-canvas">
              
                <IconTile variant="solid" shape="circle" size={40}>
                  <Icon icon={AddIcon} size="md" />
                </IconTile>
                {COPY.switcher.addPaper}
              </button>
            </div>
          </motion.div>
        }
      </AnimatePresence>
    </div>);

}