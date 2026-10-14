import React, { forwardRef } from 'react';
import { PDF_ACCEPT } from '../../data/config';

interface HiddenPdfInputProps {
  onFile: (file: File) => void;
}

/** Visually hidden file picker triggered by a visible button via ref. */
export const HiddenPdfInput = forwardRef<HTMLInputElement, HiddenPdfInputProps>(function HiddenPdfInput(
{ onFile },
ref)
{
  return (
    <input
      ref={ref}
      type="file"
      accept={PDF_ACCEPT}
      className="sr-only"
      tabIndex={-1}
      aria-hidden="true"
      onChange={(event) => {
        const file = event.target.files?.[0];
        if (file) onFile(file);
        event.target.value = '';
      }} />);


});