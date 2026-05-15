import { describe, expect, it } from 'vitest';

import es from '../src/catalog/es';
import en from '../src/catalog/en';
import { LOCALES, getCatalog, interpolate, tpl } from '../src/index';

/**
 * Recursively walk an object and yield dotted key paths. Treats functions
 * (interpolators) and primitives as leaves. We DON'T descend into arrays —
 * the catalog has none today and shouldn't grow them (collapses key-parity
 * comparison).
 */
function leafKeys(value: unknown, prefix = ''): string[] {
  if (
    value === null ||
    typeof value !== 'object' ||
    typeof value === 'function' ||
    Array.isArray(value)
  ) {
    return [prefix];
  }
  return Object.entries(value as Record<string, unknown>)
    .flatMap(([key, v]) => leafKeys(v, prefix ? `${prefix}.${key}` : key))
    .sort();
}

const esKeys = leafKeys(es);
const enKeys = leafKeys(en);

describe('catalog completeness — ES is canon, EN must mirror', () => {
  it('ES and EN have identical leaf-key sets', () => {
    const esSet = new Set(esKeys);
    const enSet = new Set(enKeys);

    const onlyInEs = esKeys.filter((k) => !enSet.has(k));
    const onlyInEn = enKeys.filter((k) => !esSet.has(k));

    expect(onlyInEs, `Keys only in ES (missing from EN):\n${onlyInEs.join('\n')}`).toEqual([]);
    expect(onlyInEn, `Keys only in EN (missing from ES):\n${onlyInEn.join('\n')}`).toEqual([]);
  });

  it('ES and EN have the same total leaf-key count', () => {
    expect(enKeys.length).toBe(esKeys.length);
  });
});

describe('top-level namespaces present in both catalogs', () => {
  const namespaces = ['worker', 'commerce', 'consumer', 'admin', 'shared'] as const;

  it.each(namespaces)('ES has %s namespace', (ns) => {
    expect(es).toHaveProperty(ns);
    expect(typeof (es as Record<string, unknown>)[ns]).toBe('object');
  });

  it.each(namespaces)('EN has %s namespace', (ns) => {
    expect(en).toHaveProperty(ns);
    expect(typeof (en as Record<string, unknown>)[ns]).toBe('object');
  });
});

describe('interpolation helpers', () => {
  it('tpl substitutes {var} placeholders', () => {
    expect(tpl('Hola {name}')({ name: 'Lucía' })).toBe('Hola Lucía');
  });

  it('tpl handles missing vars by emitting empty string', () => {
    expect(tpl('Hola {name}')({})).toBe('Hola ');
  });

  it('tpl handles multiple placeholders', () => {
    expect(tpl('{a} y {b}')({ a: 'arroz', b: 'pollo' })).toBe('arroz y pollo');
  });

  it('tpl stringifies numbers', () => {
    expect(tpl('Bs {amount}')({ amount: 250 })).toBe('Bs 250');
  });

  it('interpolate is the one-shot equivalent of tpl', () => {
    expect(interpolate('Pote {name}', { name: 'La Brisa' })).toBe('Pote La Brisa');
  });
});

describe('runtime catalog functions return strings', () => {
  it('ES interpolated key renders', () => {
    const out = es.worker.home.greeting({ firstName: 'Yuri' });
    expect(out).toBe('Hola, Yuri');
  });

  it('EN interpolated key renders', () => {
    const out = en.worker.home.greeting({ firstName: 'Yuri' });
    expect(out).toBe('Hi, Yuri');
  });

  it('shared.common.stepOf accepts {current,total} object', () => {
    expect(es.shared.common.stepOf({ current: 2, total: 5 })).toBe('Paso 2 de 5');
    expect(en.shared.common.stepOf({ current: 2, total: 5 })).toBe('Step 2 of 5');
  });

  it('shared.money.bsApprox renders bilingually with same shape', () => {
    expect(es.shared.money.bsApprox('100', '2.50')).toBe('Bs 100 · ≈ 2.50 USD');
    expect(en.shared.money.bsApprox('100', '2.50')).toBe('Bs 100 · ≈ 2.50 USD');
  });
});

describe('getCatalog locale resolver', () => {
  it('returns ES for "es"', () => {
    expect(getCatalog('es')).toBe(es);
  });

  it('returns EN for "en"', () => {
    expect(getCatalog('en')).toBe(en);
  });

  it('exports the canonical locale list', () => {
    expect([...LOCALES]).toEqual(['es', 'en']);
  });
});
