import { z } from 'zod';

/**
 * FR-AD: SOLARIIS Admin web surface (A-01..A-10).
 *
 * - KYC verify/reject for Commerce + Worker re-binding cédula
 * - Regenerate PoT URL (HMAC rotation)
 * - Read-only ledger lookup
 */

export const KycVerifyDtoSchema = z.object({
  /** Commerce or worker id under review. */
  subjectId: z.string().uuid(),
  subjectKind: z.enum(['commerce', 'worker']),
  /** Optional decision note for audit trail. */
  decisionNote: z.string().max(500).optional(),
});
export type KycVerifyDto = z.infer<typeof KycVerifyDtoSchema>;

export const KycRejectDtoSchema = z.object({
  subjectId: z.string().uuid(),
  subjectKind: z.enum(['commerce', 'worker']),
  /** Rejection reason is REQUIRED for KYC reject (compliance). */
  reason: z.string().min(2).max(500),
  /** Fields the operator wants the subject to fix on re-submission. */
  fieldsToFix: z.array(z.string()).optional(),
});
export type KycRejectDto = z.infer<typeof KycRejectDtoSchema>;

export const RegeneratePotUrlDtoSchema = z.object({
  /** Either a workerId (personal handle) or a poteId. */
  subjectId: z.string().uuid(),
  subjectKind: z.enum(['worker', 'pote']),
  /** Optional new handle — server validates collision and slug shape. */
  newHandle: z
    .string()
    .regex(/^[a-z0-9-]{3,60}$/)
    .optional(),
  /** Operator-provided audit reason. */
  reason: z.string().max(500).optional(),
});
export type RegeneratePotUrlDto = z.infer<typeof RegeneratePotUrlDtoSchema>;
