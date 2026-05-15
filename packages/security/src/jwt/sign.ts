import jwt from 'jsonwebtoken';
import type { JwtPayload, JwtSignOptions } from '../types.js';

/**
 * Sign a JWT.
 *
 * Defaults:
 *  - algorithm: HS256 (symmetric — pass a strong, random `secret`)
 *  - expiresIn: '15m' (access-token lifetime per FR-AUTH guidance)
 *
 * For RS256, pass the PEM-encoded private key as `secret` and set `algorithm: 'RS256'`.
 */
export function signJwt(
  payload: JwtPayload,
  secret: string,
  opts: JwtSignOptions = {}
): string {
  const { algorithm = 'HS256', expiresIn = '15m' } = opts;

  // Strip reserved claims that jsonwebtoken will set itself.
  const { iat: _iat, exp: _exp, ...rest } = payload;

  return jwt.sign(rest, secret, {
    algorithm,
    expiresIn: expiresIn as jwt.SignOptions['expiresIn'],
  });
}
