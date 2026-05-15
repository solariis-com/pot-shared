import { z } from 'zod';
import {
  DistributionRuleSchema,
  PoteKindSchema,
} from '../domain/pote';

/**
 * FR-PE: pote engine DTOs.
 *
 * `Create` and `Update` cover Commerce-facing endpoints (C-13/C-14 surfaces).
 * `Join` / `Accept` cover Worker-facing endpoints (W-29 acceptance surface).
 */

export const CreatePoteDtoSchema = z.object({
  commerceId: z.string().uuid(),
  name: z.string().min(2).max(120),
  kind: PoteKindSchema,
  rule: DistributionRuleSchema,
  /** Initial roster as worker ids. Empty for `kind=personal` is invalid. */
  workerIds: z.array(z.string().uuid()).min(1),
  /** Static PoT URL handle slug requested. Server may collision-suffix. */
  desiredHandle: z.string().regex(/^[a-z0-9-]{3,60}$/),
});
export type CreatePoteDto = z.infer<typeof CreatePoteDtoSchema>;

/**
 * Mutating fields trigger re-acceptance per D-1. Server determines which
 * subset was provided and decides whether to bump lifecycle to
 * `pending_acceptance`.
 */
export const UpdatePoteDtoSchema = z
  .object({
    name: z.string().min(2).max(120).optional(),
    rule: DistributionRuleSchema.optional(),
    workerIds: z.array(z.string().uuid()).min(1).optional(),
  })
  .refine(
    (data) =>
      data.name !== undefined ||
      data.rule !== undefined ||
      data.workerIds !== undefined,
    { message: 'Provide at least one field to update' },
  );
export type UpdatePoteDto = z.infer<typeof UpdatePoteDtoSchema>;

/** Worker-initiated request to be invited to a pote (rare — usually commerce-initiated). */
export const JoinPoteDtoSchema = z.object({
  poteId: z.string().uuid(),
  workerId: z.string().uuid(),
});
export type JoinPoteDto = z.infer<typeof JoinPoteDtoSchema>;

/**
 * W-29: worker accepts or rejects pote terms.
 * Commerce is notified on rejection so it can adjust + retrigger.
 */
export const AcceptPoteDtoSchema = z.object({
  poteId: z.string().uuid(),
  workerId: z.string().uuid(),
  decision: z.enum(['accept', 'reject']),
  /** Optional free-text rejection reason. */
  rejectionReason: z.string().max(280).optional(),
});
export type AcceptPoteDto = z.infer<typeof AcceptPoteDtoSchema>;

export const ArchivePoteDtoSchema = z.object({
  poteId: z.string().uuid(),
  /** Optional admin/commerce note for audit trail. */
  reason: z.string().max(280).optional(),
});
export type ArchivePoteDto = z.infer<typeof ArchivePoteDtoSchema>;
