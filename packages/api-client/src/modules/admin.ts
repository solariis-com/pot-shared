import type { AxiosInstance } from 'axios';
import { z } from 'zod';
import type { ListQuery, Paginated, RequestOptions } from '../types';

/**
 * Admin module — U5 SOLARIIS ops surface.
 *
 * Wire endpoints (anticipated):
 *   GET   /admin/users                      → paginated user list (workers + commerces)
 *   POST  /admin/users/:id/kyc/verify       → mark KYC verified, transitions to active
 *   POST  /admin/users/:id/kyc/reject       → mark KYC rejected with a reason
 *   POST  /admin/potes/:id/regenerate-url   → rotate static handle (e.g. on compromise)
 *
 * All endpoints are scope-gated at the backend per Admin.scope (read | write | super).
 * The SDK does NOT pre-check scope — surfacing the 403 from the backend is the
 * single source of truth.
 */

const PhoneSchema = z.string().regex(/^\+58\d{10}$/);

export const AdminUserListQuerySchema = z
  .object({
    page: z.number().int().positive().optional(),
    pageSize: z.number().int().positive().max(100).optional(),
    q: z.string().min(1).max(120).optional(),
    role: z.enum(['worker', 'commerce', 'admin']).optional(),
    status: z.enum(['pending_kyc', 'active', 'suspended', 'archived']).optional(),
  })
  .partial();
export type AdminUserListQuery = z.infer<typeof AdminUserListQuerySchema> & ListQuery;

export const VerifyKycInputSchema = z.object({
  userId: z.string().uuid(),
  /** Optional internal note for the audit log. */
  note: z.string().max(500).optional(),
});
export type VerifyKycInput = z.infer<typeof VerifyKycInputSchema>;

export const RejectKycInputSchema = z.object({
  userId: z.string().uuid(),
  /** Required — surfaces to the user in the rejection notification. */
  reason: z.string().min(4).max(500),
});
export type RejectKycInput = z.infer<typeof RejectKycInputSchema>;

export const RegeneratePotUrlInputSchema = z.object({
  poteId: z.string().uuid(),
  reason: z.enum(['compromise', 'rename', 'admin_request', 'other']),
  /** Optional internal note. */
  note: z.string().max(500).optional(),
});
export type RegeneratePotUrlInput = z.infer<typeof RegeneratePotUrlInputSchema>;

export const RegeneratePotUrlResponseSchema = z.object({
  poteId: z.string().uuid(),
  oldHandle: z.string(),
  newHandle: z.string(),
  rotatedAt: z.string().datetime(),
});
export type RegeneratePotUrlResponse = z.infer<typeof RegeneratePotUrlResponseSchema>;

/** Trimmed user envelope for admin lists — full record fetched via single-get. */
export const AdminUserListItemSchema = z.object({
  id: z.string().uuid(),
  role: z.enum(['worker', 'commerce', 'admin']),
  status: z.enum(['pending_kyc', 'active', 'suspended', 'archived']),
  phone: PhoneSchema,
  displayName: z.string(),
  createdAt: z.string().datetime(),
});
export type AdminUserListItem = z.infer<typeof AdminUserListItemSchema>;

export class AdminModule {
  constructor(private readonly http: AxiosInstance) {}

  /** GET /admin/users — paginated list of users for admin review. */
  async listUsers(
    query?: AdminUserListQuery,
    options?: RequestOptions,
  ): Promise<Paginated<AdminUserListItem>> {
    const validated = query ? AdminUserListQuerySchema.parse(query) : undefined;
    const resp = await this.http.get('/admin/users', {
      params: validated,
      signal: options?.signal,
      timeout: options?.timeoutMs,
    });
    return resp.data as Paginated<AdminUserListItem>;
  }

  /** POST /admin/users/:id/kyc/verify — mark KYC verified. */
  async verifyKyc(
    input: VerifyKycInput,
    options?: RequestOptions,
  ): Promise<{ ok: true; userId: string }> {
    const { userId, ...body } = VerifyKycInputSchema.parse(input);
    const resp = await this.http.post(
      `/admin/users/${encodeURIComponent(userId)}/kyc/verify`,
      body,
      {
        idempotencyKey: options?.idempotencyKey,
        signal: options?.signal,
        timeout: options?.timeoutMs,
      },
    );
    return z.object({ ok: z.literal(true), userId: z.string().uuid() }).parse(resp.data);
  }

  /** POST /admin/users/:id/kyc/reject — mark KYC rejected with reason. */
  async rejectKyc(
    input: RejectKycInput,
    options?: RequestOptions,
  ): Promise<{ ok: true; userId: string }> {
    const { userId, ...body } = RejectKycInputSchema.parse(input);
    const resp = await this.http.post(
      `/admin/users/${encodeURIComponent(userId)}/kyc/reject`,
      body,
      {
        idempotencyKey: options?.idempotencyKey,
        signal: options?.signal,
        timeout: options?.timeoutMs,
      },
    );
    return z.object({ ok: z.literal(true), userId: z.string().uuid() }).parse(resp.data);
  }

  /** POST /admin/potes/:id/regenerate-url — rotate the static handle. */
  async regeneratePotUrl(
    input: RegeneratePotUrlInput,
    options?: RequestOptions,
  ): Promise<RegeneratePotUrlResponse> {
    const { poteId, ...body } = RegeneratePotUrlInputSchema.parse(input);
    const resp = await this.http.post(
      `/admin/potes/${encodeURIComponent(poteId)}/regenerate-url`,
      body,
      {
        idempotencyKey: options?.idempotencyKey,
        signal: options?.signal,
        timeout: options?.timeoutMs,
      },
    );
    return RegeneratePotUrlResponseSchema.parse(resp.data);
  }
}
