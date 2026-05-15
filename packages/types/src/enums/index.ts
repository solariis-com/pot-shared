/**
 * Re-export const-tuples + Zod enums so that callers needing a flat
 * "all enums" import can grab them in one place. This is a convenience —
 * the canonical home of each enum stays in its `domain/*` module.
 */
export {
  NATURAL_PREFIXES,
  JURIDICO_PREFIXES,
  EntityTypeSchema,
  NaturalPrefixSchema,
  JuridicoPrefixSchema,
} from '../domain/identity';

export {
  USER_ROLES,
  WORKER_TYPES,
  ACCOUNT_STATUSES,
  UserRoleSchema,
  WorkerTypeSchema,
  AccountStatusSchema,
} from '../domain/user';

export {
  POTE_LIFECYCLE,
  DISTRIBUTION_RULE_KINDS_MVP,
  DISTRIBUTION_RULE_KINDS_PHASE2,
  DISTRIBUTION_RULE_KINDS_ALL,
  PoteLifecycleSchema,
  MVPDistributionRuleKindSchema,
  DistributionRuleKindSchema,
  PoteKindSchema,
} from '../domain/pote';

export {
  TRANSACTION_STATUSES,
  TransactionStatusSchema,
} from '../domain/transaction';

export {
  LEDGER_EVENT_KINDS,
  LedgerEventKindSchema,
} from '../domain/ledger';
