import React from 'react';
import { cn } from '../../utils/cn';

type HeadingSize = 'md' | 'xl';

const EYEBROW_SIZE: Record<HeadingSize, string> = {
  md: 'text-sm',
  xl: 'text-lg'
};

const TITLE_SIZE: Record<HeadingSize, string> = {
  md: 'text-2xl leading-tight',
  xl: 'text-hero leading-display tracking-tight sm:text-hero-lg'
};

interface SectionHeadingProps {
  eyebrow: string;
  title: string;
  action?: React.ReactNode;
  size?: HeadingSize;
  as?: 'h1' | 'h2' | 'h3';
  id?: string;
}

export function SectionHeading({ eyebrow, title, action, size = 'md', as: Tag = 'h2', id }: SectionHeadingProps) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div className="min-w-0">
        <p className={cn('leading-none text-ink/60', EYEBROW_SIZE[size])}>{eyebrow}</p>
        <Tag id={id} className={cn('mt-1 text-ink', TITLE_SIZE[size])}>
          {title}
        </Tag>
      </div>
      {action}
    </div>);

}