import { randomInt } from 'node:crypto';
import type { OtpToken } from '../types.js';

const DEFAULT_DIGITS = 6;
const DEFAULT_TTL_SECONDS = 300; // 5 minutes per FR-AUTH

/**
 * Generate a cryptographically-random numeric OTP.
 *
 * Defaults: 6 digits, 5-minute TTL — matches FR-AUTH for phone+OTP login.
 *
 * SECURITY: uses `crypto.randomInt` (CSPRNG). The `%10` pattern is biased
 * for small ranges; computing each digit independently avoids modulo bias.
 *
 * Persistence guidance: store the code HASHED (e.g. SHA-256 with a server-side
 * pepper) — never raw — alongside `expiresAt` and an attempt counter.
 */
export function generateOtp(
  opts: { digits?: number; ttlSeconds?: number } = {}
): OtpToken {
  const digits = opts.digits ?? DEFAULT_DIGITS;
  const ttlSeconds = opts.ttlSeconds ?? DEFAULT_TTL_SECONDS;

  if (!Number.isInteger(digits) || digits < 4 || digits > 10) {
    throw new Error('generateOtp: digits must be an integer in [4, 10]');
  }
  if (!Number.isFinite(ttlSeconds) || ttlSeconds <= 0) {
    throw new Error('generateOtp: ttlSeconds must be a positive number');
  }

  let code = '';
  for (let i = 0; i < digits; i++) {
    code += randomInt(0, 10).toString();
  }

  const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
  return { code, expiresAt };
}
