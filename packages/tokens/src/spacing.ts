/**
 * Spacing tokens — PRD v2.6 §"Spacing & Radii":
 * 4-base scale 4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 48 / 64.
 *
 * Numeric values are exported in `spacingPx` (React Native).
 * CSS-friendly pixel strings are exported in `spacing`.
 * Both share the same semantic-alias keys as `pot-poc/lib/tokens.ts`.
 */

export const spacingPx = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 64,
} as const;

export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '12px',
  base: '16px',
  lg: '20px',
  xl: '24px',
  '2xl': '32px',
  '3xl': '40px',
  '4xl': '48px',
  '5xl': '64px',
} as const;

/**
 * Ordered numeric scale — `[4, 8, 12, 16, 20, 24, 32, 40, 48, 64]`.
 * Useful for token-completeness assertions and Tailwind theme generation.
 */
export const spacingScale = [4, 8, 12, 16, 20, 24, 32, 40, 48, 64] as const;

export type SpacingToken = keyof typeof spacing;
