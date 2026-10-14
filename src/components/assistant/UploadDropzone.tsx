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
  onFile: (fileName: string) => void;
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
    onFile(file.name);
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
      className={cn('flex flex-col items-center rounded-card border border-dashed px-5 py-6 text-center transition-colors', {
        'border-ink bg-mint': isHovering,
        'border-danger bg-blush/50': !isHovering && error,
        'border-ink/30 bg-canvas': !isHovering && !error
      })}>
      
      <IconTile variant="outline" shape="circle" size={48}>
        <Icon icon={UploadFileOutlinedIcon} size="xl" />
      </IconTile>
      <p className="mt-3 text-lg lowercase">{COPY.upload.title}</p>
      <p className="mt-0.5 text-xs lowercase text-ink/45">{COPY.upload.body}</p>
      {error &&
      <p role="alert" className="mt-2 text-xs lowercase text-danger">
          {error}
        </p>
      }
      <PillButton size="sm" className="mt-4" onClick={() => inputRef.current?.click()}>
        {COPY.upload.browse}
      </PillButton>
      <HiddenPdfInput ref={inputRef} onFile={acceptFile} />
    </div>);

}