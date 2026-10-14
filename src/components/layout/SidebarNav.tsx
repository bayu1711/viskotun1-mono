import React from 'react';
import { NavLink } from 'react-router-dom';
import { COPY } from '../../data/copy';
import { navItems } from '../../data/navigation';
import { cn } from '../../utils/cn';

interface SidebarNavProps {
  className?: string;
}

export function SidebarNav({ className }: SidebarNavProps) {
  return (
    <nav aria-label={COPY.nav.primaryLabel} className={className}>
      <ul className="space-y-1">
        {navItems.map((item) =>
        <li key={item.to}>
            <NavLink
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
            cn(
              'flex items-center gap-3 py-2 text-2xl lowercase transition-colors focus:outline-none focus-visible:underline',
              isActive ? 'text-ink' : 'text-ink/30 hover:text-ink/60'
            )
            }>
            
              {({ isActive }) =>
            <>
                  <span
                aria-hidden="true"
                className={cn('h-2 w-2 rounded-full', isActive ? 'bg-ink' : 'bg-transparent')} />
              
                  {item.label}
                </>
            }
            </NavLink>
          </li>
        )}
      </ul>
    </nav>);

}