# @solariis-com/pot-shared

Shared types, microcopy, tokens, API client, security utils para POT MVP.

## Packages

- `@solariis-com/pot-types` — Domain models, DTOs, API contracts (Zod-validated)
- `@solariis-com/pot-microcopy` — i18n catalog ES/EN
- `@solariis-com/pot-tokens` — Design tokens (CSS / Tailwind / RN exports)
- `@solariis-com/pot-api-client` — Auto-generated SDK (axios + Zod)
- `@solariis-com/pot-security` — JWT, HMAC, encryption, OTP utilities

## Consumed by

- `solariis-com/pot-backend` (NestJS)
- `solariis-com/pot-mobile` (RN + Expo)
- `solariis-com/pot-web` (Next.js — Consumer + Admin)

## Source of truth derivation

- PRD v2.6: `solariis-com/pot-poc/docs/PRD.md` (canonical content lives in TKT-2026-0794 deliverable_content)
- User flows: `solariis-com/pot-poc/docs/user-flows/` (TKT-2026-0853 canon v1.0)
- POC visual: <https://pot-poc.pages.dev>
- Microcopy source: `pot-poc/lib/microcopy.ts`
- Tokens source: `pot-poc/lib/tokens.ts`

## Development

```bash
pnpm install
pnpm build      # build all 5 packages
pnpm test       # run tests across packages
pnpm lint       # lint across packages
```

## Publishing

Versioning semver:
- `patch`: bug fixes, microcopy tweaks
- `minor`: new types, new microcopy keys, new tokens
- `major`: breaking API changes

Publishes to GitHub Packages on push to `main` (paths: `packages/**`).

## Tickets

- TKT-2026-0858 — Foundation 1/2 (this scaffolding)
- TKT-2026-0859 — Foundation 2/2 (pot-backend + pot-mobile + pot-web parallel)
- TKT-2026-0767 — POT MVP Foundation (parent)
