import type { AxiosInstance } from 'axios';
import { z } from 'zod';
import type { ListQuery, Paginated, RequestOptions } from '../types';

/**
 * Pote module — FR-PE + FR-WP-29.
 *
 * Wire endpoints (anticipated):
 *   GET    /potes                       → list (paginated)
 *   GET    /potes/:id                   → fetch single
 *   POST   /potes                       → create (draft or pending_acceptance)
 *   PATCH  /potes/:id                   → update (re-triggers acceptance per FR-PE)
 *   POST   /potes/:id/archive           → archive (PRD D-4: never delete)
 *   POST   /potes/:id/join              → worker join request (shared pote)
 *   POST   /potes/:id/accept            → worker accepts pending pote version
 *   POST   /potes/:id/reject            → worker rejects pending pote version
 *
 * The DTO schemas here are intentionally loose-ish — they describe the SDK
 * surface, not the canonical schema. The canonical PoteSchema lives in
 * `@solariis/pot-types`; post-codegen this module will validate responses
 * against that schema directly.
 */

// Canonical domain schemas come from `@solariis/pot-types`. Using them here
// keeps the SDK input validation consistent with the backend's source-of-
// truth domain rules — no risk of drift between the two.
import type {
  DistributionRule,
  Pote,
  PoteIntegrante,
  PoteKind,
  PoteLifecycle,
} from '@solariis/pot-types';
import {
  DistributionRuleSchema,
  PoteKindSchema,
  PoteLifecycleSchema,
} from '@solariis/pot-types';

export const PoteCreateInputSchema = z.object({
  commerceId: z.string().uuid(),
  name: z.string().min(2).max(120),
  kind: PoteKindSchema,
  rule: DistributionRuleSchema,
  /** Worker ids to invite as integrantes (acceptance pending until they accept). */
  integranteWorkerIds: z.array(z.string().uuid()).min(1),
});
export type PoteCreateInput = z.infer<typeof PoteCreateInputSchema>;

export const PoteUpdateInputSchema = z
  .object({
    name: z.string().min(2).max(120).optional(),
    rule: DistributionRuleSchema.optional(),
    integranteWorkerIds: z.array(z.string().uuid()).min(1).optional(),
  })
  .refine((v) => Object.keys(v).length > 0, {
    message: 'At least one field must be provided',
  });
export type PoteUpdateInput = z.infer<typeof PoteUpdateInputSchema>;

export const PoteListQuerySchema = z
  .object({
    page: z.number().int().positive().optional(),
    pageSize: z.number().int().positive().max(100).optional(),
    q: z.string().min(1).max(120).optional(),
    commerceId: z.string().uuid().optional(),
    lifecycle: PoteLifecycleSchema.optional(),
  })
  .partial();
export type PoteListQuery = z.infer<typeof PoteListQuerySchema> & ListQuery;

/** Re-export for ergonomic SDK surface. */
export type { Pote, PoteKind, PoteLifecycle, PoteIntegrante, DistributionRule };

export class PoteModule {
  constructor(private readonly http: AxiosInstance) {}

  /** GET /potes — paginated list, scoped to caller role at the backend layer. */
  async list(query?: PoteListQuery, options?: RequestOptions): Promise<Paginated<Pote>> {
    const validated = query ? PoteListQuerySchema.parse(query) : undefined;
    const resp = await this.http.get('/potes', {
      params: validated,
      signal: options?.signal,
      timeout: options?.timeoutMs,
    });
    return resp.data as Paginated<Pote>;
  }

  /** GET /potes/:id — single pote. */
  async get(id: string, options?: RequestOptions): Promise<Pote> {
    const validId = z.string().uuid().parse(id);
    const resp = await this.http.get(`/potes/${encodeURIComponent(validId)}`, {
      signal: options?.signal,
      timeout: options?.timeoutMs,
    });
    return resp.data as Pote;
  }

  /** POST /potes — create a pote (commerce-side flow, U3). */
  async create(input: PoteCreateInput, options?: RequestOptions): Promise<Pote> {
    const body = PoteCreateInputSchema.parse(input);
    const resp = await this.http.post('/potes', body, {
      idempotencyKey: options?.idempotencyKey,
      signal: options?.signal,
      timeout: options?.timeoutMs,
    });
    return resp.data as Pote;
  }

  /** PATCH /potes/:id — update (resets integrantes back to pending_acceptance). */
  async update(
    id: string,
    input: PoteUpdateInput,
    options?: RequestOptions,
  ): Promise<Pote> {
    const validId = z.string().uuid().parse(id);
    const body = PoteUpdateInputSchema.parse(input);
    const resp = await this.http.patch(`/potes/${encodeURIComponent(validId)}`, body, {
      idempotencyKey: options?.idempotencyKey,
      signal: options?.signal,
      timeout: options?.timeoutMs,
    });
    return resp.data as Pote;
  }

  /** POST /potes/:id/archive — PRD D-4: archive, never delete. */
  async archive(id: string, options?: RequestOptions): Promise<Pote> {
    const validId = z.string().uuid().parse(id);
    const resp = await this.http.post(
      `/potes/${encodeURIComponent(validId)}/archive`,
      {},
      {
        idempotencyKey: options?.idempotencyKey,
        signal: options?.signal,
        timeout: options?.timeoutMs,
      },
    );
    return resp.data as Pote;
  }

  /**
   * POST /potes/:id/join — worker side, U2 shared pote.
   *
   * Used when a worker is invited via deep-link / QR; the commerce already
   * staged them as `pending` and `join` is the worker's positive ack to be
   * considered for activation.
   */
  async join(id: string, options?: RequestOptions): Promise<PoteIntegrante> {
    const validId = z.string().uuid().parse(id);
    const resp = await this.http.post(
      `/potes/${encodeURIComponent(validId)}/join`,
      {},
      {
        idempotencyKey: options?.idempotencyKey,
        signal: options?.signal,
        timeout: options?.timeoutMs,
      },
    );
    return resp.data as PoteIntegrante;
  }

  /** POST /potes/:id/accept — FR-WP-29: worker accepts a pending pote version. */
  async accept(id: string, options?: RequestOptions): Promise<PoteIntegrante> {
    const validId = z.string().uuid().parse(id);
    const resp = await this.http.post(
      `/potes/${encodeURIComponent(validId)}/accept`,
      {},
      {
        idempotencyKey: options?.idempotencyKey,
        signal: options?.signal,
        timeout: options?.timeoutMs,
      },
    );
    return resp.data as PoteIntegrante;
  }

  /** POST /potes/:id/reject — FR-WP-29: worker rejects pending pote version. */
  async reject(
    id: string,
    input: { reason?: string } = {},
    options?: RequestOptions,
  ): Promise<PoteIntegrante> {
    const validId = z.string().uuid().parse(id);
    const body = z
      .object({ reason: z.string().min(2).max(500).optional() })
      .parse(input);
    const resp = await this.http.post(
      `/potes/${encodeURIComponent(validId)}/reject`,
      body,
      {
        idempotencyKey: options?.idempotencyKey,
        signal: options?.signal,
        timeout: options?.timeoutMs,
      },
    );
    return resp.data as PoteIntegrante;
  }
}
