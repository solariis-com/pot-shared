/**
 * Public config surface for `POTClient`.
 *
 * The client is framework-agnostic: token storage, refresh strategy, and debug
 * logging are all injected by the consumer. pot-mobile (RN) wires SecureStore;
 * pot-web wires httpOnly cookies via a fetch shim adapter.
 */
export interface POTClientConfig {
  /** Base URL for the backend (e.g. https://api.po-t.app). No trailing slash. */
  baseURL: string;

  /** Per-request timeout in ms. Defaults to {@link DEFAULT_TIMEOUT}. */
  timeout?: number;

  /**
   * Synchronous accessor for the current JWT. Returning `null` means
   * "no token; skip Authorization header for requests that allow it".
   *
   * Must be synchronous because the auth-interceptor runs inside axios's
   * request pipeline. If your token store is async, hydrate it once at
   * boot and expose a synchronous read.
   */
  getAuthToken?: () => string | null;

  /**
   * Called when the server responds 401 + `code: 'token_expired'`. Implementer
   * should call the refresh endpoint and return the new access token; the
   * client retries the original request once with the new token. Returning
   * `null` (or rejecting) lets the original 401 surface to the caller.
   */
  onTokenExpired?: () => Promise<string | null>;

  /** Verbose request/response logging via `console.debug`. Default false. */
  debug?: boolean;

  /**
   * Optional axios instance override — for testing or for consumers that
   * already configured connection pooling / proxy / TLS. The client mounts
   * its interceptors on top of whatever is passed in.
   */
  axiosInstance?: unknown;

  /**
   * Optional max retry count for the retry-interceptor on idempotent +
   * idempotency-keyed requests. Defaults to {@link DEFAULT_MAX_RETRIES}.
   */
  maxRetries?: number;
}

/** 30s default — chosen to comfortably outlast a cold serverless backend. */
export const DEFAULT_TIMEOUT = 30_000;

/** 3 retries: initial + 3 = 4 attempts total before NetworkError. */
export const DEFAULT_MAX_RETRIES = 3;
