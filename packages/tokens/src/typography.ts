/**
 * Typography tokens — mirrors PRD v2.6 §"Typography" + `pot-poc/lib/tokens.ts`.
 *
 * - Family: Inter (primary), Open Sans (fallback)
 * - Scale: 12 / 14 / 16 / 18 / 20 / 24 / 32 / 40 / 56 (px)
 * - Weights: 400 / 500 / 600 / 700
 */

export const fontFamily = {
  /** Primary family — Inter with fallbacks. */
  sans: 'Inter, system-ui, sans-serif',
  /** Explicit fallback chain — kept for consumers that want Open Sans first. */
  fallback: 'Open Sans, sans-serif',
  /** Composed stack matching `pot-poc/lib/tokens.ts`. */
  stack: 'Inter, "Open Sans", system-ui, sans-serif',
} as const;

/**
 * Font sizes as pixel strings (CSS-ready). Keys mirror the POC's
 * Tailwind-style scale; numeric values follow PRD canon 12→56.
 */
export const fontSize = {
  xs: '12px',
  sm: '14px',
  base: '16px',
  lg: '18px',
  xl: '20px',
  '2xl': '24px',
  '3xl': '32px',
  '4xl': '40px',
  display: '56px',
} as const;

/**
 * Raw numeric scale (used by React Native + computed layouts).
 */
export const fontSizePx = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  display: 56,
} as const;

export const fontWeight = {
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
} as const;

/**
 * Line-heights used by the POC's display tokens (TKT-2026-0835).
 */
export const lineHeight = {
  '3xl': 1.1,
  '4xl': 1.05,
  display: 1.05,
} as const;

export type FontSizeToken = keyof typeof fontSize;
export type FontWeightToken = keyof typeof fontWeight;

export const typography = {
  family: fontFamily,
  size: fontSize,
  sizePx: fontSizePx,
  weight: fontWeight,
  lineHeight,
} as const;
