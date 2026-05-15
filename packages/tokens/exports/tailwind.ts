/**
 * Tailwind theme export for `@solariis/pot-tokens`.
 *
 * Spread `tailwindTheme` into `theme.extend` in `tailwind.config.ts`:
 *
 * ```ts
 * import { tailwindTheme } from '@solariis/pot-tokens/tailwind';
 *
 * export default {
 *   theme: { extend: tailwindTheme },
 * } satisfies Config;
 * ```
 *
 * The shape mirrors the POC's existing `tailwind.config.ts` (`pot-dark` /
 * `pot-light` / `pot-accent` brand keys + `n.*` neutral scale + `success` /
 * `danger` / `warning` / `info` status colors).
 */

import { colors, neutrals } from '../src/colors';
import { fontFamily, fontSize, fontWeight } from '../src/typography';
import { spacing } from '../src/spacing';
import { radii } from '../src/radii';
import { shadows } from '../src/shadows';
import { breakpoints } from '../src/breakpoints';

export const tailwindColors = {
  // Brand surfaces — Tailwind utility-friendly names matching the POC.
  'pot-dark': colors.primaryBlack,
  'pot-light': colors.primaryLight,
  'pot-accent': colors.accent,

  // Status.
  success: colors.success,
  danger: colors.danger,
  warning: colors.warning,
  info: colors.info,

  // Neutral scale exposed as `n-100`/`n-200`/etc.
  n: { ...neutrals },
} as const;

export const tailwindFontFamily = {
  sans: ['Inter', '"Open Sans"', 'system-ui', 'sans-serif'],
} as const;

export const tailwindFontSize = {
  xs: fontSize.xs,
  sm: fontSize.sm,
  base: fontSize.base,
  lg: fontSize.lg,
  xl: fontSize.xl,
  '2xl': fontSize['2xl'],
  // Override Tailwind's 3xl (30px) and 4xl (36px) to match PRD canon.
  '3xl': [fontSize['3xl'], { lineHeight: '1.1' }],
  '4xl': [fontSize['4xl'], { lineHeight: '1.05' }],
  display: [fontSize.display, { lineHeight: '1.05', fontWeight: '700' }],
} as const;

export const tailwindFontWeight = {
  regular: String(fontWeight.regular),
  medium: String(fontWeight.medium),
  semibold: String(fontWeight.semibold),
  bold: String(fontWeight.bold),
} as const;

export const tailwindSpacing = { ...spacing } as const;

export const tailwindBorderRadius = { ...radii } as const;

export const tailwindBoxShadow = { ...shadows } as const;

export const tailwindScreens = { ...breakpoints } as const;

/**
 * The composed `theme.extend` payload. Designed to be spread directly so
 * downstream `tailwind.config.ts` files can layer on consumer-specific
 * extensions without losing POT canon.
 */
export const tailwindTheme = {
  colors: tailwindColors,
  fontFamily: tailwindFontFamily,
  fontSize: tailwindFontSize,
  fontWeight: tailwindFontWeight,
  spacing: tailwindSpacing,
  borderRadius: tailwindBorderRadius,
  boxShadow: tailwindBoxShadow,
  screens: tailwindScreens,
} as const;
