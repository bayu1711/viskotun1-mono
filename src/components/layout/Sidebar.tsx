import Link from 'next/link';
import { COPY } from '../../data/copy';
import { ROUTES } from '../../data/navigation';
import { SidebarNav } from './SidebarNav';
import { TodaySummaryCard } from './TodaySummaryCard';

export function Sidebar() {
  return (
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-ink/10 px-7 py-8 lg:flex">
      <Link href={ROUTES.landing} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
        <span aria-hidden="true" className="text-xl font-medium italic tracking-tighter">
          {COPY.brand.mark}
        </span>
        <span className="text-body lowercase">{COPY.brand.name}</span>
      </Link>
      <SidebarNav className="mt-14" />
      <TodaySummaryCard className="mt-auto" />
    </aside>);

}