import React from 'react';
import Image from 'next/image';
import { COPY } from '../../data/copy';
import { cn } from '../../utils/cn';

export type AIIconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export const AI_ICON_SIZES: Record<AIIconSize, { px: number; className: string }> = {
  xs: { px: 16, className: 'h-4 w-4' },
  sm: { px: 20, className: 'h-5 w-5' },
  md: { px: 24, className: 'h-6 w-6' },
  lg: { px: 28, className: 'h-7 w-7' },
  xl: { px: 32, className: 'h-8 w-8' },
  '2xl': { px: 40, className: 'h-10 w-10' }
};

export interface AIIconProps {
  size?: AIIconSize;
  className?: string;
  alt?: string;
  priority?: boolean;
}

/** Brand favicon representing the Viskotu AI assistant across the application. */
export function AIIcon({ size = 'md', className, alt = '', priority = false }: AIIconProps) {
  const { px, className: sizeClass } = AI_ICON_SIZES[size];

  return (
    <Image
      src={COPY.brand.iconUrl}
      alt={alt}
      width={px}
      height={px}
      priority={priority}
      className={cn('shrink-0 object-contain', sizeClass, className)}
    />
  );
}
