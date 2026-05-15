import { z } from 'zod';
import { UserRoleSchema } from '../domain/user';

/**
 * FR-AUTH: phone + 6-digit OTP, 5min TTL, biometric optional.
 */

/** Phone format reused — Phase 1 is VE-only (+58…). */
const PhoneSchema = z
  .string()
  .regex(/^\+58\d{10}$/, 'Phone must be E.164 +58 followed by 10 digits');

const OtpCodeSchema = z.string().regex(/^\d{6}$/, 'OTP must be exactly 6 digits');

export const OTPRequestSchema = z.object({
  phone: PhoneSchema,
  /** Which channel to deliver the OTP through. */
  channel: z.enum(['sms', 'whatsapp']).default('sms'),
});
export type OTPRequest = z.infer<typeof OTPRequestSchema>;

export const OTPVerifySchema = z.object({
  phone: PhoneSchema,
  code: OtpCodeSchema,
});
export type OTPVerify = z.infer<typeof OTPVerifySchema>;

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(32),
});
export type RefreshToken = z.infer<typeof RefreshTokenSchema>;

/**
 * JWT claims issued after OTP verify. Mirrors the structure the backend
 * (`pot-backend`) signs and the apps verify.
 */
export const JwtClaimsSchema = z.object({
  /** Subject — user id (uuid). For consumers this may be a session id. */
  sub: z.string().min(1),
  role: UserRoleSchema,
  /** Issued-at, unix seconds. */
  iat: z.number().int().nonnegative(),
  /** Expiration, unix seconds. */
  exp: z.number().int().nonnegative(),
  /** Token unique id — supports revocation lists. */
  jti: z.string().uuid(),
});
export type JwtClaims = z.infer<typeof JwtClaimsSchema>;

export const AuthTokensSchema = z.object({
  accessToken: z.string().min(20),
  refreshToken: z.string().min(32),
  expiresIn: z.number().int().positive(),
});
export type AuthTokens = z.infer<typeof AuthTokensSchema>;
