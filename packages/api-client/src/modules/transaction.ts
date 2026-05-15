import type { AxiosInstance } from 'axios';
import { z } from 'zod';
import type { CursorPaginated, CursorQuery, RequestOptions } from '../types';

/**
 * Transaction module — FR-LD (Ledger) + FR-R4 (Payment rail).
 *
 * Wire endpoints (anticipated):
 *   POST /transactions/tips                 → create a tip (consumer flow U4)
 *   GET  /transactions/tips/:id             → tip status (pending → paid → dispersed → notified)
 *   GET  /transactions                      → ledger history, cursor-paginated
 *
 * Tip creation is the hot-path POST that absolutely must carry an
 * Idempotency-Key: a network blip mid-checkout cannot result in a double
 * charge. The client interceptor stamps a key automatically; callers MAY pass
 * an explicit one if they need to re-attempt from a different process.
 */

const PhoneSchema = z.string().regex(/^\+58\d{10}$/);

export const TIP_STATUSES = ['pending', 'paid', 'dispersed', 'notified', 'failed'] as const;
export const TipStatusSchema = z.enum(TIP_STATUSES);
export type TipStatus = z.infer<typeof TipStatusSchema>;

export const CreateTipInputSchema = z.object({
  /** Pote receiving the tip (resolves the integrantes + distribution rule). */
  poteId: z.string().uuid(),
  /** Amount in cents to avoid float drift; the backend normalizes the currency. */
  amountCents: z.number().int().positive(),
  /** ISO-4217 currency code (MVP: 'VES' or 'USD'). */
  currency: z.enum(['VES', 'USD']),
  /** Optional consumer phone for FR-NT WhatsApp receipt. */
  consumerPhone: PhoneSchema.optional(),
  /** Optional consumer-supplied note (max 280 chars). */
  message: z.string().max(280).optional(),
  /** Optional client-side reference for analytics correlation. */
  clientRef: z.string().max(80).optional(),
});
export type CreateTipInput = z.infer<typeof CreateTipInputSchema>;

export const TipSchema = z.object({
  id: z.string().uuid(),
  poteId: z.string().uuid(),
  amountCents: z.number().int().positive(),
  currency: z.enum(['VES', 'USD']),
  status: TipStatusSchema,
  /** R4 transaction id once the rail call lands — null while pending. */
  r4TransactionId: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Tip = z.infer<typeof TipSchema>;

export const TransactionListQuerySchema = z
  .object({
    cursor: z.string().optional(),
    limit: z.number().int().positive().max(100).optional(),
    poteId: z.string().uuid().optional(),
    status: TipStatusSchema.optional(),
    /** Optional ISO date inclusive lower bound. */
    since: z.string().datetime().optional(),
    /** Optional ISO date inclusive upper bound. */
    until: z.string().datetime().optional(),
  })
  .partial();
export type TransactionListQuery = z.infer<typeof TransactionListQuerySchema> & CursorQuery;

export class TransactionModule {
  constructor(private readonly http: AxiosInstance) {}

  /**
   * POST /transactions/tips — create a tip (consumer-initiated, anonymous).
   *
   * Anonymous: `requiresAuth: false`. The route is rate-limited per pote +
   * IP at the backend layer.
   */
  async createTip(input: CreateTipInput, options?: RequestOptions): Promise<Tip> {
    const body = CreateTipInputSchema.parse(input);
    const resp = await this.http.post('/transactions/tips', body, {
      requiresAuth: options?.requiresAuth ?? false,
      idempotencyKey: options?.idempotencyKey,
      signal: options?.signal,
      timeout: options?.timeoutMs,
    });
    return TipSchema.parse(resp.data);
  }

  /** GET /transactions/tips/:id — poll status. */
  async getTipStatus(id: string, options?: RequestOptions): Promise<Tip> {
    const validId = z.string().uuid().parse(id);
    const resp = await this.http.get(
      `/transactions/tips/${encodeURIComponent(validId)}`,
      {
        // Anonymous consumers polling their own tip use a short-lived
        // signed receipt token; authenticated workers and admins use Bearer.
        requiresAuth: options?.requiresAuth ?? true,
        signal: options?.signal,
        timeout: options?.timeoutMs,
      },
    );
    return TipSchema.parse(resp.data);
  }

  /** GET /transactions — ledger history (worker, commerce, admin). */
  async listTransactions(
    query?: TransactionListQuery,
    options?: RequestOptions,
  ): Promise<CursorPaginated<Tip>> {
    const validated = query ? TransactionListQuerySchema.parse(query) : undefined;
    const resp = await this.http.get('/transactions', {
      params: validated,
      signal: options?.signal,
      timeout: options?.timeoutMs,
    });
    return resp.data as CursorPaginated<Tip>;
  }
}
