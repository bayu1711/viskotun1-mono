'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { type AppLocale, type LocaleCopy, getLocaleCopy } from '../data/locales';

const STORAGE_KEY = 'viskotun1_locale';

export interface LocaleContextValue {
  locale: AppLocale;
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
  const [locale, setLocaleState] = useState<AppLocale>(initialLocale);

  // Initialize from localStorage or browser preferences
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY) as AppLocale | null;
      if (stored === 'en' || stored === 'ar') {
        setLocaleState(stored);
        return;
      }
      // If browser prefers Arabic, adopt it
      const browserPref = window.navigator.language?.toLowerCase();
      if (browserPref && browserPref.startsWith('ar')) {
        setLocaleState('ar');
      }
    } catch {
      // Storage access blocked or SSR fallback
    }
  }, []);

  const isRtl = locale === 'ar';

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
    setLocaleState(nextLocale);
    try {
      window.localStorage.setItem(STORAGE_KEY, nextLocale);
    } catch {
      // Storage access blocked
    }
  }, []);

  const toggleLocale = useCallback(() => {
    setLocale(locale === 'en' ? 'ar' : 'en');
  }, [locale, setLocale]);

  const copy = useMemo(() => getLocaleCopy(locale), [locale]);

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      isRtl,
      copy,
      setLocale,
      toggleLocale
    }),
    [locale, isRtl, copy, setLocale, toggleLocale]
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
