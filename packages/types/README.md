# `@solariis/pot-types`

Domain types + Zod schemas for the POT MVP (Phase 1).

Every type is paired with a Zod schema so the same shape can be used at the
type level (TypeScript) and at the validation boundary (HTTP DTOs, webhooks,
JWT claims, persisted records). Use the `Schema` when you need runtime
validation; use the `Type` for plain type-level annotations.

## Install

```bash
pnpm add @solariis/pot-types zod
```

`zod` is a peer-friendly dep — the package depends on `zod@^3.23` but the
consumer should also have it in its own tree.

## Usage

```ts
import {
  WorkerSchema,
  type Worker,
  PoteLifecycleSchema,
  type PoteLifecycle,
  CreateTipDtoSchema,
} from '@solariis/pot-types';

// Validate an inbound DTO before handing it to the service layer.
const tipResult = CreateTipDtoSchema.safeParse(req.body);
if (!tipResult.success) {
  return reply.code(400).send({ errors: tipResult.error.flatten() });
}
const tip = tipResult.data;

// Use the inferred type elsewhere.
function dispatchTip(dto: typeof tip) {
  // ...
}
```

## Modules

| Module | Contains |
|---|---|
| `domain/identity` | VE prefixes (V/E/P natural · J/V/E/G/C jurídico — PRD D-11), `IdentityDocument` discriminated union, `formatIdentity` helper |
| `domain/user` | `Worker`, `Commerce`, `Consumer`, `Admin` + role enum, account lifecycle, bank account snapshot |
| `domain/pote` | `Pote`, lifecycle (PRD D-1), `DistributionRule` (3 MVP + 2 Phase 2 deferred), integrantes acceptance |
| `domain/transaction` | `Transaction`, lifecycle `pending → paid → dispersed → notified → failed` (FR-LD), money cents, dispersion splits |
| `domain/ledger` | Append-only `LedgerEntry` with hash chain (FR-LD) |
| `api/auth-dto` | OTP request/verify, refresh token, JWT claims (FR-AUTH) |
| `api/pote-dto` | Create / Update / Join / Accept / Archive (FR-PE + W-29) |
| `api/transaction-dto` | Create tip + get tip status |
| `api/admin-dto` | KYC verify/reject, regenerate PoT URL (FR-AD) |
| `webhooks/r4-webhook` | Signed dispersion callback shape from R4 PLINK (FR-R4) |
| `enums` | Convenience re-exports of every const-tuple + Zod enum |

## Source of truth

These types are derived from — and must stay in sync with — the canonical
POT PRD:

- **PRD canónico:** `solariis-com/pot-poc/docs/PRD.md` v2.6
- **User flows canon:** `solariis-com/pot-poc/docs/user-flows/README.md`
- **Personas canon (v2.3):** `solariis-com/pot-poc/lib/personas.ts`
- **Solariis MCP note:** `ef609c16-2c2d-4f7a-9f57-280955261916`

When the PRD changes (notably: a new D-* decision or a new FR-*), bump this
package via the workflow in `pot-shared/CLAUDE.md`:

1. Update the affected `src/**/*.ts` module(s).
2. Update tests to match.
3. Bump `package.json` `version` (semver per the publish doctrine).
4. Open a PR; merging triggers `.github/workflows/publish.yml`.

## Anti-scope

- No business logic. The schemas validate shape — they do **not** compute
  dispersion math, KYC eligibility, or PoT URL HMACs. Those live in
  `pot-backend` and (for HMAC) `@solariis/pot-security`.
- No mock data / fixtures.
- No runtime framework dependencies (no React, Next, NestJS, RN).
- No DB ORM / migration code.

## Scripts

```bash
pnpm build   # tsup → esm + cjs + d.ts
pnpm test    # vitest run
pnpm lint    # placeholder echo (no linter wired yet)
```
