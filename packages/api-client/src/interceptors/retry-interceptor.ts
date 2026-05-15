import type {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';
import { DEFAULT_MAX_RETRIES } from '../config';

export interface RetryInterceptorOptions {
  /** Max retry attempts after the initial request. Default 3. */
  maxRetries?: number;
}

/**
 * Cheap RFC4122-ish v4 uuid using `crypto.randomUUID` when available, with a
 * Math.random fallback for older RN runtimes that haven't enabled
 * `expo-crypto`. The fallback is fine for idempotency keys because they only
 * need to be probabilistically unique within a retry window.
 */
function generateIdempotencyKey(): string {
  const c: { randomUUID?: () => string } | undefined =
    typeof globalThis !== 'undefined'
      ? (globalThis as { crypto?: { randomUUID?: () => string } }).crypto
      : undefined;
  if (c && typeof c.randomUUID === 'function') {
    return c.randomUUID();
  }
  return 'idem-' + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function isRetriableStatus(status: number | undefined): boolean {
  if (status == null) return true; // network error
  return status >= 500 && status < 600;
}

function isWriteMethod(method: string | undefined): boolean {
  const m = (method ?? 'get').toLowerCase();
  return m === 'post' || m === 'put' || m === 'patch' || m === 'delete';
}

/**
 * Mounts a request interceptor that:
 *
 *   1. Stamps an Idempotency-Key header on any write request that doesn't
 *      already carry one. The same key is reused across retries so the server
 *      can dedupe on its side.
 *   2. Mounts a response interceptor that retries up to `maxRetries` times on
 *      5xx + network errors, with exponential backoff (250ms · 2^n + jitter).
 *
 * 4xx errors are NOT retried — they're caller bugs.
 */
export function installRetryInterceptor(
  axiosInstance: AxiosInstance,
  opts: RetryInterceptorOptions = {},
): void {
  const maxRetries = opts.maxRetries ?? DEFAULT_MAX_RETRIES;

  axiosInstance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    if (isWriteMethod(config.method)) {
      const explicit = (config as AxiosRequestConfig).idempotencyKey;
      const key = explicit ?? generateIdempotencyKey();
      (config as AxiosRequestConfig).idempotencyKey = key;
      config.headers = config.headers ?? {};
      if (typeof (config.headers as { set?: unknown }).set === 'function') {
        (config.headers as { set: (k: string, v: string) => void }).set(
          'Idempotency-Key',
          key,
        );
      } else {
        (config.headers as Record<string, string>)['Idempotency-Key'] = key;
      }
    }
    return config;
  });

  axiosInstance.interceptors.response.use(
    (resp: AxiosResponse) => resp,
    async (error: AxiosError) => {
      const config = error.config as
        | (InternalAxiosRequestConfig & { __retryCount?: number })
        | undefined;
      if (!config) {
        return Promise.reject(error);
      }
      const status = error.response?.status;
      if (!isRetriableStatus(status)) {
        return Promise.reject(error);
      }
      config.__retryCount = (config.__retryCount ?? 0) + 1;
      if (config.__retryCount > maxRetries) {
        return Promise.reject(error);
      }
      const base = 250 * Math.pow(2, config.__retryCount - 1);
      const jitter = Math.floor(Math.random() * 100);
      const delay = base + jitter;
      await new Promise((resolve) => setTimeout(resolve, delay));
      return axiosInstance.request(config);
    },
  );
}
