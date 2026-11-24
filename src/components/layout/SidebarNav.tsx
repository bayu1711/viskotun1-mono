'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { useLocale } from '../../contexts/LocaleContext';
import { getNavItems, ROUTES } from '../../data/navigation';
import { cn } from '../../utils/cn';

interface SidebarNavProps {
  className?: string;
}

export function SidebarNav({ className }: SidebarNavProps) {
  const { copy } = useLocale();
  const { isAdmin } = useAuth();
  const pathname = usePathname();
  const currentPath = pathname ?? '';
  const items = useMemo(() => getNavItems(copy), [copy]);
  const isAdminActive = currentPath === ROUTES.admin || currentPath.startsWith(`${ROUTES.admin}/`);

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
        {isAdmin && (
          <li className="pt-2">
            <Link
              href={ROUTES.admin}
              className={cn(
                'flex items-center gap-3 py-2 text-2xl transition-colors focus:outline-none focus-visible:underline',
                isAdminActive ? 'text-ink' : 'text-ink/60 hover:text-ink/80'
              )}
            >
              <span
                aria-hidden="true"
                className={cn('h-2 w-2 rounded-full', isAdminActive ? 'bg-orange' : 'bg-transparent')}
              />
              {copy.nav.admin}
            </Link>
          </li>
        )}
      </ul>
    </nav>
  );
}