import { z } from 'zod';
import { TransactionStatusSchema } from './transaction';

/**
 * Append-only ledger entry per FR-LD.
 *
 * - Hash chain: each entry references the previous entry's hash. The first
 *   entry per partition (e.g. per commerce, per day) uses a `genesisHash`
 *   from configuration.
 * - Entries are immutable. Corrections happen as compensating new entries.
 * - The `hmac` field carries the PoT URL HMAC for entries that produce a
 *   public receipt (FR-QR).
 */
export const LEDGER_EVENT_KINDS = [
  'transaction_created',
  'transaction_status_changed',
  'pote_lifecycle_changed',
  'pote_rule_changed',
  'pote_roster_changed',
  'pote_acceptance_recorded',
  'commerce_kyc_decision',
  'admin_action',
] as const;
export const LedgerEventKindSchema = z.enum(LEDGER_EVENT_KINDS);
export type LedgerEventKind = z.infer<typeof LedgerEventKindSchema>;

/** Hex-encoded SHA-256 hash (64 chars). */
const Sha256HexSchema = z.string().regex(/^[a-f0-9]{64}$/, 'Expected hex sha256');

export const LedgerEntrySchema = z.object({
  id: z.string().uuid(),
  /** Monotonic per-partition sequence number. */
  sequence: z.number().int().nonnegative(),
  kind: LedgerEventKindSchema,
  /** Subject of the event (transactionId, poteId, commerceId, etc.). */
  subjectId: z.string().min(1),
  /** Optional richer context — kept open as freeform record. */
  payload: z.record(z.unknown()),
  /** Snapshot of resulting status if `kind = transaction_status_changed`. */
  resultingStatus: TransactionStatusSchema.optional(),
  /** Hash of the previous entry in the chain (or genesis). */
  previousHash: Sha256HexSchema,
  /** Hash of THIS entry's canonical content + previousHash. */
  hash: Sha256HexSchema,
  /** Optional PoT-URL HMAC for public-receipt entries. */
  potUrlHmac: z.string().optional(),
  /** Wall-clock time the entry was committed (server-side). */
  recordedAt: z.string().datetime(),
});
export type LedgerEntry = z.infer<typeof LedgerEntrySchema>;
