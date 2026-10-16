'use client';

import React, { type DragEvent, useRef, useState } from 'react';
import UploadFileOutlinedIcon from '@mui/icons-material/UploadFileOutlined';
import { COPY } from '../../data/copy';
import { cn } from '../../utils/cn';
import { isPdfFile } from '../../utils/files';
import { Icon } from '../ui/Icon';
import { IconTile } from '../ui/IconTile';
import { PillButton } from '../ui/PillButton';
import { HiddenPdfInput } from './HiddenPdfInput';

interface UploadDropzoneProps {
  onFile: (file: File) => void;
}

export function UploadDropzone({ onFile }: UploadDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const acceptFile = (file: File) => {
    if (!isPdfFile(file)) {
      setError(COPY.upload.invalidType);
      return;
    }
    setError(null);
    onFile(file);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsHovering(false);
    const file = event.dataTransfer.files?.[0];
    if (file) acceptFile(file);
  };

  return (
    <div
      onDragOver={(event) => {
        event.preventDefault();
        setIsHovering(true);
      }}
      onDragLeave={() => setIsHovering(false)}
      onDrop={handleDrop}
      className={cn(
        'flex flex-col items-center rounded-card border border-dashed px-5 py-6 text-center transition-colors',
        {
          'border-ink bg-mint': isHovering,
          'border-danger bg-blush/50': !isHovering && error,
          'border-ink/30 bg-canvas': !isHovering && !error
        }
      )}
    >
      <IconTile variant="outline" shape="circle" size={48}>
        <Icon icon={UploadFileOutlinedIcon} size="xl" />
      </IconTile>
      <p className="mt-3 text-lg">{COPY.upload.title}</p>
      <p className="mt-0.5 text-xs text-ink/45">{COPY.upload.body}</p>

      {error && (
        <p role="alert" className="mt-2 text-xs text-danger">
          {error}
        </p>
      )}

      <PillButton size="sm" className="mt-4" onClick={() => inputRef.current?.click()}>
        {COPY.upload.browse}
      </PillButton>

      <div className="mt-4 rounded-tile border border-ink/10 bg-white/70 p-3 text-left">
        <p className="flex items-center gap-1.5 text-2xs font-medium tracking-wide text-ink/70">
          <span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden="true" />
          {COPY.upload.scopeBadge}
        </p>
        <p className="mt-1 text-2xs leading-relaxed text-ink/50">
          {COPY.upload.scopeNote}
        </p>
      </div>

      <HiddenPdfInput ref={inputRef} onFile={acceptFile} />
    </div>
  );
}