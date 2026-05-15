import type {
  AxiosInstance,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from 'axios';

/**
 * Per-request config flag the auth interceptor checks. Set
 * `config.requiresAuth = false` on requests that intentionally must NOT carry
 * a Bearer token (request-otp, verify-otp).
 *
 * Augmented onto axios's `InternalAxiosRequestConfig` via module declaration
 * below so consumers and modules can pass it without type cast.
 */
declare module 'axios' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  export interface AxiosRequestConfig {
    requiresAuth?: boolean;
    idempotencyKey?: string;
    /** Internal counter used by the retry-interceptor. */
    __retryCount?: number;
  }
}

export interface AuthInterceptorOptions {
  /** Synchronous accessor for the current access token. */
  getAuthToken?: () => string | null;
}

/**
 * Mounts a request interceptor that injects `Authorization: Bearer <token>`
 * unless the request opts out via `requiresAuth: false`.
 */
export function installAuthInterceptor(
  axiosInstance: AxiosInstance,
  opts: AuthInterceptorOptions,
): void {
  axiosInstance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const requiresAuth = (config as AxiosRequestConfig).requiresAuth ?? true;
    if (!requiresAuth) {
      return config;
    }
    const token = opts.getAuthToken?.() ?? null;
    if (token) {
      config.headers = config.headers ?? {};
      // axios 1.x headers is an AxiosHeaders instance with .set(); fall back
      // to assignment for plain-object test mocks.
      if (typeof (config.headers as { set?: unknown }).set === 'function') {
        (config.headers as { set: (k: string, v: string) => void }).set(
          'Authorization',
          `Bearer ${token}`,
        );
      } else {
        (config.headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
      }
    }
    return config;
  });
}
