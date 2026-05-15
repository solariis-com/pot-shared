/**
 * `@solariis-com/pot-microcopy` — bilingual microcopy catalog for POT MVP.
 *
 * Default usage:
 *
 *   import { es, en, interpolate } from '@solariis-com/pot-microcopy';
 *   es.worker.home.greeting({ firstName: 'Lucía' });
 *   en.worker.home.greeting({ firstName: 'Lucia' });
 *
 * Or pick by locale:
 *
 *   import { getCatalog, type Locale } from '@solariis-com/pot-microcopy';
 *   const t = getCatalog(locale);
 *
 * The ES catalog is the source of truth (mirrors `pot-poc/lib/microcopy.ts`).
 * EN is a sync mirror. See README for the bilingual policy.
 */

import esDefault from './catalog/es';
import enDefault from './catalog/en';
import type { Locale, MicrocopyCatalog } from './types';

// EN is a sync mirror of ES; the structure matches but string literals differ.
// Cast widens EN literal types to the canonical ES shape (parity verified by
// tests/catalog-completeness.spec.ts).
const enTyped = enDefault as unknown as MicrocopyCatalog;

export const es: MicrocopyCatalog = esDefault;
export const en: MicrocopyCatalog = enTyped;
export * from './types';
export * from './utils/interpolate';

/**
 * Resolve a catalog by locale. Falls back to ES when an unknown locale is
 * passed — ES is the source of truth and never goes missing.
 */
export const getCatalog = (locale: Locale): MicrocopyCatalog => {
  switch (locale) {
    case 'en':
      return enTyped;
    case 'es':
    default:
      return esDefault;
  }
};

/** All locales supported by this package. */
export const LOCALES: readonly Locale[] = ['es', 'en'] as const;
