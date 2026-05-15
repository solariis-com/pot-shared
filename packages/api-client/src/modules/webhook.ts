import { z } from 'zod';

/**
 * R4 webhook ingestion — FR-R4.
 *
 * This file declares the SERVER-side contract that the POT backend implements
 * for the R4 (banking rail) → POT webhook handshake. It lives in the SDK so
 * that:
 *
 *   - The backend can import the interface and conform to it directly.
 *   - Any first-party tooling (e.g. local emulator, integration tests) can
 *     program against the same shape without redefining DTOs.
 *
 * The interface intentionally takes `payload: unknown` and `signature: string`
 * because the framing varies by rail (REST vs SQS-style), but the response
 * contract is uniform.
 */

export const R4WebhookEventSchema = z.object({
  /**
   * Idempotency anchor for FR-LD — the R4 transaction id we dedupe on.
   * Replays of the same id are no-ops on the ledger.
   */
  r4_transaction_id: z.string().min(8),
  /** Wire event kind: payment.completed | payment.failed | payment.refunded. */
  event_type: z.enum([
    'payment.completed',
    'payment.failed',
    'payment.refunded',
    'reconciliation.report',
  ]),
  /** ISO timestamp the event was emitted at R4. */
  occurred_at: z.string().datetime(),
  /** Opaque payload object — schema varies by event_type, validated downstream. */
  data: z.record(z.unknown()),
});
export type R4WebhookEvent = z.infer<typeof R4WebhookEventSchema>;

export type R4WebhookHandlerResult =
  | { status: 'ok' }
  | { status: 'rejected'; reason: string };

/**
 * Backend-side handler contract. Implementations MUST verify the HMAC
 * signature before performing any state changes. The error semantics:
 *
 *   - Returning `{status: 'ok'}` causes the backend route to respond 200.
 *   - Returning `{status: 'rejected', reason}` causes a 400 with the reason
 *     surfaced in the response body so R4 stops retrying.
 *   - Throwing a `R4Error` (or any error) causes a 502 — R4 will retry per
 *     its own backoff policy.
 */
export interface R4WebhookHandler {
  handle(payload: unknown, signature: string): Promise<R4WebhookHandlerResult>;
}
