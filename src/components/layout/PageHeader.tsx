import React from 'react';
import Link from 'next/link';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import { RoutineSwitcher } from '../routine/RoutineSwitcher';
import { SectionHeading } from '../ui/SectionHeading';
import { Icon } from '../ui/Icon';
import { COPY } from '../../data/copy';
import { ROUTES } from '../../data/navigation';

interface PageHeaderProps {
  eyebrow: string;
  title: string;
  children?: React.ReactNode;
  switcherExtra?: React.ReactNode;
}

/** Routine switcher + page title shared by every route. */
export function PageHeader({ eyebrow, title, children, switcherExtra }: PageHeaderProps) {
  return (
    <header>
      <div className="mb-5 flex flex-wrap items-center gap-2.5">
        <RoutineSwitcher />
        {switcherExtra !== undefined ? (
          switcherExtra
        ) : (
          <Link
            href={`${ROUTES.community}?tab=explore`}
            className="inline-flex items-center gap-1.5 rounded-full border border-ink/20 bg-cream/70 px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:border-ink hover:bg-mint"
          >
            <Icon icon={AutoAwesomeOutlinedIcon} size="xs" />
            <span>{COPY.howTo.buttonExploreSamples}</span>
          </Link>
        )}
      </div>
      <SectionHeading as="h1" size="xl" eyebrow={eyebrow} title={title} />
      {children}
    </header>
  );
}