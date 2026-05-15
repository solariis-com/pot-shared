import jwt from 'jsonwebtoken';
import type { JwtPayload, JwtVerifyOptions, JwtVerifyResult } from '../types.js';

/**
 * Verify a JWT and return a discriminated-union result.
 * Never throws — caller pattern-matches on `valid`.
 *
 * SECURITY: explicit algorithm allow-list prevents the classic
 * "alg: none" downgrade attack. Defaults to ['HS256'].
 */
export function verifyJwt(
  token: string,
  secret: string,
  opts: JwtVerifyOptions = {}
): JwtVerifyResult {
  const { algorithms = ['HS256'] } = opts;

  try {
    const decoded = jwt.verify(token, secret, {
      algorithms: algorithms as jwt.Algorithm[],
    });

    if (typeof decoded === 'string') {
      return { valid: false, reason: 'malformed-payload' };
    }

    return { valid: true, payload: decoded as JwtPayload };
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return { valid: false, reason: 'expired' };
    }
    if (err instanceof jwt.JsonWebTokenError) {
      return { valid: false, reason: err.message || 'invalid-signature' };
    }
    return { valid: false, reason: 'unknown-error' };
  }
}
