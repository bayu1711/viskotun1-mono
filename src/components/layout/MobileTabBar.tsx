'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import { useAssistant } from '../../contexts/AssistantContext';
import { COPY } from '../../data/copy';
import { navItems } from '../../data/navigation';
import { cn } from '../../utils/cn';
import { Icon } from '../ui/Icon';

export function MobileTabBar() {
  const { openAssistant, isOpen } = useAssistant();
  const pathname = usePathname();
  const currentPath = pathname ?? '';

  return (
    <nav aria-label={COPY.nav.mobileLabel} className="fixed inset-x-0 bottom-0 z-nav px-4 pb-4 lg:hidden">
      <div className="mx-auto flex max-w-md items-center gap-2">
        <ul className="flex flex-1 items-center rounded-full border border-ink/10 bg-white p-1.5">
          {navItems.map((item) => {
            const isActive = item.end ? currentPath === item.href : currentPath.startsWith(item.href);
            return (
              <li key={item.href} className="flex-1">
                <Link
                  href={item.href}
                  aria-label={item.label}
                  className={cn(
                    'flex items-center justify-center gap-1.5 rounded-full py-2.5 text-xs transition-colors',
                    isActive ? 'bg-ink text-white' : 'text-ink/40'
                  )}
                >
                  <Icon icon={item.icon} size="md" />
                  {isActive && <span>{item.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
        <button
          type="button"
          onClick={() => openAssistant('ask')}
          aria-label={COPY.shell.openAssistant}
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          className="flex h-fab w-fab shrink-0 items-center justify-center rounded-full bg-orange text-white shadow-float transition-transform active:scale-95"
        >
          <Icon icon={AutoAwesomeOutlinedIcon} size="xl" />
        </button>
      </div>
    </nav>
  );
}