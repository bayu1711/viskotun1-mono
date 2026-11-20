import type { COPY } from '../copy';

export type DeepString<T> = T extends (...args: infer P) => infer R
  ? (...args: P) => R
  : T extends readonly (infer E)[]
  ? readonly DeepString<E>[]
  : T extends object
  ? { [K in keyof T]: DeepString<T[K]> }
  : T extends string
  ? string
  : T;

export type DeepPartial<T> = T extends (...args: infer P) => infer R
  ? (...args: P) => R
  : T extends readonly (infer E)[]
  ? readonly DeepPartial<E>[]
  : T extends object
  ? { [P in keyof T]?: DeepPartial<T[P]> }
  : T;

export type LocaleCopy = DeepString<typeof COPY>;
export type AppLocale = 'en' | 'ar';
export type SecondaryLanguage = AppLocale | 'none';

export interface LocaleMeta {
  code: AppLocale;
  shortLabel: string;
  nativeLabel: string;
  englishName: string;
  dir: 'ltr' | 'rtl';
}
