import { createHmac } from 'node:crypto';
import type { HmacAlgorithm, HmacSignature } from '../types.js';

/**
 * Compute an HMAC over `payload`.
 *
 * Returns the lowercase hex digest. Per FR-R4, this is the format used to
 * sign outgoing R4 webhook bodies (X-Signature header).
 */
export function signHmac(
  payload: string,
  secret: string,
  algorithm: HmacAlgorithm = 'sha256'
): HmacSignature {
  return createHmac(algorithm, secret).update(payload, 'utf8').digest('hex');
}
