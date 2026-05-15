/**
 * Breakpoint tokens — mobile-first.
 *
 * Not currently expressed in `pot-poc/lib/tokens.ts` (the POC is mobile-only),
 * but standardized here per the package spec so future pot-web / consumer-web
 * surfaces share the same min-width breakpoints. Values follow the
 * Tailwind-default scale to minimize surprise for downstream consumers.
 */

export const breakpointsPx = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
} as const;

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
} as const;

export type BreakpointToken = keyof typeof breakpoints;
