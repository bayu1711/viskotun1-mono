import React from 'react';
import { ProtocolSwitcher } from '../protocol/ProtocolSwitcher';
import { SectionHeading } from '../ui/SectionHeading';

interface PageHeaderProps {
  eyebrow: string;
  title: string;
  children?: React.ReactNode;
}

/** Protocol switcher + page title shared by every route. */
export function PageHeader({ eyebrow, title, children }: PageHeaderProps) {
  return (
    <header>
      <div className="mb-5">
        <ProtocolSwitcher />
      </div>
      <SectionHeading as="h1" size="xl" eyebrow={eyebrow} title={title} />
      {children}
    </header>);

}