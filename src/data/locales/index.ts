import { COPY } from '../copy';
import { COPY_AR_OVERRIDE } from './ar';
import type { AppLocale, DeepPartial, LocaleCopy, LocaleMeta, SecondaryLanguage } from './types';

export * from './types';
export * from './glossary';

export const SUPPORTED_LOCALES: readonly LocaleMeta[] = [
  {
    code: 'en',
    shortLabel: 'EN',
    nativeLabel: 'English',
    englishName: 'English',
    dir: 'ltr'
  },
  {
    code: 'ar',
    shortLabel: 'العربية',
    nativeLabel: 'العربية',
    englishName: 'Arabic',
    dir: 'rtl'
  }
] as const;

export function isSupportedLocale(value: unknown): value is AppLocale {
  return typeof value === 'string' && SUPPORTED_LOCALES.some((item) => item.code === value);
}

export function getLocaleMeta(locale: AppLocale): LocaleMeta {
  return SUPPORTED_LOCALES.find((item) => item.code === locale) ?? SUPPORTED_LOCALES[0];
}

export function resolveLanguagePair(
  primaryLanguage?: AppLocale,
  secondaryLanguage?: SecondaryLanguage
): { primary: AppLocale; secondary: AppLocale | null } {
  const primary: AppLocale = isSupportedLocale(primaryLanguage) ? primaryLanguage : 'en';
  if (secondaryLanguage === 'none') {
    return { primary, secondary: null };
  }
  if (secondaryLanguage && isSupportedLocale(secondaryLanguage)) {
    return {
      primary,
      secondary: secondaryLanguage === primary ? null : secondaryLanguage
    };
  }
  const fallbackSecondary = SUPPORTED_LOCALES.find((item) => item.code !== primary)?.code ?? null;
  return { primary, secondary: fallbackSecondary };
}

function isObject(item: unknown): item is Record<string, unknown> {
  return Boolean(item && typeof item === 'object' && !Array.isArray(item));
}

export function mergeLocaleCopy(
  target: LocaleCopy,
  override: DeepPartial<LocaleCopy>
): LocaleCopy {
  const output = { ...target } as Record<string, unknown>;
  if (isObject(target) && isObject(override)) {
    for (const key of Object.keys(override)) {
      const overrideVal = (override as Record<string, unknown>)[key];
      const targetVal = (target as unknown as Record<string, unknown>)[key];

      if (overrideVal === undefined) continue;

      if (isObject(targetVal) && isObject(overrideVal)) {
        output[key] = mergeLocaleCopy(
          targetVal as unknown as LocaleCopy,
          overrideVal as unknown as DeepPartial<LocaleCopy>
        );
      } else {
        output[key] = overrideVal;
      }
    }
  }
  return output as unknown as LocaleCopy;
}

export const COPY_EN: LocaleCopy = COPY as unknown as LocaleCopy;
export const COPY_AR: LocaleCopy = mergeLocaleCopy(COPY_EN, COPY_AR_OVERRIDE);

export function getLocaleCopy(locale: AppLocale): LocaleCopy {
  return locale === 'ar' ? COPY_AR : COPY_EN;
}
