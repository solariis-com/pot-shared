# @solariis-com/pot-security

Security utilities for the POT MVP — JWT, HMAC, AES-256-GCM encryption, OTP,
idempotency keys, and structured audit-log builders.

**Status:** greenfield utilities. v0.1.0. No production callers yet — wire
these into the POT API workers and mobile auth flows before adding feature
work that depends on them.

## Why this package exists

The POT PRD (`pot-poc/docs/PRD.md`) calls out several security primitives that
need a single canonical implementation across services:

- **FR-AUTH** — phone + 6-digit OTP login (5-minute TTL), re-OTP on cédula
  rebinding and on non-critical commerce edits.
- **FR-LD** — append-only ledger; idempotency by `r4_transaction_id`; PII
  encrypted at rest; PoT URLs signed with HMAC.
- **FR-R4** — outgoing/incoming webhooks signed with HMAC-SHA256.
- **NFR security** — TLS 1.3 in transit, AES-256 at rest, OWASP ASVS L2.

Centralising the primitives here means one audit surface and one place to
patch when a crypto library ships a CVE.

## What's inside

| Module | Surface | Backing primitive |
|---|---|---|
| `jwt/` | `signJwt`, `verifyJwt`, `rotateRefreshToken` | `jsonwebtoken` (HS256 default, RS256 supported) |
| `hmac/` | `signHmac`, `verifyHmac` | Node `crypto.createHmac` + `timingSafeEqual` |
| `encryption/` | `encryptPii`, `decryptPii`, `PII_FIELDS`, `isPiiField` | AES-256-GCM via Node `crypto` |
| `otp/` | `generateOtp`, `verifyOtp` | `crypto.randomInt` + `crypto.timingSafeEqual` |
| `idempotency/` | `generateIdempotencyKey`, `validateIdempotencyKey`, `derivedKey` | `crypto.randomUUID` + SHA-256 |
| `audit/` | `buildAuditEvent` (+ `AuditEvent` type) | Plain object factory with required-field guards |

## Usage

### JWT

```ts
import { signJwt, verifyJwt, rotateRefreshToken } from '@solariis-com/pot-security';

const access = signJwt({ sub: userId, role: 'user' }, process.env.JWT_SECRET!, {
  expiresIn: '15m',
});

const result = verifyJwt(access, process.env.JWT_SECRET!);
if (result.valid) {
  // result.payload is JwtPayload
} else {
  // result.reason is 'expired' | 'invalid-signature' | ...
}

// Refresh rotation (caller persists the family → newest-token map).
const { newRefreshToken, payload } = rotateRefreshToken(oldRefresh, process.env.JWT_SECRET!, '7d');
```

### HMAC webhooks (FR-R4)

```ts
import { signHmac, verifyHmac } from '@solariis-com/pot-security';

// Outgoing
const body = JSON.stringify(payload);
const signature = signHmac(body, process.env.WEBHOOK_SECRET!);
await fetch(url, { method: 'POST', headers: { 'X-Signature': signature }, body });

// Incoming
const ok = verifyHmac(rawBody, req.headers['x-signature'], process.env.WEBHOOK_SECRET!);
if (!ok) return reply.code(401).send({ error: 'invalid-signature' });
```

### PII encryption (FR-LD)

```ts
import { encryptPii, decryptPii, PII_FIELDS } from '@solariis-com/pot-security';

// 32-byte master key — keep in KMS / Secret Manager, never in env literals.
const masterKey = Buffer.from(process.env.PII_KEY_BASE64!, 'base64');

const { ciphertext, iv, authTag } = encryptPii(user.cedula, masterKey);
await db.users.update({ id, cedula_ct: ciphertext, cedula_iv: iv, cedula_tag: authTag });

const cedula = decryptPii(ciphertext, iv, authTag, masterKey); // throws on tamper
```

### OTP (FR-AUTH)

```ts
import { generateOtp, verifyOtp } from '@solariis-com/pot-security';

const { code, expiresAt } = generateOtp(); // 6 digits, 5-minute TTL
await sms.send(phone, `Your POT code: ${code}`);
await db.otps.upsert({ phone, code_hash: sha256(code), expiresAt });

// Later, on submit:
const stored = await db.otps.find({ phone });
const res = verifyOtp(input, /* recompute or store plain in a short-TTL store */ stored.code, stored.expiresAt);
if (!res.valid) return { error: res.reason };
```

### Idempotency

```ts
import {
  generateIdempotencyKey,
  validateIdempotencyKey,
  derivedKey,
} from '@solariis-com/pot-security';

const key = req.headers['idempotency-key'] ?? generateIdempotencyKey();
if (!validateIdempotencyKey(key)) return reply.code(400).send({ error: 'bad-key' });

// Fingerprint when the client didn't send a key.
const fp = derivedKey('plink.create', { amount, currency, walletIds });
```

### Audit (FR-LD append-only ledger)

```ts
import { buildAuditEvent } from '@solariis-com/pot-security';

const event = buildAuditEvent({
  actorId: userId,
  action: 'pote.archive',
  entityType: 'pote',
  entityId: pote.id,
  before: { archived: false },
  after: { archived: true },
  ip: req.ip,
  userAgent: req.headers['user-agent'],
});
await ledger.append(event); // append-only sink (D1 + S3, Kinesis, etc.)
```

## Threat model — what these primitives defend against

- **Timing-based signature/secret oracles** — `verifyHmac` and `verifyOtp`
  use `crypto.timingSafeEqual`; length mismatches don't short-circuit.
- **JWT alg=none downgrade** — `verifyJwt` enforces an explicit algorithm
  allow-list (`['HS256']` by default).
- **GCM IV reuse** — `encryptPii` generates a fresh 96-bit random IV per
  call. Reusing an IV with the same key catastrophically breaks AES-GCM.
- **Ciphertext tampering** — AES-256-GCM `authTag` is checked on every
  `decryptPii`; tampered ciphertext throws, never returns garbage plaintext.
- **OTP brute force timing** — `verifyOtp` checks TTL first, then compares
  in constant time. Caller is responsible for per-handle attempt limits
  (we don't store state here).
- **Refresh-token replay** — `rotateRefreshToken` carries a `family` id so
  the caller can detect re-use (stale token from same family → revoke whole
  family). This package provides the primitive; the store is the caller's.
- **Idempotency-key forgery** — `validateIdempotencyKey` enforces UUID v4
  shape; combined with server-side `(operation, key)` storage, replays are a
  no-op.

## What this package does NOT do

- No database access. Secret storage, OTP attempt counters, refresh-token
  families — all consumer responsibility.
- No HTTP layer (no middleware, no header parsing).
- No KMS integration — the 32-byte AES key is passed in by the caller.
- No real secret values shipped in source.

## PRD references

- `FR-AUTH` (PRD §FR-AUTH) — OTP TTL, re-OTP triggers
- `FR-LD` (PRD §FR-LD) — append-only ledger, idempotency, PoT HMAC
- `FR-R4` (PRD §FR-R4) — webhook HMAC envelope
- `NFR security` (PRD line 349) — TLS 1.3, AES-256, OWASP ASVS L2

## Dev

```bash
pnpm --filter @solariis-com/pot-security test
pnpm --filter @solariis-com/pot-security build
pnpm --filter @solariis-com/pot-security lint
```
