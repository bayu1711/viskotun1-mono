'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLocale } from '../../contexts/LocaleContext';
import { getNavItems } from '../../data/navigation';
import { cn } from '../../utils/cn';

interface SidebarNavProps {
  className?: string;
}

export function SidebarNav({ className }: SidebarNavProps) {
  const { copy } = useLocale();
  const pathname = usePathname();
  const currentPath = pathname ?? '';
  const items = useMemo(() => getNavItems(copy), [copy]);

  return (
    <nav aria-label={copy.nav.primaryLabel} className={className}>
      <ul className="space-y-1">
        {items.map((item) => {
          const isActive = item.end ? currentPath === item.href : currentPath.startsWith(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  'flex items-center gap-3 py-2 text-2xl transition-colors focus:outline-none focus-visible:underline',
                  isActive ? 'text-ink' : 'text-ink/60 hover:text-ink/60'
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn('h-2 w-2 rounded-full', isActive ? 'bg-orange' : 'bg-transparent')}
                />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}