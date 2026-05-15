import { describe, it, expect } from 'vitest';
import {
  colors,
  brandColors,
  neutrals,
  spacing,
  spacingScale,
  radii,
  shadows,
  typography,
  fontSize,
  fontWeight,
  breakpoints,
} from '../src/index';
import { toCssVars, cssVarsString } from '../exports/css';
import { tailwindTheme, tailwindColors } from '../exports/tailwind';
import { nativeStyleSheet, nativeColors } from '../exports/native';

describe('color tokens', () => {
  it('exports the 7 brand+status colors with PRD-canonical hex values', () => {
    expect(brandColors).toEqual({
      primaryBlack: '#000000',
      primaryLight: '#F8FDFC',
      accent: '#ADF43C',
      success: '#22C55E',
      danger: '#EF4444',
      warning: '#F59E0B',
      info: '#3B82F6',
    });
    // Sanity: exactly 7 brand colors.
    expect(Object.keys(brandColors)).toHaveLength(7);
  });

  it('exposes the neutral scale from pot-poc/lib/tokens.ts', () => {
    expect(neutrals[50]).toBe('#FAFAFA');
    expect(neutrals[100]).toBe('#F4F4F5');
    expect(neutrals[200]).toBe('#E4E4E7');
    expect(neutrals[400]).toBe('#A1A1AA');
    expect(neutrals[600]).toBe('#52525B');
    expect(neutrals[800]).toBe('#27272A');
    expect(neutrals[900]).toBe('#18181B');
  });

  it('includes brand + status + neutrals in the aggregate `colors` export', () => {
    expect(colors.primaryBlack).toBe('#000000');
    expect(colors.accent).toBe('#ADF43C');
    expect(colors.n900).toBe('#18181B');
  });
});

describe('spacing tokens', () => {
  const expectedScale = [4, 8, 12, 16, 20, 24, 32, 40, 48, 64] as const;

  it('exports all 10 base spacing values via spacingScale', () => {
    expect(spacingScale).toEqual(expectedScale);
    expect(spacingScale).toHaveLength(10);
  });

  it('exposes pixel-string spacing keyed by semantic alias', () => {
    expect(spacing.xs).toBe('4px');
    expect(spacing.sm).toBe('8px');
    expect(spacing.md).toBe('12px');
    expect(spacing.base).toBe('16px');
    expect(spacing.lg).toBe('20px');
    expect(spacing.xl).toBe('24px');
    expect(spacing['2xl']).toBe('32px');
    expect(spacing['3xl']).toBe('40px');
    expect(spacing['4xl']).toBe('48px');
    expect(spacing['5xl']).toBe('64px');
  });
});

describe('radii tokens', () => {
  it('matches the PRD canonical four radii', () => {
    expect(radii.pill).toBe('999px');
    expect(radii.card).toBe('16px');
    expect(radii.input).toBe('12px');
    expect(radii.modal).toBe('24px');
  });
});

describe('shadow tokens', () => {
  it('exports the 3-step elevation system', () => {
    expect(Object.keys(shadows).sort()).toEqual(['card', 'elevated', 'soft']);
    expect(shadows.soft).toContain('rgba(0,0,0,0.06)');
    expect(shadows.card).toBe('0 4px 16px rgba(0,0,0,0.08)');
    expect(shadows.elevated).toBe('0 8px 24px rgba(0,0,0,0.12)');
  });
});

describe('typography tokens', () => {
  it('exposes the 9-step font-size scale from 12 → 56', () => {
    expect(fontSize.xs).toBe('12px');
    expect(fontSize.sm).toBe('14px');
    expect(fontSize.base).toBe('16px');
    expect(fontSize.lg).toBe('18px');
    expect(fontSize.xl).toBe('20px');
    expect(fontSize['2xl']).toBe('24px');
    expect(fontSize['3xl']).toBe('32px');
    expect(fontSize['4xl']).toBe('40px');
    expect(fontSize.display).toBe('56px');
  });

  it('exposes weights 400/500/600/700', () => {
    expect(fontWeight.regular).toBe(400);
    expect(fontWeight.medium).toBe(500);
    expect(fontWeight.semibold).toBe(600);
    expect(fontWeight.bold).toBe(700);
  });

  it('typography.family includes Inter as primary', () => {
    expect(typography.family.sans).toMatch(/Inter/);
  });
});

describe('breakpoints', () => {
  it('mobile-first scale sm/md/lg/xl', () => {
    expect(breakpoints).toEqual({
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
    });
  });
});

describe('CSS export', () => {
  it('toCssVars() includes the accent token in PRD-canonical form', () => {
    const css = toCssVars();
    expect(css).toContain('--color-accent: #ADF43C');
    expect(css).toContain('--color-primary-black: #000000');
    expect(css).toContain('--color-primary-light: #F8FDFC');
    expect(css).toMatch(/^:root \{/);
    expect(css.trim().endsWith('}')).toBe(true);
  });

  it('toCssVars(prefix) prepends the prefix to every variable name', () => {
    const css = toCssVars('pot');
    expect(css).toContain('--pot-color-accent: #ADF43C');
    expect(css).not.toContain('--color-accent: #ADF43C');
  });

  it('cssVarsString static export matches the default-prefix render', () => {
    expect(cssVarsString).toBe(toCssVars());
  });
});

describe('Tailwind export', () => {
  it('tailwindTheme.colors carries the brand palette under POC-canonical keys', () => {
    expect(tailwindColors['pot-dark']).toBe('#000000');
    expect(tailwindColors['pot-light']).toBe('#F8FDFC');
    expect(tailwindColors['pot-accent']).toBe('#ADF43C');
    expect(tailwindColors.success).toBe('#22C55E');
    expect(tailwindColors.danger).toBe('#EF4444');
    expect(tailwindColors.warning).toBe('#F59E0B');
    expect(tailwindColors.info).toBe('#3B82F6');
    expect(tailwindColors.n[900]).toBe('#18181B');
    // Spread-into-extend payload sanity.
    expect(tailwindTheme.colors).toBe(tailwindColors);
    expect(tailwindTheme.borderRadius.pill).toBe('999px');
  });
});

describe('React Native export', () => {
  it('nativeStyleSheet exposes colors as hex strings', () => {
    expect(nativeColors.primaryBlack).toBe('#000000');
    expect(nativeColors.accent).toBe('#ADF43C');
    expect(typeof nativeColors.primaryBlack).toBe('string');
    expect(nativeColors.primaryBlack.startsWith('#')).toBe(true);
  });

  it('nativeStyleSheet spacing is numeric', () => {
    expect(nativeStyleSheet.spacing.xs).toBe(4);
    expect(nativeStyleSheet.spacing['5xl']).toBe(64);
    expect(typeof nativeStyleSheet.spacing.base).toBe('number');
  });

  it('nativeStyleSheet shadows use RN-shape (shadowColor + elevation)', () => {
    expect(nativeStyleSheet.shadows.card).toMatchObject({
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 16,
      elevation: 4,
    });
  });
});
