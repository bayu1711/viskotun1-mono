import React from 'react';
import type { SvgIconComponent } from '@mui/icons-material';
import { cn } from '../../utils/cn';

export type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

const SIZE_CLASS: Record<IconSize, string> = {
  xs: 'text-sm',
  sm: 'text-base',
  md: 'text-lg',
  lg: 'text-xl',
  xl: 'text-2xl',
  '2xl': 'text-title'
};

interface IconProps {
  icon: SvgIconComponent;
  size?: IconSize;
  className?: string;
}

/** Decorative MUI icon sized by Tailwind font-size tokens (no sx/inline styles). */
export function Icon({ icon: Svg, size = 'md', className }: IconProps) {
  return (
    <span aria-hidden="true" className={cn('inline-flex shrink-0 leading-none', SIZE_CLASS[size], className)}>
      <Svg fontSize="inherit" />
    </span>);

}