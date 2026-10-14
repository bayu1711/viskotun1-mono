import React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '../../utils/cn';

type Variant = 'outline' | 'solid' | 'outline-light';
type Size = 36 | 38 | 40;

const VARIANTS: Record<Variant, string> = {
  outline: 'border border-ink text-ink hover:bg-ink hover:text-white',
  solid: 'bg-ink text-white hover:bg-ink/85',
  'outline-light': 'border border-white/50 text-white hover:bg-white hover:text-ink'
};

const SIZES: Record<Size, string> = {
  36: 'h-9 w-9',
  38: 'h-cell w-cell',
  40: 'h-10 w-10'
};

const BASE =
'inline-flex shrink-0 items-center justify-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/30 disabled:pointer-events-none disabled:opacity-30';

interface CircleButtonProps {
  /** Accessible name — required because the button is icon-only. */
  label: string;
  children: React.ReactNode;
  variant?: Variant;
  size?: Size;
  to?: string;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

export function CircleButton({
  label,
  children,
  variant = 'outline',
  size = 40,
  to,
  href,
  onClick,
  disabled,
  className
}: CircleButtonProps) {
  const classes = cn(BASE, VARIANTS[variant], SIZES[size], className);

  if (to) {
    return (
      <Link to={to} aria-label={label} onClick={onClick} className={classes}>
        {children}
      </Link>);

  }
  if (href) {
    return (
      <a href={href} target="_blank" rel="noreferrer" aria-label={label} className={classes}>
        {children}
      </a>);

  }
  return (
    <button type="button" aria-label={label} onClick={onClick} disabled={disabled} className={classes}>
      {children}
    </button>);

}