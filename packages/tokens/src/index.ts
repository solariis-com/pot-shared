/**
 * @solariis/pot-tokens — design tokens for the POT MVP.
 *
 * Source of truth:
 *   - `pot-poc/lib/tokens.ts` (canonical export — mirrored exactly)
 *   - `pot-poc/docs/PRD.md` v2.6 §"Design System Canónico"
 *
 * Per-platform exports (CSS, Tailwind, React Native) live under the
 * `exports/` subpath — import via `@solariis/pot-tokens/css`,
 * `@solariis/pot-tokens/tailwind`, `@solariis/pot-tokens/native`.
 */

export * from './colors';
export * from './typography';
export * from './spacing';
export * from './radii';
export * from './shadows';
export * from './breakpoints';

import { colors, brandColors, neutrals } from './colors';
import { typography } from './typography';
import { spacing, spacingPx, spacingScale } from './spacing';
import { radii, radiiPx, radiiAliases, radiiAliasesPx } from './radii';
import { shadows, nativeShadows } from './shadows';
import { breakpoints, breakpointsPx } from './breakpoints';

/**
 * Convenience aggregate of all tokens. Useful for design-system showcases
 * or downstream tooling that needs a single object to iterate over.
 */
export const tokens = {
  colors,
  brandColors,
  neutrals,
  typography,
  spacing,
  spacingPx,
  spacingScale,
  radii,
  radiiPx,
  radiiAliases,
  radiiAliasesPx,
  shadows,
  nativeShadows,
  breakpoints,
  breakpointsPx,
} as const;
