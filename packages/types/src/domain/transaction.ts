import { z } from 'zod';

/**
 * Transaction lifecycle per FR-LD:
 *   pending → paid → dispersed → notified
 *                              → failed (terminal)
 *
 * - pending: created, consumer initiated payment but R4 PLINK not confirmed
 * - paid: R4 PLINK debited consumer, prior to dispersion to beneficiaries
 *         (the legitimate sub-5s transit window referenced in PRD wallet manifesto)
 * - dispersed: R4 confirmed multi-beneficiary payout — POT recorded the event
 * - notified: worker(s) push/WA notified (FR-NT) — terminal happy path
 * - failed: any error from R4 PLINK or dispersion; idempotent retries allowed
 */
export const TRANSACTION_STATUSES = [
  'pending',
  'paid',
  'dispersed',
  'notified',
  'failed',
] as const;
export const TransactionStatusSchema = z.enum(TRANSACTION_STATUSES);
export type TransactionStatus = z.infer<typeof TransactionStatusSchema>;

/**
 * Bs (Bolívares) amount stored as integer cents (no floating point).
 * 1 Bs = 100 cents.
 */
export const MoneyAmountSchema = z.object({
  /** Integer cents (Bs * 100). Always non-negative. */
  cents: z.number().int().nonnegative(),
  currency: z.literal('VES'),
});
export type MoneyAmount = z.infer<typeof MoneyAmountSchema>;

/**
 * Dispersion split as it goes to R4 PLINK — one row per beneficiary
 * including the POT fee account. Mirrors FR-R4 PLINK array shape.
 */
export const DispersionSplitSchema = z.object({
  /** Destination party id — workerId or 'POT_FEE_ACCOUNT'. */
  beneficiaryId: z.string().min(1),
  /** Destination bank account snapshot at the time of dispersion. */
  bankCode: z.string().min(2).max(10),
  accountNumber: z.string().regex(/^\d{20}$/),
  /** Amount routed to this beneficiary (already net of POT fee for workers). */
  amount: MoneyAmountSchema,
  /** Marks the POT central service fee leg. */
  isFee: z.boolean().default(false),
});
export type DispersionSplit = z.infer<typeof DispersionSplitSchema>;

/**
 * A single tip transaction lifecycle row. Append-only (FR-LD): status
 * transitions create new ledger entries, never mutate this row's history.
 */
export const TransactionSchema = z.object({
  id: z.string().uuid(),
  /**
   * Idempotency key — accepted from client OR derived. Used to dedupe
   * R4 PLINK calls and webhook callbacks (FR-LD).
   */
  idempotencyKey: z.string().min(16).max(80),
  /** R4-side transaction id. Set once PLINK accepts the debit. */
  r4TransactionId: z.string().optional(),
  poteId: z.string().uuid(),
  commerceId: z.string().uuid(),
  /** Net tip amount (what workers actually receive in aggregate). */
  tipAmount: MoneyAmountSchema,
  /** POT fee amount (markup, principio VISA/Mastercard — never shown to consumer/worker). */
  feeAmount: MoneyAmountSchema,
  /** Total debited from consumer = tipAmount + feeAmount. */
  totalAmount: MoneyAmountSchema,
  /** Computed splits sent to R4 PLINK. */
  splits: z.array(DispersionSplitSchema).min(1),
  status: TransactionStatusSchema,
  /** Optional consumer message ("Pa la torta, vale" etc.). */
  consumerMessage: z.string().max(140).optional(),
  /** Optional WhatsApp receipt phone (E.164 +58…). */
  consumerReceiptPhone: z
    .string()
    .regex(/^\+58\d{10}$/)
    .optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Transaction = z.infer<typeof TransactionSchema>;
