import { useEffect, useRef, useState } from 'react';

const FILES_TRANSFER_TYPE = 'Files';

function hasFiles(event: DragEvent) {
  return Array.from(event.dataTransfer?.types ?? []).includes(FILES_TRANSFER_TYPE);
}

/** Listens for files dragged anywhere over the window. Returns whether a file is hovering. */
export function useFileDrop(onFile: (file: File) => void) {
  const [isDragging, setIsDragging] = useState(false);
  const depth = useRef(0);
  const handler = useRef(onFile);

  useEffect(() => {
    handler.current = onFile;
  }, [onFile]);

  useEffect(() => {
    const handleEnter = (event: DragEvent) => {
      if (!hasFiles(event)) return;
      event.preventDefault();
      depth.current += 1;
      setIsDragging(true);
    };
    const handleOver = (event: DragEvent) => {
      if (hasFiles(event)) event.preventDefault();
    };
    const handleLeave = (event: DragEvent) => {
      if (!hasFiles(event)) return;
      depth.current = Math.max(0, depth.current - 1);
      if (depth.current === 0) setIsDragging(false);
    };
    const handleDrop = (event: DragEvent) => {
      if (!hasFiles(event)) return;
      event.preventDefault();
      depth.current = 0;
      setIsDragging(false);
      const file = event.dataTransfer?.files?.[0];
      if (file) handler.current(file);
    };

    window.addEventListener('dragenter', handleEnter);
    window.addEventListener('dragover', handleOver);
    window.addEventListener('dragleave', handleLeave);
    window.addEventListener('drop', handleDrop);
    return () => {
      window.removeEventListener('dragenter', handleEnter);
      window.removeEventListener('dragover', handleOver);
      window.removeEventListener('dragleave', handleLeave);
      window.removeEventListener('drop', handleDrop);
    };
  }, []);

  return isDragging;
}