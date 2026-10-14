import React from 'react';
import { COPY } from '../../data/copy';
import { SidebarNav } from './SidebarNav';
import { TodaySummaryCard } from './TodaySummaryCard';

export function Sidebar() {
  return (
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-ink/10 px-7 py-8 lg:flex">
      <p className="flex items-center gap-2">
        <span aria-hidden="true" className="text-xl font-medium italic tracking-tighter">
          {COPY.brand.mark}
        </span>
        <span className="text-body lowercase">{COPY.brand.name}</span>
      </p>
      <SidebarNav className="mt-14" />
      <TodaySummaryCard className="mt-auto" />
    </aside>);

}