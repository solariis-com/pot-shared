import { describe, it, expect } from 'vitest';
import { generateOtp } from '../src/otp/generate.js';
import { verifyOtp } from '../src/otp/verify.js';

describe('generateOtp', () => {
  it('produces 6 digits by default', () => {
    const { code } = generateOtp();
    expect(code).toMatch(/^\d{6}$/);
  });

  it('respects custom digit count', () => {
    const { code } = generateOtp({ digits: 8 });
    expect(code).toMatch(/^\d{8}$/);
  });

  it('defaults to a 5-minute TTL', () => {
    const before = Date.now();
    const { expiresAt } = generateOtp();
    const delta = expiresAt.getTime() - before;
    // Allow generous slack — should be ~300s.
    expect(delta).toBeGreaterThanOrEqual(299_000);
    expect(delta).toBeLessThanOrEqual(301_000);
  });

  it('rejects out-of-range digit counts', () => {
    expect(() => generateOtp({ digits: 3 })).toThrow();
    expect(() => generateOtp({ digits: 11 })).toThrow();
  });

  it('rejects non-positive TTL', () => {
    expect(() => generateOtp({ ttlSeconds: 0 })).toThrow();
    expect(() => generateOtp({ ttlSeconds: -1 })).toThrow();
  });

  it('produces different codes on successive calls (probabilistic)', () => {
    const codes = new Set<string>();
    for (let i = 0; i < 20; i++) codes.add(generateOtp().code);
    // 20 random 6-digit codes — collision is vanishingly unlikely.
    expect(codes.size).toBeGreaterThan(15);
  });
});

describe('verifyOtp', () => {
  it('accepts a matching, unexpired code', () => {
    const future = new Date(Date.now() + 60_000);
    const res = verifyOtp('123456', '123456', future);
    expect(res.valid).toBe(true);
  });

  it('rejects a mismatched code', () => {
    const future = new Date(Date.now() + 60_000);
    const res = verifyOtp('111111', '123456', future);
    expect(res.valid).toBe(false);
    if (!res.valid) expect(res.reason).toBe('mismatch');
  });

  it('rejects an expired code (even if it matches)', () => {
    const past = new Date(Date.now() - 1000);
    const res = verifyOtp('123456', '123456', past);
    expect(res.valid).toBe(false);
    if (!res.valid) expect(res.reason).toBe('expired');
  });

  it('returns mismatch on length mismatch without throwing', () => {
    const future = new Date(Date.now() + 60_000);
    const res = verifyOtp('12345', '123456', future);
    expect(res.valid).toBe(false);
    if (!res.valid) expect(res.reason).toBe('mismatch');
  });

  it('returns expired when expiresAt is invalid', () => {
    const bad = new Date('not-a-date');
    const res = verifyOtp('123456', '123456', bad);
    expect(res.valid).toBe(false);
    if (!res.valid) expect(res.reason).toBe('expired');
  });
});
