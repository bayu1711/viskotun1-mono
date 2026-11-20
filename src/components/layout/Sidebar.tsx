import Link from 'next/link';
import Image from 'next/image';
import { ROUTES } from '../../data/navigation';
import { SidebarNav } from './SidebarNav';
import { TodaySummaryCard } from './TodaySummaryCard';

import { useLocale } from '../../contexts/LocaleContext';
export function Sidebar() {
  const { copy } = useLocale();
  return (
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-ink/10 px-7 py-8 lg:flex">
      <Link href={ROUTES.landing} className="flex items-center hover:opacity-85 transition-opacity">
        <Image
          src={copy.brand.logoUrl}
          alt={copy.brand.name}
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