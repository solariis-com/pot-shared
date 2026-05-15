import { z } from 'zod';
import { TransactionStatusSchema } from '../domain/transaction';

/**
 * R4 dispersion callback — FR-R4.
 *
 * R4 PLINK posts back to POT with the result of the multi-beneficiary
 * dispersion. The webhook is signed with HMAC-SHA256 over the JSON body.
 * The `idempotency_key` echoes the one we sent in the PLINK request so the
 * worker can dedupe replays.
 *
 * Field naming follows R4's snake_case convention (per integration spec)
 * to match the wire shape exactly. We do NOT camelCase on receipt.
 */
export const R4WebhookPayloadSchema = z.object({
  idempotency_key: z.string().min(16).max(80),
  r4_transaction_id: z.string().min(1),
  /** R4 reports one of these states; POT maps onto its own TransactionStatus. */
  status: TransactionStatusSchema,
  /** Per-beneficiary outcome. */
  splits: z
    .array(
      z.object({
        beneficiary_id: z.string().min(1),
        delivered: z.boolean(),
        /** Failure code if `delivered=false`. */
        failure_code: z.string().optional(),
      }),
    )
    .min(1),
  /** Server-side timestamp from R4 (ISO 8601). */
  recorded_at: z.string().datetime(),
  /** HMAC-SHA256(secret, canonical(body)). Hex-encoded. */
  signature_hmac: z.string().regex(/^[a-f0-9]{64}$/, 'Expected hex sha256 HMAC'),
});
export type R4WebhookPayload = z.infer<typeof R4WebhookPayloadSchema>;
