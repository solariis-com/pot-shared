import type { AxiosInstance } from 'axios';
import { z } from 'zod';
import type { RequestOptions } from '../types';

/**
 * Auth module — FR-AUTH.
 *
 * Wire endpoints (anticipated, will be finalized post-TKT-2026-0859):
 *   POST /auth/otp/request   { phone } → { sent: true, expiresIn: 300 }
 *   POST /auth/otp/verify    { phone, code, deviceId? } → { accessToken, refreshToken, user }
 *   POST /auth/refresh       { refreshToken } → { accessToken, refreshToken }
 *   POST /auth/logout        { refreshToken } → { ok: true }
 *
 * All four endpoints are `requiresAuth: false` because the JWT lifecycle is
 * what they manage. `refresh` and `logout` carry the refresh token in the
 * BODY (not the Authorization header) to keep the access-token rotation rule
 * clean and to play well with httpOnly cookie shims on web.
 */

const PhoneSchema = z
  .string()
  .regex(/^\+58\d{10}$/, 'Phone must be E.164 +58 followed by 10 digits');

export const RequestOtpInputSchema = z.object({
  phone: PhoneSchema,
});
export type RequestOtpInput = z.infer<typeof RequestOtpInputSchema>;

export const RequestOtpResponseSchema = z.object({
  sent: z.literal(true),
  /** Seconds until the OTP expires — typically 300 (5 min) per FR-AUTH. */
  expiresIn: z.number().int().positive(),
});
export type RequestOtpResponse = z.infer<typeof RequestOtpResponseSchema>;

export const VerifyOtpInputSchema = z.object({
  phone: PhoneSchema,
  code: z.string().regex(/^\d{6}$/, 'OTP must be 6 digits'),
  /** Optional device id for refresh-token binding (pot-mobile). */
  deviceId: z.string().min(8).max(120).optional(),
});
export type VerifyOtpInput = z.infer<typeof VerifyOtpInputSchema>;

/**
 * The session envelope returned on successful verify/refresh.
 *
 * `user` is intentionally `unknown` at the api-client layer — the consumer
 * narrows via the discriminated `User` union from `@solariis-com/pot-types`.
 * Validating here would couple the SDK shape to the full user-schema graph;
 * post-backend codegen will tighten this.
 */
export const SessionSchema = z.object({
  accessToken: z.string().min(20),
  refreshToken: z.string().min(20),
  /** TTL in seconds for the access token. */
  expiresIn: z.number().int().positive(),
  user: z.unknown(),
});
export type Session = z.infer<typeof SessionSchema>;

export const RefreshInputSchema = z.object({
  refreshToken: z.string().min(20),
});
export type RefreshInput = z.infer<typeof RefreshInputSchema>;

export class AuthModule {
  constructor(private readonly http: AxiosInstance) {}

  /** FR-AUTH — request a fresh OTP. Anonymous (`requiresAuth: false`). */
  async requestOtp(
    input: RequestOtpInput,
    options?: RequestOptions,
  ): Promise<RequestOtpResponse> {
    const body = RequestOtpInputSchema.parse(input);
    const resp = await this.http.post('/auth/otp/request', body, {
      requiresAuth: false,
      idempotencyKey: options?.idempotencyKey,
      signal: options?.signal,
      timeout: options?.timeoutMs,
    });
    return RequestOtpResponseSchema.parse(resp.data);
  }

  /** FR-AUTH — verify OTP and obtain a session. Anonymous. */
  async verifyOtp(input: VerifyOtpInput, options?: RequestOptions): Promise<Session> {
    const body = VerifyOtpInputSchema.parse(input);
    const resp = await this.http.post('/auth/otp/verify', body, {
      requiresAuth: false,
      idempotencyKey: options?.idempotencyKey,
      signal: options?.signal,
      timeout: options?.timeoutMs,
    });
    return SessionSchema.parse(resp.data);
  }

  /** Rotate the access token using the refresh token. Anonymous. */
  async refresh(input: RefreshInput, options?: RequestOptions): Promise<Session> {
    const body = RefreshInputSchema.parse(input);
    const resp = await this.http.post('/auth/refresh', body, {
      requiresAuth: false,
      idempotencyKey: options?.idempotencyKey,
      signal: options?.signal,
      timeout: options?.timeoutMs,
    });
    return SessionSchema.parse(resp.data);
  }

  /** Revoke a refresh token. Anonymous (the access token may already be expired). */
  async logout(
    input: RefreshInput,
    options?: RequestOptions,
  ): Promise<{ ok: true }> {
    const body = RefreshInputSchema.parse(input);
    const resp = await this.http.post('/auth/logout', body, {
      requiresAuth: false,
      idempotencyKey: options?.idempotencyKey,
      signal: options?.signal,
      timeout: options?.timeoutMs,
    });
    return z.object({ ok: z.literal(true) }).parse(resp.data);
  }
}
