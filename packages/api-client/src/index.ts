/**
 * `@solariis-com/pot-api-client` — typed API client for the POT MVP backend.
 *
 * Status: scaffolding. The backend (TKT-2026-0859) is not yet implemented;
 * this package defines the SDK shape so consumers (pot-mobile, pot-web) can
 * mock against a stable surface. Once the backend ships, `scripts/generate-
 * from-openapi.ts` will regenerate the module bodies against the real spec.
 */
export { POTClient } from './client';
export type { POTClientConfig } from './config';
export { DEFAULT_TIMEOUT, DEFAULT_MAX_RETRIES } from './config';

export {
  POTError,
  AuthError,
  ValidationError,
  NetworkError,
  R4Error,
} from './errors';

export * from './modules';
export * from './types';
