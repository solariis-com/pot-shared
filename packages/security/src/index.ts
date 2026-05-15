/**
 * @solariis/pot-security — barrel.
 *
 * Re-exports all utility surfaces. Consumers should import named symbols:
 *   import { signJwt, verifyJwt, signHmac, verifyHmac, encryptPii, decryptPii,
 *            generateOtp, verifyOtp, buildAuditEvent } from '@solariis/pot-security';
 */

// JWT
export { signJwt } from './jwt/sign.js';
export { verifyJwt } from './jwt/verify.js';
export { rotateRefreshToken } from './jwt/refresh.js';

// HMAC
export { signHmac } from './hmac/sign.js';
export { verifyHmac } from './hmac/verify.js';

// Encryption
export { encryptPii, decryptPii } from './encryption/pii.js';
export { PII_FIELDS, isPiiField } from './encryption/pii-types.js';
export type { PiiField } from './encryption/pii-types.js';

// OTP
export { generateOtp } from './otp/generate.js';
export { verifyOtp } from './otp/verify.js';

// Idempotency
export {
  generateIdempotencyKey,
  validateIdempotencyKey,
  derivedKey,
} from './idempotency/key-utils.js';

// Audit
export { buildAuditEvent } from './audit/log-helpers.js';

// Types
export type {
  JwtPayload,
  JwtAlgorithm,
  JwtSignOptions,
  JwtVerifyOptions,
  JwtVerifyResult,
  HmacSignature,
  HmacAlgorithm,
  PiiCiphertext,
  OtpToken,
  OtpVerifyResult,
  AuditEvent,
} from './types.js';
