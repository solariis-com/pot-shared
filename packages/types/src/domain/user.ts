import { z } from 'zod';
import { IdentityDocumentSchema } from './identity';

/**
 * Top-level POT roles per docs/user-flows/README.md (U1..U5).
 * - worker  (U1 individual + U2 shared pote integrante)
 * - commerce (U3 owner/manager — also includes staff sub-role)
 * - consumer (U4 anonymous web flow — typically transient, no persisted account)
 * - admin   (U5 SOLARIIS ops)
 */
export const USER_ROLES = ['worker', 'commerce', 'consumer', 'admin'] as const;
export const UserRoleSchema = z.enum(USER_ROLES);
export type UserRole = z.infer<typeof UserRoleSchema>;

/** Worker sub-type per personas.ts canon v2.3. */
export const WORKER_TYPES = ['mesonera', 'valet', 'delivery', 'other'] as const;
export const WorkerTypeSchema = z.enum(WORKER_TYPES);
export type WorkerType = z.infer<typeof WorkerTypeSchema>;

/**
 * Account lifecycle. `archived` lines up with PRD v2.6 D-4 (archive never delete).
 * `pending_kyc` covers Commerce flow + worker re-binding cédula (FR-AUTH/FR-CP).
 */
export const ACCOUNT_STATUSES = [
  'pending_kyc',
  'active',
  'suspended',
  'archived',
] as const;
export const AccountStatusSchema = z.enum(ACCOUNT_STATUSES);
export type AccountStatus = z.infer<typeof AccountStatusSchema>;

/** Phone number stored in E.164 form. Phase 1 is VE-only (+58 prefix). */
const PhoneSchema = z
  .string()
  .regex(/^\+58\d{10}$/, 'Phone must be E.164 +58 followed by 10 digits');

/** Bank account holder destination — FR-WP "una cuenta destino". */
export const BankAccountSchema = z.object({
  bankCode: z.string().min(2).max(10),
  /** Holder full name as on bank record. */
  holderName: z.string().min(2).max(120),
  /** Holder identity doc — must match user identity by KYC. */
  holderIdentity: IdentityDocumentSchema,
  accountNumber: z.string().regex(/^\d{20}$/, 'VE account numbers are 20 digits'),
});
export type BankAccount = z.infer<typeof BankAccountSchema>;

/** Base fields shared by every authenticated user record. */
const BaseUserSchema = z.object({
  id: z.string().uuid(),
  phone: PhoneSchema,
  status: AccountStatusSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  /** Optional biometric opt-in flag (FR-AUTH). */
  biometricEnabled: z.boolean().default(false),
});

export const WorkerSchema = BaseUserSchema.extend({
  role: z.literal('worker'),
  firstName: z.string().min(1).max(80),
  lastName: z.string().min(1).max(80),
  identity: IdentityDocumentSchema,
  workerType: WorkerTypeSchema,
  /** Single deposit account per FR-WP. */
  bankAccount: BankAccountSchema,
  /** Static QR handle used in `po-t.app/p/{handle}`. */
  potHandle: z.string().regex(/^[a-z0-9-]{3,40}$/),
});
export type Worker = z.infer<typeof WorkerSchema>;

export const CommerceSchema = BaseUserSchema.extend({
  role: z.literal('commerce'),
  /** Trade/display name. */
  tradeName: z.string().min(2).max(120),
  /** Jurídico identity required for commerces per FR-CP. */
  identity: IdentityDocumentSchema,
  fiscalAddress: z.string().min(5).max(300),
  /** Operating city for routing/analytics. */
  city: z.string().min(2).max(80),
  /** Settlement bank account (commerce settlement, not staff payouts). */
  bankAccount: BankAccountSchema,
});
export type Commerce = z.infer<typeof CommerceSchema>;

/**
 * Consumer flow is anonymous per PRD (no persisted user typically).
 * This schema exists for the rare case we capture an opted-in consumer
 * receipt phone for WhatsApp delivery — see FR-NT.
 */
export const ConsumerSchema = z.object({
  role: z.literal('consumer'),
  /** Transient session id; not a uuid because no DB row exists. */
  sessionId: z.string().min(8),
  /** Optional phone if consumer accepted WhatsApp receipt. */
  phone: PhoneSchema.optional(),
});
export type Consumer = z.infer<typeof ConsumerSchema>;

export const AdminSchema = BaseUserSchema.extend({
  role: z.literal('admin'),
  email: z.string().email(),
  firstName: z.string().min(1).max(80),
  lastName: z.string().min(1).max(80),
  /** SOLARIIS ops scope — read/write/super. */
  scope: z.enum(['read', 'write', 'super']),
});
export type Admin = z.infer<typeof AdminSchema>;

/**
 * Discriminated union of all user shapes — convenient for adapters that
 * route by role.
 */
export const UserSchema = z.discriminatedUnion('role', [
  WorkerSchema,
  CommerceSchema,
  ConsumerSchema,
  AdminSchema,
]);
export type User = z.infer<typeof UserSchema>;
