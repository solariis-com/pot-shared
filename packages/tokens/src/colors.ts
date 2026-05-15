/**
 * POT brand palette — mirrors `pot-poc/lib/tokens.ts` (TKT-2026-0784 DESIGN.md)
 * and PRD v2.6 §"Design System Canónico → Color tokens".
 *
 * 60/30/8/2 proportion canon:
 *   - primaryBlack (60%) — dark surfaces, headers, splash
 *   - primaryLight (30%) — light surfaces, cards
 *   - accent       (8%)  — CTAs, QR center, badges, branding
 *   - status (success/danger/warning/info) — collectively the remaining 2%
 *
 * D-10 brand surfaces exception (per PRD): splash/welcome/celebration screens
 * (W-01/C-01/W-02/C-02/W-10/W-26/S-08) use `bg-pot-accent` body — opposite
 * of the 60/30/8/2 default which puts accent on top of `bg-pot-light`.
 */
export const colors = {
  // Brand surfaces
  primaryBlack: '#000000',
  primaryLight: '#F8FDFC',
  accent: '#ADF43C',

  // Status
  success: '#22C55E',
  danger: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',

  // Neutral scale (from pot-poc/lib/tokens.ts — n50 through n900)
  n50: '#FAFAFA',
  n100: '#F4F4F5',
  n200: '#E4E4E7',
  n400: '#A1A1AA',
  n600: '#52525B',
  n800: '#27272A',
  n900: '#18181B',
} as const;

export type ColorToken = keyof typeof colors;

/**
 * The 7 brand colors (3 brand surfaces + 4 status) — useful for completeness
 * assertions and design-system showcases. Excludes the neutral scale.
 */
export const brandColors = {
  primaryBlack: colors.primaryBlack,
  primaryLight: colors.primaryLight,
  accent: colors.accent,
  success: colors.success,
  danger: colors.danger,
  warning: colors.warning,
  info: colors.info,
} as const;

export type BrandColorToken = keyof typeof brandColors;

/**
 * Neutral grayscale subset (Tailwind-style `n.50` → `n.900`).
 */
export const neutrals = {
  50: colors.n50,
  100: colors.n100,
  200: colors.n200,
  400: colors.n400,
  600: colors.n600,
  800: colors.n800,
  900: colors.n900,
} as const;
