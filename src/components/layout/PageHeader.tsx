import React from 'react';
import { RoutineSwitcher } from '../routine/RoutineSwitcher';
import { SectionHeading } from '../ui/SectionHeading';

interface PageHeaderProps {
  eyebrow: string;
  title: string;
  children?: React.ReactNode;
}

/** Routine switcher + page title shared by every route. */
export function PageHeader({ eyebrow, title, children }: PageHeaderProps) {
  return (
    <header>
      <div className="mb-5">
        <RoutineSwitcher />
      </div>
      <SectionHeading as="h1" size="xl" eyebrow={eyebrow} title={title} />
      {children}
    </header>);

}