import { COPY } from '../copy';
import { COPY_AR_OVERRIDE } from './ar';
import type { AppLocale, DeepPartial, LocaleCopy } from './types';

export * from './types';
export * from './glossary';

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
