# @solariis-com/pot-microcopy

ES-VE / EN microcopy catalog for the POT MVP (workers, commerce, consumers, admin, shared).

## Source-of-truth hierarchy

```
pot-poc/lib/microcopy.ts   ← CANON (PRD v2.3, NFR-MICROCOPY-01)
   └─ structurally mirrored into:
      packages/microcopy/src/catalog/es.ts   ← ES (source of truth in this package)
      packages/microcopy/src/catalog/en.ts   ← EN (sync mirror — same key shape)
```

The POC's `lib/microcopy.ts` is the canon. This package's `es.ts` mirrors it
exactly (same keys, same strings, same interpolation patterns). `en.ts`
preserves the key shape and provides professional, conservative English
translations.

If the POC and this package drift, **the POC wins** — update this package to
match, not the other way around.

## Install

This package publishes to the GitHub Packages registry (private). Configure
your `.npmrc` to authenticate to `npm.pkg.github.com` for the `@solariis` scope,
then:

```bash
pnpm add @solariis-com/pot-microcopy
```

## Usage

### Named locale imports

```ts
import { es, en } from '@solariis-com/pot-microcopy';

es.worker.home.greeting({ firstName: 'Lucía' });
// → 'Hola, Lucía'

en.worker.home.greeting({ firstName: 'Lucía' });
// → 'Hi, Lucía'

es.shared.splash.brandTag;
// → 'Pagos Oportunos y Transparentes'
```

### Locale-driven resolver

```ts
import { getCatalog, type Locale } from '@solariis-com/pot-microcopy';

function greet(locale: Locale, firstName: string) {
  const t = getCatalog(locale);
  return t.worker.home.greeting({ firstName });
}

greet('es', 'Yuri'); // 'Hola, Yuri'
greet('en', 'Yuri'); // 'Hi, Yuri'
```

### Inline interpolation helper

```ts
import { interpolate, tpl } from '@solariis-com/pot-microcopy';

// One-shot
interpolate('Bs {amount}', { amount: 250 }); // → 'Bs 250'

// Reusable
const greet = tpl('Hola {name}');
greet({ name: 'Carlos' }); // → 'Hola Carlos'
```

## Bilingual policy

- **ES is canon.** Every key lives in `es.ts` first. The catalog matches the
  POC's `lib/microcopy.ts` one-for-one.
- **EN must mirror.** Same key shape, same interpolation signature. The
  parity test (`tests/catalog-completeness.spec.ts`) fails the build if a
  key exists in one but not the other.
- **Translation rules:**
  - Venezuelan-specific regulatory / financial terms (`cédula`, `RIF`, `Bs`,
    `Pago Móvil`, `Débito Inmediato`, `R4`) stay in Spanish. They are
    technical references and translating them would lose regulatory meaning.
  - Pure technical tokens (`QR`, `OTP`, `PDF`, `PNG`, `WhatsApp`, `KYC`,
    `GMV`, `SLA`, `USD`, `SLO`, `CSV`) are unchanged.
  - The brand tagline "Pagos Oportunos y Transparentes" → "Timely &
    Transparent Tips" (keeps the POT acronym backronym).
  - Tone: warm, informal, no formal register. Match ES tuteo with EN's
    casual "you".

## How to add a key

Per `pot-poc/CLAUDE.md` and PRD v2.3 NFR-MICROCOPY-01 — PRD-first:

1. Update `deliverable_content` of PRD ticket (TKT-2026-0794) first.
2. Bump the PRD version (`v2.4` minor add, `v3.0` if breaking).
3. Add the key in `pot-poc/lib/microcopy.ts` (the canon).
4. Mirror the new key into `packages/microcopy/src/catalog/es.ts`.
5. Add the English translation into `packages/microcopy/src/catalog/en.ts`.
6. Run `pnpm test` — the parity assertion will fail if you forgot one side.

Never add microcopy without a corresponding PRD update. This invariant keeps
the canon and the implementation in lock-step.

## Scripts

```bash
pnpm build     # tsup → dist/ (esm + cjs + dts)
pnpm test      # vitest run (catalog parity + interpolation)
pnpm lint      # tsc --noEmit
```

## Structure

```
packages/microcopy/
├── package.json
├── tsconfig.json
├── tsup.config.ts
├── README.md
├── src/
│   ├── index.ts             # barrel: es, en, getCatalog, LOCALES, types, utils
│   ├── types.ts             # Locale, MicrocopyCatalog, MicrocopyKey
│   ├── catalog/
│   │   ├── es.ts            # canon (mirrors pot-poc/lib/microcopy.ts)
│   │   └── en.ts            # sync mirror, EN translations
│   └── utils/
│       └── interpolate.ts   # tpl(template) + interpolate(template, vars)
└── tests/
    └── catalog-completeness.spec.ts
```
