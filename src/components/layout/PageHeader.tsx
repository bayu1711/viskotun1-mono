'use client';

import React from 'react';
import Link from 'next/link';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { RoutineSwitcher } from '../routine/RoutineSwitcher';
import { SectionHeading } from '../ui/SectionHeading';
import { Icon } from '../ui/Icon';
import { ROUTES } from '../../data/navigation';
import { useRoutine } from '../../contexts/RoutineContext';

import { useLocale } from '../../contexts/LocaleContext';
interface PageHeaderProps {
  eyebrow: string;
  title: string;
  children?: React.ReactNode;
  switcherExtra?: React.ReactNode;
  hideRoutineSwitcher?: boolean;
}

/** Routine switcher + page title shared by every route. */
export function PageHeader({
  eyebrow,
  title,
  children,
  switcherExtra,
  hideRoutineSwitcher = false
}: PageHeaderProps) {
  const { copy } = useLocale();
  const { routine } = useRoutine();

  return (
    <header>
      <div className="mb-5 flex flex-wrap items-center gap-2.5">
        {!hideRoutineSwitcher && <RoutineSwitcher />}
        {switcherExtra !== undefined ? (
          switcherExtra
        ) : !routine ? (
          <Link
            href={`${ROUTES.community}?tab=explore`}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-ink/20 bg-cream/70 px-3 text-xs font-medium text-ink transition-colors hover:border-ink hover:bg-mint"
          >
            <Icon icon={TrendingUpIcon} size="xs" />
            <span>{copy.howTo.buttonExploreSamples}</span>
          </Link>
        ) : null}
      </div>
      <SectionHeading as="h1" size="xl" eyebrow={eyebrow} title={title} />
      {children}
    </header>
  );
}