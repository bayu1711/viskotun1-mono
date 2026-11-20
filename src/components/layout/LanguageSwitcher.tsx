'use client';

import React, { useCallback, useId, useRef, useState } from 'react';
import Link from 'next/link';
import CheckIcon from '@mui/icons-material/Check';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import TranslateOutlinedIcon from '@mui/icons-material/TranslateOutlined';
import TuneIcon from '@mui/icons-material/Tune';
import { AnimatePresence, motion } from 'framer-motion';
import { useLocale } from '../../contexts/LocaleContext';
import { MOTION } from '../../data/config';
import { type AppLocale, getLocaleMeta } from '../../data/locales';
import { ROUTES } from '../../data/navigation';
import { useDismissable } from '../../hooks/useDismissable';
import { cn } from '../../utils/cn';
import { Icon } from '../ui/Icon';

interface LanguageSwitcherProps {
  /** Visual variant matching the authenticated app TopBar or public notice banner. */
  variant?: 'topbar' | 'banner';
  /** Optional explicit pair for public landing pages without a user profile. */
  forcePair?: { primary: AppLocale; secondary: AppLocale };
}

/**
 * Shared header dropdown switching between the user's primary and secondary languages.
 * Hidden automatically in TopBar when secondary language is set to None in Profile.
 */
export function LanguageSwitcher({ variant = 'topbar', forcePair }: LanguageSwitcherProps) {
  const { locale, primaryLocale, secondaryLocale, copy, setLocale } = useLocale();
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const headingId = useId();

  const close = useCallback(() => setIsOpen(false), []);
  useDismissable(rootRef, isOpen, close);

  const first = forcePair ? forcePair.primary : primaryLocale;
  const second = forcePair ? forcePair.secondary : secondaryLocale;

  if (!second || first === second) {
    return null;
  }

  const options = [
    { code: first, roleBadge: copy.shell.primaryBadge, meta: getLocaleMeta(first) },
    { code: second, roleBadge: copy.shell.secondaryBadge, meta: getLocaleMeta(second) }
  ];

  const activeMeta = getLocaleMeta(locale);

  const handleSelect = (nextLocale: AppLocale) => {
    setLocale(nextLocale);
    close();
  };

  return (
    <div ref={rootRef} className="relative inline-block">
      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={isOpen ? listId : undefined}
        aria-label={copy.shell.languageMenuLabel}
        title={copy.shell.languageMenuLabel}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full border border-ink/20 text-xs font-semibold text-ink transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/30 cursor-pointer',
          variant === 'banner'
            ? 'bg-white/80 px-2.5 py-0.5 hover:bg-white'
            : 'bg-cream/70 px-2.5 py-1 hover:bg-cream'
        )}
      >
        <Icon icon={TranslateOutlinedIcon} size="xs" className="text-ink/70" />
        <span>{activeMeta.shortLabel}</span>
        <Icon
          icon={ExpandMoreIcon}
          size="xs"
          className={cn('text-ink/70 transition-transform', isOpen && 'rotate-180')}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: MOTION.popoverOffsetY }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: MOTION.popoverOffsetY }}
            transition={MOTION.fade}
            className="absolute end-0 top-full z-popover mt-2 w-56 rounded-card border border-ink/10 bg-white p-2 shadow-popover"
          >
            <p id={headingId} className="px-2 py-1 text-2xs font-medium uppercase tracking-wider text-ink/55">
              {copy.shell.languageMenuLabel}
            </p>
            <ul id={listId} role="listbox" aria-labelledby={headingId} className="space-y-1">
              {options.map((opt) => {
                const active = locale === opt.code;
                return (
                  <li key={opt.code} role="presentation">
                    <button
                      type="button"
                      role="option"
                      aria-selected={active}
                      onClick={() => handleSelect(opt.code)}
                      className={cn(
                        'flex w-full items-center justify-between gap-2 rounded-tile px-2.5 py-2 text-start text-xs transition-colors cursor-pointer',
                        active
                          ? 'bg-cream font-semibold text-ink'
                          : 'text-ink/80 hover:bg-canvas hover:text-ink'
                      )}
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <span className="font-mono text-2xs uppercase text-ink/55">{opt.code}</span>
                        <span className="truncate">{opt.meta.nativeLabel}</span>
                      </span>
                      <span className="flex shrink-0 items-center gap-1.5">
                        {!forcePair && (
                          <span className="rounded-full bg-ink/5 px-1.5 py-0.5 text-3xs font-medium text-ink/60">
                            {opt.roleBadge}
                          </span>
                        )}
                        {active && <Icon icon={CheckIcon} size="xs" className="text-ink" />}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>

            {variant === 'topbar' && (
              <Link
                href={`${ROUTES.profile}#language`}
                onClick={close}
                className="mt-1.5 flex w-full items-center gap-2 border-t border-ink/10 px-2.5 pt-2 pb-1 text-xs font-medium text-ink/70 transition-colors hover:text-ink"
              >
                <Icon icon={TuneIcon} size="xs" />
                <span>{copy.shell.manageLanguages}</span>
              </Link>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
