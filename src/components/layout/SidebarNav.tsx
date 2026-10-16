'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import HelpOutlineOutlinedIcon from '@mui/icons-material/HelpOutlineOutlined';
import { useProtocol } from '../../contexts/ProtocolContext';
import { COPY } from '../../data/copy';
import { navItems } from '../../data/navigation';
import { cn } from '../../utils/cn';
import { Icon } from '../ui/Icon';

interface SidebarNavProps {
  className?: string;
}

export function SidebarNav({ className }: SidebarNavProps) {
  const pathname = usePathname();
  const currentPath = pathname ?? '';
  const { openHowTo } = useProtocol();

  return (
    <nav aria-label={COPY.nav.primaryLabel} className={className}>
      <ul className="space-y-1">
        {navItems.map((item) => {
          const isActive = item.end ? currentPath === item.href : currentPath.startsWith(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  'flex items-center gap-3 py-2 text-2xl lowercase transition-colors focus:outline-none focus-visible:underline',
                  isActive ? 'text-ink' : 'text-ink/30 hover:text-ink/60'
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn('h-2 w-2 rounded-full', isActive ? 'bg-ink' : 'bg-transparent')}
                />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="mt-8 border-t border-ink/10 pt-4">
        <button
          type="button"
          onClick={openHowTo}
          className="flex items-center gap-2.5 rounded-full py-1.5 text-xs lowercase font-medium text-ink/60 transition-colors hover:text-ink focus:outline-none focus-visible:underline"
        >
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-cream text-ink">
            <Icon icon={HelpOutlineOutlinedIcon} size="xs" />
          </span>
          <span>{COPY.howTo.buttonShort}</span>
        </button>
      </div>
    </nav>
  );
}