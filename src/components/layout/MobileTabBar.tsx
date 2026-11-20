'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAssistant } from '../../contexts/AssistantContext';
import { useLocale } from '../../contexts/LocaleContext';
import { getNavItems } from '../../data/navigation';
import { cn } from '../../utils/cn';
import { Icon } from '../ui/Icon';
import { AIIcon } from '../ui/AIIcon';

export function MobileTabBar() {
  const { openAssistant, isOpen } = useAssistant();
  const { copy } = useLocale();
  const pathname = usePathname();
  const currentPath = pathname ?? '';
  const items = useMemo(() => getNavItems(copy), [copy]);

  return (
    <nav aria-label={copy.nav.mobileLabel} className="fixed inset-x-0 bottom-0 z-nav px-4 pb-4 lg:hidden">
      <div className="mx-auto flex max-w-md items-center gap-2">
        <ul className="flex flex-1 items-center rounded-full border border-ink/10 bg-white p-1.5">
          {items.map((item) => {
            const isActive = item.end ? currentPath === item.href : currentPath.startsWith(item.href);
            return (
              <li key={item.href} className="flex-1">
                <Link
                  href={item.href}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    'flex min-h-11 items-center justify-center gap-1.5 rounded-full px-2 text-xs transition-colors',
                    isActive ? 'bg-ink font-medium text-white' : 'text-ink/75 hover:text-ink'
                  )}
                >
                  <Icon icon={item.icon} size="md" className="shrink-0" />
                  {/* Labels on every tab: icon-only items hid two of the three destinations. */}
                  <span className="truncate">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
        <button
          type="button"
          onClick={() => openAssistant('ask')}
          aria-label={copy.shell.openAssistant}
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          className="flex h-fab w-fab shrink-0 items-center justify-center rounded-full bg-ink text-white shadow-float transition-transform active:scale-95 cursor-pointer"
        >
          <AIIcon size="xl" />
        </button>
      </div>
    </nav>
  );
}