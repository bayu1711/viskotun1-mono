import React from 'react';
import { cn } from '../../utils/cn';

interface PaperRowTextProps {
  title: string;
  meta: React.ReactNode;
  titleClassName?: string;
  metaClassName?: string;
}

/** Two-line title + meta block shared by every paper/protocol row. */
export function PaperRowText({ title, meta, titleClassName, metaClassName }: PaperRowTextProps) {
  return (
    <span className="min-w-0 flex-1">
      <span className={cn('block truncate text-sm', titleClassName)}>{title}</span>
      <span className={cn('block text-xs text-ink/60', metaClassName)}>{meta}</span>
    </span>);

}