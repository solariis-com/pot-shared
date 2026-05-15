/**
 * Public types for `@solariis/pot-microcopy`.
 *
 * ES is the shape-canonical catalog (per `pot-poc/lib/microcopy.ts` source of
 * truth). EN must match the ES shape one-for-one; the parity assertion lives
 * in `tests/catalog-completeness.spec.ts`.
 */

import esCatalog from './catalog/es';

/** Supported user-facing locales. */
export type Locale = 'es' | 'en';

/**
 * Shape of one microcopy catalog (worker.*, commerce.*, consumer.*, admin.*,
 * shared.*). Derived from the ES catalog so the type stays in lockstep with
 * the source of truth.
 */
export type MicrocopyCatalog = typeof esCatalog;

/**
 * Recursive key path through a catalog (e.g. `'worker.home.greeting'`). Useful
 * for callers that want to assert a key exists at compile time.
 */
export type MicrocopyKey<T = MicrocopyCatalog, K extends keyof T & string = keyof T & string> = K extends keyof T
  ? T[K] extends Record<string, unknown>
    ? `${K}.${MicrocopyKey<T[K]>}`
    : K
  : never;
