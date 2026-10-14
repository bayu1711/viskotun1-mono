import React from 'react';
import UploadFileOutlinedIcon from '@mui/icons-material/UploadFileOutlined';
import { AnimatePresence, motion } from 'framer-motion';
import { MOTION } from '../../data/config';
import { COPY } from '../../data/copy';
import { Icon } from '../ui/Icon';
import { IconTile } from '../ui/IconTile';

interface FileDropOverlayProps {
  visible: boolean;
}

export function FileDropOverlay({ visible }: FileDropOverlayProps) {
  return (
    <AnimatePresence>
      {visible &&
      <motion.div
        role="status"
        aria-live="assertive"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={MOTION.fade}
        className="pointer-events-none fixed inset-0 z-overlay flex items-center justify-center bg-mint/95 p-6">
        
          <div className="flex h-full max-h-dropzone w-full max-w-xl flex-col items-center justify-center rounded-overlay border-2 border-dashed border-ink text-center">
            <IconTile variant="outline" shape="circle" size={64}>
              <Icon icon={UploadFileOutlinedIcon} size="2xl" />
            </IconTile>
            <p className="mt-5 text-metric lowercase leading-none tracking-tight">{COPY.shell.dropTitle}</p>
            <p className="mt-2 text-sm lowercase text-ink/55">{COPY.shell.dropSubtitle}</p>
          </div>
        </motion.div>
      }
    </AnimatePresence>);

}