/**
 * Shared types for @solariis-com/pot-security.
 * Kept dependency-free so consumers can re-export without pulling node-only deps.
 */

/** JWT payload — keep small; do NOT embed PII. Typical claims: sub, role, scope. */
export interface JwtPayload {
  sub: string;
  role?: 'user' | 'commerce' | 'admin' | 'service';
  scope?: string[];
  /** Refresh-token family id, used by rotateRefreshToken to detect reuse. */
  family?: string;
  /** Issued-at (seconds since epoch). Populated by jsonwebtoken if omitted. */
  iat?: number;
  /** Expiration (seconds since epoch). Populated by jsonwebtoken from expiresIn. */
  exp?: number;
  [claim: string]: unknown;
}

export type JwtAlgorithm = 'HS256' | 'RS256';

export interface JwtSignOptions {
  algorithm?: JwtAlgorithm;
  /** e.g. '15m', '7d'. Defaults to '15m' for access tokens. */
  expiresIn?: string;
}

export interface JwtVerifyOptions {
  /** Allow-list of algorithms. Defaults to ['HS256']. */
  algorithms?: JwtAlgorithm[];
}

export type JwtVerifyResult =
  | { valid: true; payload: JwtPayload }
  | { valid: false; reason: string };

/** Detached HMAC signature, hex-encoded. */
export type HmacSignature = string;

export type HmacAlgorithm = 'sha256';

/** AES-256-GCM ciphertext bundle. All fields base64-encoded. */
export interface PiiCiphertext {
  ciphertext: string;
  iv: string;
  authTag: string;
}

/** OTP issued by generateOtp. Persist `code` hashed; never log plaintext. */
export interface OtpToken {
  code: string;
  expiresAt: Date;
}

export type OtpVerifyResult =
  | { valid: true }
  | { valid: false; reason: 'expired' | 'mismatch' };

/** Append-only ledger / audit event. Mirrors FR-LD requirements. */
export interface AuditEvent {
  /** ISO-8601 timestamp. */
  timestamp: string;
  actorId: string;
  action: string;
  entityType: string;
  entityId: string;
  before?: unknown;
  after?: unknown;
  ip?: string;
  userAgent?: string;
}
