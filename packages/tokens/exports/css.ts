/**
 * CSS variable export for `@solariis-com/pot-tokens`.
 *
 * `toCssVars(prefix?)` produces a `:root { ... }` block ready to inject into a
 * global stylesheet. The default prefix is empty, so canonical PRD names like
 * `--color-primary-black` / `--color-accent` come out verbatim.
 *
 * `cssVarsString` is the pre-rendered default-prefix output for consumers that
 * want a single static import.
 */

import { colors, neutrals } from '../src/colors';
import { fontFamily, fontSize, fontWeight } from '../src/typography';
import { spacing } from '../src/spacing';
import { radii, radiiAliases } from '../src/radii';
import { shadows } from '../src/shadows';
import { breakpoints } from '../src/breakpoints';

const kebab = (s: string): string =>
  s
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/_/g, '-')
    .toLowerCase();

interface CssVarRow {
  key: string;
  value: string;
}

const collectVars = (): CssVarRow[] => {
  const rows: CssVarRow[] = [];

  // Colors — preserve PRD canonical names for the three brand surfaces.
  rows.push({ key: 'color-primary-black', value: colors.primaryBlack });
  rows.push({ key: 'color-primary-light', value: colors.primaryLight });
  rows.push({ key: 'color-accent', value: colors.accent });
  rows.push({ key: 'color-success', value: colors.success });
  rows.push({ key: 'color-danger', value: colors.danger });
  rows.push({ key: 'color-warning', value: colors.warning });
  rows.push({ key: 'color-info', value: colors.info });

  // Neutral scale.
  for (const [k, v] of Object.entries(neutrals)) {
    rows.push({ key: `color-n-${k}`, value: v });
  }

  // Typography.
  rows.push({ key: 'font-family-sans', value: fontFamily.sans });
  rows.push({ key: 'font-family-stack', value: fontFamily.stack });
  for (const [k, v] of Object.entries(fontSize)) {
    rows.push({ key: `font-size-${kebab(k)}`, value: v });
  }
  for (const [k, v] of Object.entries(fontWeight)) {
    rows.push({ key: `font-weight-${kebab(k)}`, value: String(v) });
  }

  // Spacing.
  for (const [k, v] of Object.entries(spacing)) {
    rows.push({ key: `spacing-${kebab(k)}`, value: v });
  }

  // Radii (canonical + aliases).
  for (const [k, v] of Object.entries(radii)) {
    rows.push({ key: `radius-${kebab(k)}`, value: v });
  }
  for (const [k, v] of Object.entries(radiiAliases)) {
    rows.push({ key: `radius-alias-${kebab(k)}`, value: v });
  }

  // Shadows.
  for (const [k, v] of Object.entries(shadows)) {
    rows.push({ key: `shadow-${kebab(k)}`, value: v });
  }

  // Breakpoints.
  for (const [k, v] of Object.entries(breakpoints)) {
    rows.push({ key: `breakpoint-${kebab(k)}`, value: v });
  }

  return rows;
};

/**
 * Render the full set of POT tokens as a `:root { --... }` CSS block.
 *
 * @param prefix Optional prefix prepended to every variable name (no leading
 *   `--` needed). Default `''` keeps PRD canonical names like
 *   `--color-primary-black` intact.
 */
export const toCssVars = (prefix = ''): string => {
  const p = prefix ? `${prefix.replace(/^-+|-+$/g, '')}-` : '';
  const rows = collectVars()
    .map(({ key, value }) => `  --${p}${key}: ${value};`)
    .join('\n');
  return `:root {\n${rows}\n}`;
};

/**
 * Convenience: the default-prefix CSS variable block, pre-rendered.
 */
export const cssVarsString: string = toCssVars();

/**
 * Synchronously write the default `:root` block to disk. Optional — most
 * consumers will inline `cssVarsString` directly via their bundler.
 *
 * Throws if `node:fs` cannot be loaded (e.g. browser bundle without polyfill).
 */
export const writeCss = (
  outPath: string,
  opts: { prefix?: string } = {},
): void => {
  // Lazy require so this module stays browser-safe by default.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require('node:fs') as typeof import('node:fs');
  fs.writeFileSync(outPath, toCssVars(opts.prefix ?? ''), 'utf8');
};
