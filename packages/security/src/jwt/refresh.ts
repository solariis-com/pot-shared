import { randomUUID } from 'node:crypto';
import { signJwt } from './sign.js';
import { verifyJwt } from './verify.js';
import type { JwtPayload } from '../types.js';

/**
 * Rotate a refresh token.
 *
 * Pattern: each refresh token carries a `family` id (UUID). The server stores
 * the most recently issued token per family. If a stale token from the same
 * family is presented again, the server SHOULD revoke the whole family —
 * that's the canonical reuse-detection pattern. This helper only handles the
 * rotation primitive (verify old + mint new); persistence is the caller's job.
 *
 * Throws if the current token is invalid/expired — caller decides what to do
 * (e.g. force re-login).
 */
export function rotateRefreshToken(
  currentToken: string,
  secret: string,
  newExpiresIn = '7d'
): { newRefreshToken: string; payload: JwtPayload } {
  const result = verifyJwt(currentToken, secret);
  if (!result.valid) {
    throw new Error(`Cannot rotate refresh token: ${result.reason}`);
  }

  const prev = result.payload;
  const family = typeof prev.family === 'string' ? prev.family : randomUUID();

  // Strip iat/exp + previous jti so the new token gets fresh timestamps and a
  // fresh jti. Including `jti` is mandatory: when rotation fires within the
  // same wall-clock second, `iat`/`exp` round to identical values; without a
  // unique jti the resulting JWT would be byte-identical, defeating rotation.
  const { iat: _iat, exp: _exp, jti: _jti, ...carry } = prev;
  const newPayload: JwtPayload = { ...carry, family, jti: randomUUID() } as JwtPayload;

  const newRefreshToken = signJwt(newPayload, secret, { expiresIn: newExpiresIn });
  return { newRefreshToken, payload: newPayload };
}
