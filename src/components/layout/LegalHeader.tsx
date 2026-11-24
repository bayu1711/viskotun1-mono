'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useAuth } from '@/contexts/AuthContext';
import { useLocale } from '@/contexts/LocaleContext';
import { ROUTES } from '@/data/navigation';
import { Icon } from '@/components/ui/Icon';
import { pillClassName } from '@/components/ui/PillButton';

interface LegalHeaderProps {
  showCenterLink?: boolean;
}

export function LegalHeader({ showCenterLink = false }: LegalHeaderProps) {
  const { copy, isRtl } = useLocale();
  const { user, isLoading } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-ink/10 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3 lg:px-8">
        <div className="flex items-center gap-6">
          <Link
            href={ROUTES.landing}
            className="flex min-h-11 items-center gap-2.5 transition-opacity hover:opacity-85"
          >
            <Image
              src={copy.brand.logoUrl}
              alt={copy.brand.name}
              width={136}
              height={33}
              priority
              className="h-8 w-auto object-contain"
            />
          </Link>

          <nav className="hidden items-center gap-1 text-sm font-medium text-ink/75 sm:flex">
            <Link
              href={ROUTES.landing}
              className="inline-flex min-h-10 items-center gap-1.5 rounded-full px-3 py-2 transition-colors hover:bg-ink/5 hover:text-ink"
            >
              <Icon icon={ArrowBackIcon} size="xs" className={isRtl ? 'rotate-180' : undefined} />
              <span>{copy.legal.backToHome}</span>
            </Link>
            {showCenterLink && (
              <Link
                href={ROUTES.legal}
                className="inline-flex min-h-10 items-center rounded-full px-3 py-2 transition-colors hover:bg-ink/5 hover:text-ink"
              >
                {copy.legal.legalCenterNav}
              </Link>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {!isLoading && user ? (
            <Link href={ROUTES.routine} className={pillClassName('ink', 'sm', 'min-h-10 px-4 font-semibold')}>
              {copy.landing.ctaGoToApp}
            </Link>
          ) : !isLoading ? (
            <>
              <Link
                href={ROUTES.login}
                className="inline-flex min-h-10 items-center px-3 text-sm font-medium text-ink/80 transition-colors hover:text-ink"
              >
                {copy.landing.ctaLogin}
              </Link>
              <Link href={ROUTES.signup} className={pillClassName('ink', 'sm', 'min-h-10 px-4 font-semibold')}>
                {copy.landing.ctaSignup}
              </Link>
            </>
          ) : (
            <div className="h-10 w-32 animate-pulse rounded-full bg-ink/5" />
          )}
        </div>
      </div>
    </header>
  );
}
