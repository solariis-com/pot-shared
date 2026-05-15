/**
 * Border-radius tokens — PRD v2.6 §"Spacing & Radii":
 * Buttons 999px pill / Cards 16px / Inputs 12px / Modals 24px.
 *
 * Semantic aliases (`xs`/`sm`/`md`/`lg`/`xl`) are layered on top of the
 * canonical four named radii so consumers can choose intent-first or
 * size-first naming.
 */

export const radiiPx = {
  pill: 999,
  card: 16,
  input: 12,
  modal: 24,
} as const;

export const radii = {
  pill: '999px',
  card: '16px',
  input: '12px',
  modal: '24px',
} as const;

/**
 * Size-first semantic aliases.
 * - xs (4px) — micro elements (chips, dots)
 * - sm (8px) — small surfaces
 * - md (12px, = input radius) — inputs, secondary cards
 * - lg (16px, = card radius) — primary cards
 * - xl (24px, = modal radius) — modals, sheets
 */
export const radiiAliases = {
  xs: '4px',
  sm: '8px',
  md: radii.input,
  lg: radii.card,
  xl: radii.modal,
} as const;

export const radiiAliasesPx = {
  xs: 4,
  sm: 8,
  md: radiiPx.input,
  lg: radiiPx.card,
  xl: radiiPx.modal,
} as const;

export type RadiusToken = keyof typeof radii;
export type RadiusAliasToken = keyof typeof radiiAliases;
