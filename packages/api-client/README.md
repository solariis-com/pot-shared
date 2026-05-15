# @solariis-com/pot-api-client

Typed API client for the POT MVP backend.

> **Status: scaffolding.** The POT backend (TKT-2026-0859) is not yet
> implemented. This package defines the SDK *shape* so that consumers
> (`pot-mobile`, `pot-web`) can build against a stable surface and mock the
> network layer in tests. Once the backend ships, the module bodies will be
> regenerated against the published OpenAPI spec via
> `scripts/generate-from-openapi.ts`.

## Install

```bash
pnpm add @solariis-com/pot-api-client
# Peer dep — supplied by the consumer (so domain types stay deduplicated):
pnpm add @solariis-com/pot-types
```

## Usage

```ts
import { POTClient, AuthError, ValidationError } from '@solariis-com/pot-api-client';

const client = new POTClient({
  baseURL: 'https://api.po-t.app',
  getAuthToken: () => sessionStore.accessToken ?? null,
  onTokenExpired: async () => {
    const session = await refreshSession();
    return session.accessToken;
  },
});

try {
  const { sent } = await client.auth.requestOtp({ phone: '+584141234567' });
} catch (err) {
  if (err instanceof ValidationError) {
    showFieldErrors(err.fields);
  } else if (err instanceof AuthError) {
    redirectToLogin();
  } else {
    showGenericErrorToast();
  }
}

// Modules are typed top-to-bottom:
const potes = await client.pote.list({ page: 1, pageSize: 20 });
const tip = await client.transaction.createTip({
  poteId: '…',
  amountCents: 1000,
  currency: 'VES',
});
```

## Module reference

| Module                  | Methods                                                                                |
| ----------------------- | -------------------------------------------------------------------------------------- |
| `client.auth`           | `requestOtp`, `verifyOtp`, `refresh`, `logout`                                         |
| `client.pote`           | `list`, `get`, `create`, `update`, `archive`, `join`, `accept`, `reject`               |
| `client.transaction`    | `createTip`, `getTipStatus`, `listTransactions`                                        |
| `client.admin`          | `listUsers`, `verifyKyc`, `rejectKyc`, `regeneratePotUrl`                              |
| *(server-side only)*    | `R4WebhookHandler` interface — implemented by the POT backend, not callable from SDK   |

### Auth coverage

- `requestOtp` / `verifyOtp` / `refresh` / `logout` are **anonymous** (no
  Bearer header). They internally pass `requiresAuth: false` to the
  auth-interceptor.
- All other methods require a Bearer token. The `getAuthToken` callback in
  `POTClientConfig` is read on every request — consumers can implement any
  storage scheme (RN SecureStore, web in-memory + httpOnly cookie shim, etc.).

## Interceptor stack

The client mounts three interceptors in this order:

1. **Auth interceptor** — injects `Authorization: Bearer <token>` when
   `requiresAuth !== false`.
2. **Retry interceptor** — stamps an `Idempotency-Key` header on every
   write request (POST / PUT / PATCH / DELETE) and retries 5xx + network
   errors up to `maxRetries` (default `3`) times with exponential backoff +
   jitter. The same idempotency key is reused across retries.
3. **Error interceptor** — maps non-2xx responses to a `POTError` subclass
   (`AuthError`, `ValidationError`, `NetworkError`, `R4Error`).

## Idempotency policy

- All write methods (`POST` / `PUT` / `PATCH` / `DELETE`) are stamped with an
  `Idempotency-Key` header. The retry interceptor reuses the same key
  across retries, so a network-blip retry will never double-charge.
- Callers can override the auto-generated key per request:

  ```ts
  await client.transaction.createTip(
    { poteId, amountCents, currency: 'VES' },
    { idempotencyKey: 'checkout-session-abc123' },
  );
  ```

- Read methods (`GET`) do NOT carry an idempotency key — they are naturally
  safe to retry.

## Error handling

Every method throws a `POTError` subclass on failure. Branch with `instanceof`:

```ts
import {
  POTError,
  AuthError,
  ValidationError,
  NetworkError,
  R4Error,
} from '@solariis-com/pot-api-client';

try {
  await client.pote.create(input);
} catch (err) {
  if (err instanceof ValidationError) {
    // err.fields = { fieldName: 'human reason' }
  } else if (err instanceof AuthError) {
    // 401/403 — re-auth or surface forbidden state
  } else if (err instanceof R4Error) {
    // FR-R4 — banking rail failure; show "se notificará en cuanto se resuelva"
  } else if (err instanceof NetworkError) {
    // Network blip or 5xx after retries exhausted
  } else if (err instanceof POTError) {
    // Anything else
  }
}
```

All `POTError` instances carry `.code` (stable machine-readable),
`.statusCode?` (HTTP status when applicable), `.requestId?` (from
`X-Request-Id`), and `.cause` (the underlying axios/zod error).

## Configuration

| Field            | Type                              | Default       | Notes                                                |
| ---------------- | --------------------------------- | ------------- | ---------------------------------------------------- |
| `baseURL`        | `string`                          | (required)    | e.g. `https://api.po-t.app`, no trailing slash       |
| `timeout`        | `number`                          | `30_000`      | Per-request timeout (ms)                             |
| `getAuthToken`   | `() => string \| null`            | none          | Synchronous accessor — must not be async             |
| `onTokenExpired` | `() => Promise<string \| null>`   | none          | Called on 401 + `code: 'token_expired'` (planned)    |
| `debug`          | `boolean`                         | `false`       | Verbose console.debug logging                        |
| `maxRetries`     | `number`                          | `3`           | Retry budget for the retry-interceptor               |
| `axiosInstance`  | `AxiosInstance`                   | (auto)        | Override for testing or pre-tuned consumers          |

## Post-backend regeneration plan

`scripts/generate-from-openapi.ts` is a placeholder. Once
`TKT-2026-0859` ships the backend with an OpenAPI spec at
`/docs/openapi.json`:

1. Wire the codegen tool — candidates: `openapi-typescript-codegen`,
   `openapi-fetch`, or a custom generator that emits TypeScript modules
   matching the current class layout.
2. Replace each module body with the generated equivalent, preserving
   public method names where possible to avoid breaking consumers.
3. Keep the `POTError` graph, the interceptors, and `POTClientConfig` —
   these are the SDK-flavored layer that codegen should NOT touch.
4. Land the regeneration as a `minor` bump in `package.json` (new types are
   non-breaking; only if a method signature changes does it become `major`).

## Anti-scope (what this package will NOT do)

- No real backend connection (the backend doesn't exist yet).
- No state management (`zustand`, `redux`, etc.). The SDK is stateless beyond
  axios connection pooling.
- No React hooks. The SDK is framework-agnostic — `pot-mobile` (RN) and
  `pot-web` (Next.js) each layer their own hooks on top.
- No duplication of domain types — those live in `@solariis-com/pot-types`.

## Scripts

```bash
pnpm build        # tsup → dist/{cjs,esm,dts}
pnpm test         # vitest run
pnpm codegen      # post-backend: regenerate from OpenAPI (currently a no-op)
```
