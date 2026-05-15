import { z } from 'zod';

/**
 * Pote lifecycle — PRD v2.6 D-1.
 *
 *   draft → pending_acceptance → active → archived
 *                 ↓
 *             rejected (un worker rechazó)
 *                 ↓ (commerce ajusta)
 *             pending_acceptance (re-loop)
 *
 * `archived` is terminal in the sense it can only be reactivated back via
 * pending_acceptance — never deleted (D-4).
 */
export const POTE_LIFECYCLE = [
  'draft',
  'pending_acceptance',
  'active',
  'archived',
  'rejected',
] as const;
export const PoteLifecycleSchema = z.enum(POTE_LIFECYCLE);
export type PoteLifecycle = z.infer<typeof PoteLifecycleSchema>;

/**
 * Distribution rule kinds.
 *
 * MVP (PRD v2.6 D-7) ships 3 rules:
 *   - personal           (R-1, 100% to a single worker)
 *   - igualitario        (R-2, equal split across active integrantes)
 *   - porcentajes_fijos  (R-3, manual % per worker, sum must = 100)
 *
 * Phase 2 (deferred, gated by feature flags `RULE_BY_HOURS` / `RULE_BY_POINTS`):
 *   - por_horas
 *   - por_puntos
 *
 * Phase 2 rules are kept in the type for forward compatibility, but
 * `MVPDistributionRuleKindSchema` is the runtime gate.
 */
export const DISTRIBUTION_RULE_KINDS_MVP = [
  'personal',
  'igualitario',
  'porcentajes_fijos',
] as const;

/** @deprecated for MVP runtime use — kept for Phase 2 forward compat. */
export const DISTRIBUTION_RULE_KINDS_PHASE2 = ['por_horas', 'por_puntos'] as const;

export const DISTRIBUTION_RULE_KINDS_ALL = [
  ...DISTRIBUTION_RULE_KINDS_MVP,
  ...DISTRIBUTION_RULE_KINDS_PHASE2,
] as const;

export const MVPDistributionRuleKindSchema = z.enum(DISTRIBUTION_RULE_KINDS_MVP);
export type MVPDistributionRuleKind = z.infer<typeof MVPDistributionRuleKindSchema>;

export const DistributionRuleKindSchema = z.enum(DISTRIBUTION_RULE_KINDS_ALL);
export type DistributionRuleKind = z.infer<typeof DistributionRuleKindSchema>;

/** Single beneficiary % within a `porcentajes_fijos` rule. */
export const BeneficiarySplitSchema = z.object({
  workerId: z.string().uuid(),
  /** Integer-or-decimal percentage, 0 < pct <= 100. */
  percentage: z.number().gt(0).lte(100),
});
export type BeneficiarySplit = z.infer<typeof BeneficiarySplitSchema>;

/**
 * Distribution rule discriminated by kind. The `splits` field is meaningful
 * only for `porcentajes_fijos`; for MVP `personal`/`igualitario` the rule is
 * derived from the roster at dispersion time.
 *
 * The 100% sum-check for `porcentajes_fijos` is applied as a parent-level
 * refinement (Zod's `discriminatedUnion` rejects `ZodEffects` branches).
 */
const DistributionRuleBaseSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('personal'), workerId: z.string().uuid() }),
  z.object({ kind: z.literal('igualitario') }),
  z.object({
    kind: z.literal('porcentajes_fijos'),
    splits: z.array(BeneficiarySplitSchema).min(1),
  }),
  // Phase 2 (deferred — kept here so a backend behind a feature flag
  // can still parse persisted payloads without barfing).
  z.object({ kind: z.literal('por_horas') }),
  z.object({ kind: z.literal('por_puntos') }),
]);

export const DistributionRuleSchema = DistributionRuleBaseSchema.superRefine(
  (rule, ctx) => {
    if (rule.kind !== 'porcentajes_fijos') return;
    const total = rule.splits.reduce((acc, s) => acc + s.percentage, 0);
    // tolerate 0.01% rounding noise
    if (Math.abs(total - 100) >= 0.01) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'porcentajes_fijos splits must sum to 100%',
        path: ['splits'],
      });
    }
  },
);
export type DistributionRule = z.infer<typeof DistributionRuleSchema>;

/** Single worker integrante of a pote with their acceptance status. */
export const PoteIntegranteSchema = z.object({
  workerId: z.string().uuid(),
  /** Acceptance state for this specific pote version. */
  acceptanceStatus: z.enum(['pending', 'accepted', 'rejected']),
  /** When the worker most recently transitioned acceptanceStatus. */
  acceptanceUpdatedAt: z.string().datetime().optional(),
});
export type PoteIntegrante = z.infer<typeof PoteIntegranteSchema>;

export const PoteKindSchema = z.enum(['personal', 'shared']);
export type PoteKind = z.infer<typeof PoteKindSchema>;

/**
 * A Pote ties a commerce, a distribution rule, and 1..N worker integrantes.
 * Personal potes (single worker) and shared potes (multiple integrantes) are
 * both represented here; `kind` is the discriminator for UX/routing.
 */
export const PoteSchema = z.object({
  id: z.string().uuid(),
  commerceId: z.string().uuid(),
  /** Display name shown to consumers + on receipts (e.g. "Pote de mesoneros"). */
  name: z.string().min(2).max(120),
  kind: PoteKindSchema,
  rule: DistributionRuleSchema,
  integrantes: z.array(PoteIntegranteSchema).min(1),
  lifecycle: PoteLifecycleSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  /** Static PoT URL handle: `po-t.app/p/{handle}`. */
  handle: z.string().regex(/^[a-z0-9-]{3,60}$/),
  /** Set when lifecycle === 'archived'. */
  archivedAt: z.string().datetime().optional(),
});
export type Pote = z.infer<typeof PoteSchema>;
