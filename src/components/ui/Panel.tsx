import React from 'react';
import { cn } from '../../utils/cn';

export type PanelTone = 'white' | 'ink' | 'mint' | 'blush';

const TONES: Record<PanelTone, string> = {
  white: 'bg-white text-ink',
  ink: 'bg-ink text-white',
  mint: 'bg-mint text-ink',
  blush: 'bg-blush text-ink'
};

interface PanelProps extends React.HTMLAttributes<HTMLElement> {
  tone?: PanelTone;
  as?: 'section' | 'article' | 'div';
}

/** Rounded content surface used for page sections. */
export function Panel({ tone = 'white', as: Tag = 'section', className, children, ...rest }: PanelProps) {
  return (
    <Tag className={cn('rounded-panel p-5 transition-colors sm:p-6', TONES[tone], className)} {...rest}>
      {children}
    </Tag>);

}