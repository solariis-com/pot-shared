/**
 * Template variable interpolation helpers.
 *
 * Mirrors the `tpl()` pattern from `pot-poc/lib/microcopy.ts` so callers can
 * reuse the same `{varName}` placeholder convention across both POC and shared
 * package. Single source of truth for the substitution semantics.
 */

export type InterpolationVars = Record<string, string | number>;

export type Interpolator = (vars: InterpolationVars) => string;

/**
 * Curried template builder. Given a template string with `{var}` placeholders,
 * returns a function that substitutes vars at call-time.
 *
 * @example
 *   const greet = tpl('Hola, {firstName}');
 *   greet({ firstName: 'Lucía' }); // → 'Hola, Lucía'
 */
export const tpl =
  (template: string): Interpolator =>
  (vars) =>
    template.replace(/\{(\w+)\}/g, (_, key) => {
      const value = vars[key];
      return value === undefined || value === null ? '' : String(value);
    });

/**
 * Higher-order helper for one-shot inline interpolation, when there is no
 * benefit to building a reusable interpolator.
 *
 * @example
 *   interpolate('Bs {amount}', { amount: 250 }); // → 'Bs 250'
 */
export const interpolate = (template: string, vars: InterpolationVars): string =>
  tpl(template)(vars);
