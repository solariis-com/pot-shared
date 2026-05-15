/**
 * React Native export for `@solariis-com/pot-tokens`.
 *
 * All values are typed for direct consumption inside `StyleSheet.create({...})`:
 *   - colors  → hex strings
 *   - spacing → numbers (RN does not accept `px` suffix)
 *   - radii   → numbers
 *   - shadows → iOS+Android RN shape (`shadowColor` / `shadowOffset` /
 *               `shadowOpacity` / `shadowRadius` / `elevation`)
 *   - font sizes → numbers
 */

import { colors, brandColors, neutrals } from '../src/colors';
import { fontFamily, fontSizePx, fontWeight } from '../src/typography';
import { spacingPx } from '../src/spacing';
import { radiiPx, radiiAliasesPx } from '../src/radii';
import { nativeShadows } from '../src/shadows';
import { breakpointsPx } from '../src/breakpoints';

/**
 * RN colors — pure hex strings, ready for `style={{ color: ... }}`.
 */
export const nativeColors = {
  primaryBlack: colors.primaryBlack,
  primaryLight: colors.primaryLight,
  accent: colors.accent,
  success: colors.success,
  danger: colors.danger,
  warning: colors.warning,
  info: colors.info,
  neutral: { ...neutrals },
} as const;

export const nativeSpacing = { ...spacingPx } as const;

export const nativeRadii = {
  ...radiiPx,
  alias: { ...radiiAliasesPx },
} as const;

export const nativeTypography = {
  family: {
    /**
     * RN doesn't accept a fallback chain inside `fontFamily`. Use 'Inter' if
     * the font is bundled; the platform will fall back to system otherwise.
     */
    sans: 'Inter',
    fallback: 'Open Sans',
    /** Raw stack (string) — kept for parity with the web export. */
    stack: fontFamily.stack,
  },
  size: { ...fontSizePx },
  weight: {
    regular: String(fontWeight.regular) as '400',
    medium: String(fontWeight.medium) as '500',
    semibold: String(fontWeight.semibold) as '600',
    bold: String(fontWeight.bold) as '700',
  },
} as const;

export const nativeShadowTokens = { ...nativeShadows } as const;

export const nativeBreakpoints = { ...breakpointsPx } as const;

/**
 * Aggregate object — drop directly into a project's theme provider or pass
 * to `StyleSheet.create` patterns.
 */
export const nativeStyleSheet = {
  colors: nativeColors,
  brandColors: { ...brandColors },
  spacing: nativeSpacing,
  radii: nativeRadii,
  typography: nativeTypography,
  shadows: nativeShadowTokens,
  breakpoints: nativeBreakpoints,
} as const;
