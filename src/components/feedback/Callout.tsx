import React from 'react';
import { cn } from '../../utils/cn';

type CalloutTone = 'blush' | 'cream' | 'mint';

const TONES: Record<CalloutTone, string> = {
  blush: 'bg-blush',
  cream: 'bg-cream',
  mint: 'bg-mint'
};

interface CalloutProps {
  tone: CalloutTone;
  children: React.ReactNode;
  icon?: React.ReactNode;
  role?: 'alert' | 'status';
  className?: string;
}

/** Tinted inline message for warnings, confirmations and safety alerts. */
export function Callout({ tone, children, icon, role, className }: CalloutProps) {
  return (
    <div
      role={role}
      className={cn('flex items-start gap-3 rounded-callout p-4 text-sm leading-relaxed text-ink', TONES[tone], className)}>
      
      {icon}
      <div className="min-w-0 flex-1">{children}</div>
    </div>);

}