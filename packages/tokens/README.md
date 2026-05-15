# @solariis-com/pot-tokens

Design tokens for the POT MVP — published as a per-platform export pack so web (CSS / Tailwind) and native (React Native `StyleSheet`) surfaces share a single source of truth.

## Source of truth

- **`pot-poc/lib/tokens.ts`** — canonical TypeScript export, mirrored exactly.
- **`pot-poc/docs/PRD.md` v2.6** — §"Design System Canónico" (color tokens, typography, spacing, radii) + §"Logo policy".

If the POC and the PRD diverge, the **PRD note** (`get_note(id="ef609c16-2c2d-4f7a-9f57-280955261916")` per `pot-poc/CLAUDE.md`) is the upstream tie-breaker. `pot-shared/packages/tokens` is downstream of both.

## Per-platform output paths

| Surface | Import | Shape |
|---|---|---|
| CSS variables | `@solariis-com/pot-tokens/css` | `toCssVars(prefix?)` → `:root { --color-accent: ...; }` block; `cssVarsString` pre-rendered; `writeCss(path)` to dump to disk |
| Tailwind theme | `@solariis-com/pot-tokens/tailwind` | `tailwindTheme` — spread into `theme.extend` in `tailwind.config.ts` |
| React Native | `@solariis-com/pot-tokens/native` | `nativeStyleSheet` with hex colors, numeric spacing/radii, RN-shape shadows |
| Raw tokens | `@solariis-com/pot-tokens` | `colors`, `spacing`, `radii`, `shadows`, `typography`, `breakpoints`, `tokens` aggregate |

## 60 / 30 / 8 / 2 proportion canon

Per PRD v2.6 §"Color tokens":

| Token | Hex | Use | Proportion |
|---|---|---|---|
| `--color-primary-black` | `#000000` | Dark surfaces, headers, splash | **60%** |
| `--color-primary-light` | `#F8FDFC` | Light surfaces, cards | **30%** |
| `--color-accent` | `#ADF43C` | CTAs, QR center, badges, branding | **8%** |
| `--color-success` | `#22C55E` | Success states | parte 2% |
| `--color-danger` | `#EF4444` | Destructive actions | parte 2% |
| `--color-warning` | `#F59E0B` | Warnings | parte 2% |
| `--color-info` | `#3B82F6` | Info / secondary links | parte 2% |

## D-10 brand surfaces exception

Per the D-10 design directive (referenced from `pot-poc/docs/PRD.md` line 18 and the POC `DESIGN.md`), **splash / welcome / celebration screens** invert the 60/30/8/2 default:

- Affected screens: `W-01`, `C-01`, `W-02`, `C-02`, `W-10`, `W-26`, `S-08`
- They use `bg-pot-accent` (the 8% accent) as the body surface.
- All other screens follow 60/30/8/2 on top of `bg-pot-light`.

Consumers don't need a separate token — they apply the standard `accent` color to the body via Tailwind's `bg-pot-accent`. This README is the discoverable record of the exception.

## Logo policy

Logo POT (wordmark) is visible only on a narrow set of brand surfaces. Full details live in `pot-poc/docs/PRD.md` §"Logo policy (NEW v2.4)" — this package intentionally does NOT ship logo assets. See the PRD for the canonical list of allowed surfaces.

## Token coverage

| Category | Count |
|---|---|
| Brand + status colors | 7 (3 brand surfaces + 4 status) |
| Neutral scale steps | 7 (`n50`..`n900`) |
| Spacing values | 10 (4 → 64 on a 4-base scale) |
| Radii (canonical) | 4 (pill, card, input, modal) |
| Radii (semantic aliases) | 5 (xs, sm, md, lg, xl) |
| Shadows | 3 (soft, card, elevated) |
| Font sizes | 9 (12 → 56) |
| Font weights | 4 (400, 500, 600, 700) |
| Breakpoints | 4 (sm, md, lg, xl) |

## Usage examples

### CSS

```ts
import { cssVarsString } from '@solariis-com/pot-tokens/css';

// Inline into a `<style>` block, or:
import { writeCss } from '@solariis-com/pot-tokens/css';
writeCss('./public/tokens.css');
```

### Tailwind

```ts
// tailwind.config.ts
import type { Config } from 'tailwindcss';
import { tailwindTheme } from '@solariis-com/pot-tokens/tailwind';

export default {
  content: ['./app/**/*.{ts,tsx}'],
  theme: { extend: tailwindTheme },
} satisfies Config;
```

### React Native

```ts
import { StyleSheet } from 'react-native';
import { nativeStyleSheet } from '@solariis-com/pot-tokens/native';

const styles = StyleSheet.create({
  card: {
    backgroundColor: nativeStyleSheet.colors.primaryLight,
    padding: nativeStyleSheet.spacing.base,
    borderRadius: nativeStyleSheet.radii.card,
    ...nativeStyleSheet.shadows.card,
  },
});
```

## Anti-scope

- No components / utility class generation.
- No runtime framework imports (no React, no Next, no RN runtime).
- Mirrors `pot-poc/lib/tokens.ts` — never re-defines values.

## Versioning

`@solariis-com/pot-tokens` follows the monorepo semver convention (`pot-shared/CLAUDE.md`):
- **patch** — value-preserving tweaks (doc fixes, export reshuffles)
- **minor** — new tokens or new export targets
- **major** — value or shape changes that break downstream consumers

Bump locally, PR + merge to `main`, GHA `publish.yml` ships to GitHub Packages.
