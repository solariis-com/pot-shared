# CLAUDE.md — pot-shared

## Source of truth derivation

Este repo deriva sus contents de `solariis-com/pot-poc`:

- **types** ← derivados de PRD v2.6 + user-flows + microcopy.ts + personas.ts
- **microcopy** ← export estructurado de `pot-poc/lib/microcopy.ts`
- **tokens** ← export de `pot-poc/lib/tokens.ts`
- **api-client** ← scaffolding hoy; auto-generated desde OpenAPI spec del backend (post-TKT-2026-0859)
- **security** ← greenfield utilities (JWT/HMAC/encryption/OTP)

## Repo layout

```
pot-shared/
├── packages/
│   ├── types/          (@solariis-com/pot-types)
│   ├── microcopy/      (@solariis-com/pot-microcopy)
│   ├── tokens/         (@solariis-com/pot-tokens)
│   ├── api-client/     (@solariis-com/pot-api-client)
│   └── security/       (@solariis-com/pot-security)
├── .github/workflows/  (publish.yml)
└── scripts/            (build/codegen helpers)
```

## Publishing

Versionado semver:
- `patch`: bug fixes, microcopy tweaks, doc-only changes
- `minor`: new types, new microcopy keys, new tokens, new utilities
- `major`: breaking API changes

Workflow:
1. Detect change en pot-poc (microcopy, tokens, types)
2. Update package correspondiente en pot-shared
3. Bump version en `packages/<pkg>/package.json`
4. PR + merge to main
5. GHA `publish.yml` runs on `paths: packages/**` → publishes to GitHub Packages
6. Consumer repos updaten via dependabot or manual `pnpm up`

## Stack

- pnpm workspaces (monorepo)
- TypeScript 5.4+ strict mode
- tsup for build (esm + cjs + dts)
- Zod for runtime validation
- vitest for tests
- No runtime framework dependencies (pure TS)

## Anti-scope

- NO duplicar lógica de UI (eso vive en pot-mobile/pot-web)
- NO incluir runtime de Next.js o RN (solo TS puros)
- NO incluir tests de business logic (eso vive en pot-backend)
- NO incluir mocks
- NO incluir secrets reales
- NO incluir DB ops (eso es backend)

## Workflow (per project root CLAUDE.md)

- Default for ticketed work: PR + merge.
- Branch naming: `claude/tkt-2026-NNNN-…` or `feat/NNNN-…`
- Report back via Solariis MCP `add_ticket_comment` on dispatching ticket.

## Reference

- POT POC: https://pot-poc.pages.dev (visual source of truth)
- PRD canónico: TKT-2026-0794 `deliverable_content`
- User flows canon: `solariis-com/pot-poc/docs/user-flows/`
- /flows interactive viewer: https://pot-poc.pages.dev/flows
