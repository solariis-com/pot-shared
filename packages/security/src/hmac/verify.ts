import { createHmac, timingSafeEqual } from 'node:crypto';
import type { HmacAlgorithm } from '../types.js';

/**
 * Constant-time HMAC verification.
 *
 * SECURITY: uses `crypto.timingSafeEqual` so a remote attacker cannot
 * byte-by-byte probe the signature based on response timing. Length
 * mismatches short-circuit safely (no measurable signal).
 *
 * Accepts hex-encoded signatures (the format emitted by `signHmac`).
 * Inputs of non-hex shape return `false` rather than throwing.
 */
export function verifyHmac(
  payload: string,
  signature: string,
  secret: string,
  algorithm: HmacAlgorithm = 'sha256'
): boolean {
  if (typeof signature !== 'string' || signature.length === 0) {
    return false;
  }

  const expected = createHmac(algorithm, secret).update(payload, 'utf8').digest();

  let provided: Buffer;
  try {
    provided = Buffer.from(signature, 'hex');
  } catch {
    return false;
  }

  if (provided.length !== expected.length) {
    return false;
  }

  return timingSafeEqual(provided, expected);
}
