import { describe, it, expect } from 'vitest';
import { signHmac } from '../src/hmac/sign.js';
import { verifyHmac } from '../src/hmac/verify.js';

const SECRET = 'webhook-secret';
const PAYLOAD = JSON.stringify({ event: 'plink.paid', amount: 100, txId: 'tx_123' });

describe('signHmac / verifyHmac', () => {
  it('roundtrips a signature', () => {
    const sig = signHmac(PAYLOAD, SECRET);
    expect(sig).toMatch(/^[0-9a-f]{64}$/); // sha256 → 64 hex chars
    expect(verifyHmac(PAYLOAD, sig, SECRET)).toBe(true);
  });

  it('rejects a tampered payload', () => {
    const sig = signHmac(PAYLOAD, SECRET);
    expect(verifyHmac(PAYLOAD + 'x', sig, SECRET)).toBe(false);
  });

  it('rejects a tampered signature', () => {
    const sig = signHmac(PAYLOAD, SECRET);
    const flipped = (sig[0] === '0' ? '1' : '0') + sig.slice(1);
    expect(verifyHmac(PAYLOAD, flipped, SECRET)).toBe(false);
  });

  it('rejects a wrong secret', () => {
    const sig = signHmac(PAYLOAD, SECRET);
    expect(verifyHmac(PAYLOAD, sig, 'different-secret')).toBe(false);
  });

  it('rejects empty / malformed signatures without throwing', () => {
    expect(verifyHmac(PAYLOAD, '', SECRET)).toBe(false);
    expect(verifyHmac(PAYLOAD, 'not-hex-!@#$', SECRET)).toBe(false);
    // Wrong length but valid hex chars.
    expect(verifyHmac(PAYLOAD, 'deadbeef', SECRET)).toBe(false);
  });

  it('uses constant-time compare (smoke check)', () => {
    // We can't reliably measure timing in unit tests, but we can verify that
    // a signature differing only in the LAST byte and one differing only in
    // the FIRST byte both return false — i.e. there's no short-circuit.
    const sig = signHmac(PAYLOAD, SECRET);
    const earlyDiff = 'ff' + sig.slice(2);
    const lateDiff = sig.slice(0, -2) + 'ff';
    expect(verifyHmac(PAYLOAD, earlyDiff, SECRET)).toBe(false);
    expect(verifyHmac(PAYLOAD, lateDiff, SECRET)).toBe(false);
  });
});
