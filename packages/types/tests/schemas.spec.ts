import { describe, it, expect } from 'vitest';
import {
  IdentityDocumentSchema,
  WorkerSchema,
  PoteSchema,
  DistributionRuleSchema,
  TransactionSchema,
  CreateTipDtoSchema,
  R4WebhookPayloadSchema,
  JwtClaimsSchema,
  AcceptPoteDtoSchema,
} from '../src/index';

const NOW = '2026-05-14T12:00:00.000Z';

describe('IdentityDocumentSchema', () => {
  it('accepts a natural V-prefixed cédula', () => {
    const parsed = IdentityDocumentSchema.parse({
      entityType: 'natural',
      prefix: 'V',
      number: '22345678',
    });
    expect(parsed.entityType).toBe('natural');
  });

  it('rejects a natural identity with an invalid J prefix (jurídico-only)', () => {
    const result = IdentityDocumentSchema.safeParse({
      entityType: 'natural',
      prefix: 'J',
      number: '12345678',
    });
    expect(result.success).toBe(false);
  });

  it('rejects an identity with non-numeric or too-short number', () => {
    const result = IdentityDocumentSchema.safeParse({
      entityType: 'natural',
      prefix: 'V',
      number: '123',
    });
    expect(result.success).toBe(false);
  });
});

describe('DistributionRuleSchema', () => {
  it('accepts a valid porcentajes_fijos rule summing to 100', () => {
    const rule = DistributionRuleSchema.parse({
      kind: 'porcentajes_fijos',
      splits: [
        { workerId: '11111111-1111-4111-8111-111111111111', percentage: 60 },
        { workerId: '22222222-2222-4222-8222-222222222222', percentage: 40 },
      ],
    });
    expect(rule.kind).toBe('porcentajes_fijos');
  });

  it('rejects a porcentajes_fijos rule that does not sum to 100', () => {
    const result = DistributionRuleSchema.safeParse({
      kind: 'porcentajes_fijos',
      splits: [
        { workerId: '11111111-1111-4111-8111-111111111111', percentage: 60 },
        { workerId: '22222222-2222-4222-8222-222222222222', percentage: 30 },
      ],
    });
    expect(result.success).toBe(false);
  });

  it('accepts the MVP igualitario rule (no extra fields)', () => {
    expect(() =>
      DistributionRuleSchema.parse({ kind: 'igualitario' }),
    ).not.toThrow();
  });
});

describe('WorkerSchema', () => {
  const validWorker = {
    id: '33333333-3333-4333-8333-333333333333',
    role: 'worker' as const,
    phone: '+584145551801',
    status: 'active' as const,
    createdAt: NOW,
    updatedAt: NOW,
    biometricEnabled: true,
    firstName: 'Lucía',
    lastName: 'Martínez',
    identity: {
      entityType: 'natural' as const,
      prefix: 'V' as const,
      number: '22345678',
    },
    workerType: 'mesonera' as const,
    bankAccount: {
      bankCode: '0134',
      holderName: 'Lucía Martínez',
      holderIdentity: {
        entityType: 'natural' as const,
        prefix: 'V' as const,
        number: '22345678',
      },
      accountNumber: '01340000000000000000',
    },
    potHandle: 'lucia-m',
  };

  it('parses a full valid worker', () => {
    const parsed = WorkerSchema.parse(validWorker);
    expect(parsed.firstName).toBe('Lucía');
  });

  it('rejects a worker with a non-VE phone number', () => {
    const result = WorkerSchema.safeParse({ ...validWorker, phone: '+15551234567' });
    expect(result.success).toBe(false);
  });

  it('rejects a worker with a non-20-digit account number', () => {
    const result = WorkerSchema.safeParse({
      ...validWorker,
      bankAccount: { ...validWorker.bankAccount, accountNumber: '12345' },
    });
    expect(result.success).toBe(false);
  });
});

describe('PoteSchema', () => {
  it('accepts a valid pending_acceptance shared pote', () => {
    const parsed = PoteSchema.parse({
      id: '44444444-4444-4444-8444-444444444444',
      commerceId: '55555555-5555-4555-8555-555555555555',
      name: 'Pote de mesoneros',
      kind: 'shared',
      rule: { kind: 'igualitario' },
      integrantes: [
        {
          workerId: '11111111-1111-4111-8111-111111111111',
          acceptanceStatus: 'pending',
        },
      ],
      lifecycle: 'pending_acceptance',
      createdAt: NOW,
      updatedAt: NOW,
      handle: 'la-brisa-mesoneros',
    });
    expect(parsed.lifecycle).toBe('pending_acceptance');
  });

  it('rejects a pote with an unknown lifecycle state', () => {
    const result = PoteSchema.safeParse({
      id: '44444444-4444-4444-8444-444444444444',
      commerceId: '55555555-5555-4555-8555-555555555555',
      name: 'Pote inválido',
      kind: 'shared',
      rule: { kind: 'igualitario' },
      integrantes: [
        {
          workerId: '11111111-1111-4111-8111-111111111111',
          acceptanceStatus: 'pending',
        },
      ],
      lifecycle: 'open', // not a canonical lifecycle value
      createdAt: NOW,
      updatedAt: NOW,
      handle: 'la-brisa-mesoneros',
    });
    expect(result.success).toBe(false);
  });
});

