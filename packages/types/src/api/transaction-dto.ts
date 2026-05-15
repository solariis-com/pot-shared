import { z } from 'zod';
import { MoneyAmountSchema, TransactionStatusSchema } from '../domain/transaction';

/**
 * FR-LD / FR-R4: consumer tip-creation surface (S-01..S-08) and status polling.
 */

export const CreateTipDtoSchema = z.object({
  /**
   * Idempotency key from the consumer client — required to dedupe retries
   * on flaky mobile network (FR-LD).
   */
  idempotencyKey: z.string().min(16).max(80),
  poteId: z.string().uuid(),
  /**
   * Tip amount selected by consumer (BEFORE POT fee markup).
   * Server computes fee and totalAmount from commerce-level fee % (D-5).
   */
  tipAmount: MoneyAmountSchema,
  /** Optional consumer message — bounded to 140 chars per microcopy patterns. */
  consumerMessage: z.string().max(140).optional(),
  /** Optional WhatsApp receipt phone — E.164 +58…. */
  consumerReceiptPhone: z
    .string()
    .regex(/^\+58\d{10}$/)
    .optional(),
  /** Bank emisor selected by consumer (top-8 VE banks). */
  emisorBankCode: z.string().min(2).max(10),
});
export type CreateTipDto = z.infer<typeof CreateTipDtoSchema>;

export const GetTipStatusDtoSchema = z.object({
  transactionId: z.string().uuid(),
});
export type GetTipStatusDto = z.infer<typeof GetTipStatusDtoSchema>;

export const TipStatusResponseSchema = z.object({
  transactionId: z.string().uuid(),
  status: TransactionStatusSchema,
  /** Filled once R4 PLINK confirms. */
  r4TransactionId: z.string().optional(),
  /** Total amount the consumer is debited (tip + POT fee). */
  totalAmount: MoneyAmountSchema,
  /** Public PoT URL (after dispersion succeeds). */
  potReceiptUrl: z.string().url().optional(),
});
export type TipStatusResponse = z.infer<typeof TipStatusResponseSchema>;
