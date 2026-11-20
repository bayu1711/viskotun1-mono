'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  type AppLocale,
  type LocaleCopy,
  type LocaleMeta,
  SUPPORTED_LOCALES,
  getLocaleCopy,
  getLocaleMeta,
  isSupportedLocale,
  resolveLanguagePair
} from '../data/locales';
import { AuthContext } from './AuthContext';

const STORAGE_KEY = 'viskotun1_locale';

export interface LocaleContextValue {
  locale: AppLocale;
  localeMeta: LocaleMeta;
  primaryLocale: AppLocale;
  secondaryLocale: AppLocale | null;
  supportedLocales: readonly LocaleMeta[];
  isRtl: boolean;
  copy: LocaleCopy;
  setLocale: (locale: AppLocale) => void;
  toggleLocale: () => void;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({
  children,
  initialLocale = 'en'
}: {
  children: React.ReactNode;
  initialLocale?: AppLocale;
}) {
  const authContext = useContext(AuthContext);
  const [locale, setLocaleState] = useState<AppLocale>(initialLocale);

  const { primary: primaryLocale, secondary: secondaryLocale } = useMemo(
    () =>
      resolveLanguagePair(
        authContext?.userProfile?.primaryLanguage,
        authContext?.userProfile?.secondaryLanguage
      ),
    [authContext?.userProfile?.primaryLanguage, authContext?.userProfile?.secondaryLanguage]
  );

  // Initialize from localStorage or browser preferences
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (isSupportedLocale(stored)) {
        setLocaleState(stored);
        return;
      }
      // If browser prefers a supported non-default locale (e.g., Arabic), adopt it
      const browserPref = window.navigator.language?.toLowerCase();
      if (browserPref && browserPref.startsWith('ar')) {
        setLocaleState('ar');
      }
    } catch {
      // Storage access blocked or SSR fallback
    }
  }, []);

  // Keep active locale valid when the user updates their primary/secondary language pair in Profile
  const prevPairRef = useRef({ primary: primaryLocale, secondary: secondaryLocale });
  useEffect(() => {
    const prev = prevPairRef.current;
    const pairChanged = prev.primary !== primaryLocale || prev.secondary !== secondaryLocale;
    prevPairRef.current = { primary: primaryLocale, secondary: secondaryLocale };
    if (pairChanged && locale !== primaryLocale && locale !== secondaryLocale) {
      setLocaleState(primaryLocale);
      try {
        window.localStorage.setItem(STORAGE_KEY, primaryLocale);
      } catch {
        // Storage access blocked
      }
    }
  }, [locale, primaryLocale, secondaryLocale]);

  const localeMeta = useMemo(() => getLocaleMeta(locale), [locale]);
  const isRtl = localeMeta.dir === 'rtl';

  // Synchronize document dir and lang attributes for browser and accessibility
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = locale;
      document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
      if (isRtl) {
        document.documentElement.classList.add('rtl-layout');
      } else {
        document.documentElement.classList.remove('rtl-layout');
      }
    }
  }, [locale, isRtl]);

  const setLocale = useCallback((nextLocale: AppLocale) => {
    if (!isSupportedLocale(nextLocale)) return;
    setLocaleState(nextLocale);
    try {
      window.localStorage.setItem(STORAGE_KEY, nextLocale);
    } catch {
      // Storage access blocked
    }
  }, []);

  const toggleLocale = useCallback(() => {
    if (!secondaryLocale) {
      setLocale(primaryLocale);
      return;
    }
    setLocale(locale === primaryLocale ? secondaryLocale : primaryLocale);
  }, [locale, primaryLocale, secondaryLocale, setLocale]);

  const copy = useMemo(() => getLocaleCopy(locale), [locale]);

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      localeMeta,
      primaryLocale,
      secondaryLocale,
      supportedLocales: SUPPORTED_LOCALES,
      isRtl,
      copy,
      setLocale,
      toggleLocale
    }),
    [locale, localeMeta, primaryLocale, secondaryLocale, isRtl, copy, setLocale, toggleLocale]
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error('useLocale must be used within a LocaleProvider');
  }
  return context;
}
