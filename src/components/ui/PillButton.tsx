import React from 'react';
import { cn } from '../../utils/cn';
import { Spinner } from '../feedback/Spinner';

type Variant = 'primary' | 'orange' | 'ink' | 'outline' | 'success' | 'inverse';
type Size = 'sm' | 'md' | 'lg';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-orange text-white hover:bg-orange/90 font-medium shadow-sm active:bg-orange/95',
  orange: 'bg-orange text-white hover:bg-orange/90 font-medium shadow-sm active:bg-orange/95',
  ink: 'bg-ink text-white hover:bg-ink/85',
  outline: 'border border-ink text-ink hover:bg-ink hover:text-white',
  success: 'bg-mint text-ink',
  inverse: 'bg-white text-ink hover:bg-white/90'
};

const SIZES: Record<Size, string> = {
  sm: 'px-5 py-2.5',
  md: 'px-4 py-3.5',
  lg: 'px-4 py-4'
};

/** Pill styles for links that must look like a PillButton without nesting a button inside them. */
export function pillClassName(variant: Variant = 'primary', size: Size = 'lg', className?: string) {
  return cn(
    'inline-flex items-center justify-center gap-2 rounded-full text-sm transition-[color,background-color,border-color,box-shadow,opacity,transform] duration-150 ease-out-strong active:scale-[0.97] disabled:scale-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/30 disabled:cursor-default',
    VARIANTS[variant],
    SIZES[size],
    className
  );
}

interface PillButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
}

export function PillButton({
  variant = 'primary',
  size = 'lg',
  loading = false,
  fullWidth = false,
  disabled,
  className,
  children,
  type = 'button',
  ...rest
}: PillButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={pillClassName(variant, size, cn(fullWidth && 'w-full', loading && 'opacity-70', className))}
      {...rest}>
      
      {loading && <Spinner />}
      {children}
    </button>);

}