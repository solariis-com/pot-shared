import { timingSafeEqual } from 'node:crypto';
import type { OtpVerifyResult } from '../types.js';

/**
 * Verify an OTP code with a constant-time comparison and TTL check.
 *
 * Order matters: TTL is checked FIRST so an attacker who guesses an expired
 * code learns nothing about the digits. Length mismatches are folded into
 * 'mismatch' (constant-time-equivalent) so the timing of "wrong length" and
 * "wrong digits" cannot be distinguished.
 *
 * Caller is responsible for:
 *  - applying their own per-handle attempt counter (rate-limit / lockout)
 *  - ensuring the `expected` value is the canonical stored OTP (or the
 *    plaintext recomputed from a hashed store)
 */
export function verifyOtp(
  input: string,
  expected: string,
  expiresAt: Date
): OtpVerifyResult {
  // TTL check first — never leak code info on expired tokens.
  if (!(expiresAt instanceof Date) || Number.isNaN(expiresAt.getTime())) {
    return { valid: false, reason: 'expired' };
  }
  if (expiresAt.getTime() <= Date.now()) {
    return { valid: false, reason: 'expired' };
  }

  if (typeof input !== 'string' || typeof expected !== 'string') {
    return { valid: false, reason: 'mismatch' };
  }

  const inputBuf = Buffer.from(input, 'utf8');
  const expectedBuf = Buffer.from(expected, 'utf8');

  if (inputBuf.length !== expectedBuf.length) {
    // Run timingSafeEqual against a same-length scratch buffer to keep the
    // wall-clock cost similar to the matching path. Result is discarded —
    // length mismatch is always a 'mismatch' verdict.
    const scratch = Buffer.alloc(expectedBuf.length);
    try {
      timingSafeEqual(scratch, expectedBuf);
    } catch {
      /* unreachable: scratch.length === expectedBuf.length by construction */
    }
    return { valid: false, reason: 'mismatch' };
  }

  return timingSafeEqual(inputBuf, expectedBuf)
    ? { valid: true }
    : { valid: false, reason: 'mismatch' };
}