describe('TransactionSchema', () => {
  it('accepts a valid pending transaction with computed splits', () => {
    const parsed = TransactionSchema.parse({
      id: '66666666-6666-4666-8666-666666666666',
      idempotencyKey: 'idem-key-abcdef0123456789',
      poteId: '44444444-4444-4444-8444-444444444444',
      commerceId: '55555555-5555-4555-8555-555555555555',
      tipAmount: { cents: 50000, currency: 'VES' },
      feeAmount: { cents: 4000, currency: 'VES' },
      totalAmount: { cents: 54000, currency: 'VES' },
      splits: [
        {
          beneficiaryId: '11111111-1111-4111-8111-111111111111',
          bankCode: '0134',
          accountNumber: '01340000000000000000',
          amount: { cents: 50000, currency: 'VES' },
          isFee: false,
        },
        {
          beneficiaryId: 'POT_FEE_ACCOUNT',
          bankCode: '0102',
          accountNumber: '01020000000000000000',
          amount: { cents: 4000, currency: 'VES' },
          isFee: true,
        },
      ],
      status: 'pending',
      createdAt: NOW,
      updatedAt: NOW,
    });
    expect(parsed.splits[1].isFee).toBe(true);
  });
});

describe('CreateTipDtoSchema', () => {
  it('rejects a tip with a too-long consumer message (> 140 chars)', () => {
    const result = CreateTipDtoSchema.safeParse({
      idempotencyKey: 'idem-key-abcdef0123456789',
      poteId: '44444444-4444-4444-8444-444444444444',
      tipAmount: { cents: 50000, currency: 'VES' },
      consumerMessage: 'x'.repeat(141),
      emisorBankCode: '0134',
    });
    expect(result.success).toBe(false);
  });

  it('accepts a minimal tip with no optional fields', () => {
    const parsed = CreateTipDtoSchema.parse({
      idempotencyKey: 'idem-key-abcdef0123456789',
      poteId: '44444444-4444-4444-8444-444444444444',
      tipAmount: { cents: 50000, currency: 'VES' },
      emisorBankCode: '0134',
    });
    expect(parsed.poteId).toBeDefined();
  });
});

describe('R4WebhookPayloadSchema', () => {
  it('accepts a valid signed webhook payload', () => {
    const parsed = R4WebhookPayloadSchema.parse({
      idempotency_key: 'idem-key-abcdef0123456789',
      r4_transaction_id: 'r4-tx-abc123',
      status: 'dispersed',
      splits: [{ beneficiary_id: 'worker-1', delivered: true }],
      recorded_at: NOW,
      signature_hmac: 'a'.repeat(64),
    });
    expect(parsed.status).toBe('dispersed');
  });

  it('rejects a webhook with a malformed HMAC signature', () => {
    const result = R4WebhookPayloadSchema.safeParse({
      idempotency_key: 'idem-key-abcdef0123456789',
      r4_transaction_id: 'r4-tx-abc123',
      status: 'dispersed',
      splits: [{ beneficiary_id: 'worker-1', delivered: true }],
      recorded_at: NOW,
      signature_hmac: 'not-a-valid-hmac',
    });
    expect(result.success).toBe(false);
  });
});

describe('JwtClaimsSchema', () => {
  it('accepts a well-formed JWT claim payload', () => {
    const parsed = JwtClaimsSchema.parse({
      sub: 'user-uuid-here',
      role: 'worker',
      iat: 1715688000,
      exp: 1715691600,
      jti: '77777777-7777-4777-8777-777777777777',
    });
    expect(parsed.role).toBe('worker');
  });
});

describe('AcceptPoteDtoSchema', () => {
  it('accepts a reject decision with a reason', () => {
    const parsed = AcceptPoteDtoSchema.parse({
      poteId: '44444444-4444-4444-8444-444444444444',
      workerId: '11111111-1111-4111-8111-111111111111',
      decision: 'reject',
      rejectionReason: 'El % no me cuadra',
    });
    expect(parsed.decision).toBe('reject');
  });

  it('rejects an unknown decision value', () => {
    const result = AcceptPoteDtoSchema.safeParse({
      poteId: '44444444-4444-4444-8444-444444444444',
      workerId: '11111111-1111-4111-8111-111111111111',
      decision: 'maybe',
    });
    expect(result.success).toBe(false);
  });
});
