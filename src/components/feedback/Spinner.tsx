import React from 'react';
import { cn } from '../../utils/cn';

interface SpinnerProps {
  className?: string;
}

export function Spinner({ className }: SpinnerProps) {
  return (
    <span
      aria-hidden="true"
      className={cn('h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-current border-r-transparent', className)} />);


}