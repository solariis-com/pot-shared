import { describe, it, expect } from 'vitest';
import {
  generateIdempotencyKey,
  validateIdempotencyKey,
  derivedKey,
} from '../src/idempotency/key-utils.js';

describe('generateIdempotencyKey / validateIdempotencyKey', () => {
  it('generates a key that validates', () => {
    const key = generateIdempotencyKey();
    expect(validateIdempotencyKey(key)).toBe(true);
  });

  it('rejects malformed keys', () => {
    expect(validateIdempotencyKey('')).toBe(false);
    expect(validateIdempotencyKey('not-a-uuid')).toBe(false);
    expect(validateIdempotencyKey('00000000-0000-0000-0000-000000000000')).toBe(false); // v0
    // UUID v1 (version nibble = 1, not 4)
    expect(
      validateIdempotencyKey('11111111-1111-1111-1111-111111111111')
    ).toBe(false);
  });

  it('produces unique keys across calls', () => {
    const set = new Set<string>();
    for (let i = 0; i < 50; i++) set.add(generateIdempotencyKey());
    expect(set.size).toBe(50);
  });
});

describe('derivedKey', () => {
  it('is deterministic for the same input', () => {
    const a = derivedKey('plink.create', { amount: 100, currency: 'USD' });
    const b = derivedKey('plink.create', { amount: 100, currency: 'USD' });
    expect(a).toBe(b);
    expect(a).toMatch(/^[0-9a-f]{64}$/);
  });

  it('is order-independent on object keys', () => {
    const a = derivedKey('plink.create', { amount: 100, currency: 'USD' });
    const b = derivedKey('plink.create', { currency: 'USD', amount: 100 });
    expect(a).toBe(b);
  });

  it('produces different keys for different params', () => {
    const a = derivedKey('plink.create', { amount: 100 });
    const b = derivedKey('plink.create', { amount: 101 });
    expect(a).not.toBe(b);
  });

  it('produces different keys for different operations', () => {
    const a = derivedKey('plink.create', { amount: 100 });
    const b = derivedKey('plink.refund', { amount: 100 });
    expect(a).not.toBe(b);
  });

  it('handles nested objects deterministically', () => {
    const a = derivedKey('tx.create', {
      meta: { foo: 1, bar: [1, 2, 3] },
      amount: 50,
    });
    const b = derivedKey('tx.create', {
      amount: 50,
      meta: { bar: [1, 2, 3], foo: 1 },
    });
    expect(a).toBe(b);
  });

  it('distinguishes array order (semantically meaningful)', () => {
    const a = derivedKey('tx.create', { items: [1, 2, 3] });
    const b = derivedKey('tx.create', { items: [3, 2, 1] });
    expect(a).not.toBe(b);
  });
});
