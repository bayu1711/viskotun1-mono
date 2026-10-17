import React from 'react';
import { cn } from '../../utils/cn';

type TileVariant = 'solid' | 'inverse' | 'orange' | 'muted' | 'outline' | 'outline-light' | 'dashed' | 'plain';
type TileShape = 'square' | 'circle';
type TileSize = 24 | 28 | 32 | 36 | 40 | 48 | 64;

const VARIANTS: Record<TileVariant, string> = {
  solid: 'bg-ink text-white',
  inverse: 'bg-white text-ink',
  orange: 'bg-orange text-white',
  muted: 'bg-canvas text-ink/50',
  outline: 'border border-ink',
  'outline-light': 'border border-white/30',
  dashed: 'border border-dashed border-ink/25',
  plain: ''
};

const SHAPES: Record<TileShape, string> = {
  square: 'rounded-xl',
  circle: 'rounded-full'
};

const SIZES: Record<TileSize, string> = {
  24: 'h-6 w-6',
  28: 'h-7 w-7',
  32: 'h-8 w-8',
  36: 'h-9 w-9',
  40: 'h-10 w-10',
  48: 'h-12 w-12',
  64: 'h-16 w-16'
};

interface IconTileProps {
  children?: React.ReactNode;
  variant?: TileVariant;
  shape?: TileShape;
  size?: TileSize;
  /** Set false when the tile contains meaningful text (e.g. a score). */
  decorative?: boolean;
  className?: string;
}

/** Square/circle container for icons, avatars and score chips. */
export function IconTile({
  children,
  variant = 'solid',
  shape = 'square',
  size = 40,
  decorative = true,
  className
}: IconTileProps) {
  return (
    <span
      aria-hidden={decorative || undefined}
      className={cn('flex shrink-0 items-center justify-center', VARIANTS[variant], SHAPES[shape], SIZES[size], className)}>
      
      {children}
    </span>);

}