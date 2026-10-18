import Link from 'next/link';
import Image from 'next/image';
import { COPY } from '../../data/copy';
import { ROUTES } from '../../data/navigation';
import { SidebarNav } from './SidebarNav';
import { TodaySummaryCard } from './TodaySummaryCard';

export function Sidebar() {
  return (
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-ink/10 px-7 py-8 lg:flex">
      <Link href={ROUTES.landing} className="flex items-center hover:opacity-85 transition-opacity">
        <Image
          src={COPY.brand.logoUrl}
          alt={COPY.brand.name}
          width={136}
          height={33}
          priority
          className="h-7 w-auto object-contain"
        />
      </Link>
      <SidebarNav className="mt-14" />
      <TodaySummaryCard className="mt-auto" />
    </aside>);

}