import type { AxiosError, AxiosInstance, AxiosResponse } from 'axios';
import {
  AuthError,
  NetworkError,
  POTError,
  R4Error,
  ValidationError,
} from '../errors';

/**
 * Shape the backend returns on error responses. Keys are best-effort — the
 * interceptor falls back to generic codes when fields are missing.
 */
interface BackendErrorBody {
  code?: string;
  message?: string;
  /** ValidationError-style field bag. */
  fields?: Record<string, string>;
  /** FR-R4 discriminator — non-empty when the failure originated at R4. */
  r4_error_code?: string;
}

function extractRequestId(error: AxiosError): string | undefined {
  const raw = error.response?.headers?.['x-request-id'];
  return typeof raw === 'string' ? raw : undefined;
}

function asBackendErrorBody(data: unknown): BackendErrorBody {
  if (data && typeof data === 'object') {
    return data as BackendErrorBody;
  }
  return {};
}

/**
 * Maps axios errors to the POTError class graph. Mounted AFTER the
 * retry-interceptor so retried transient failures resolve to NetworkError only
 * once retries are exhausted.
 */
export function installErrorInterceptor(axiosInstance: AxiosInstance): void {
  axiosInstance.interceptors.response.use(
    (resp: AxiosResponse) => resp,
    (error: AxiosError) => {
      const status = error.response?.status;
      const body = asBackendErrorBody(error.response?.data);
      const requestId = extractRequestId(error);
      const message = body.message ?? error.message ?? 'Request failed';

      // Network-level: no response at all (timeout, DNS, offline).
      if (!error.response) {
        return Promise.reject(
          new NetworkError(message, {
            code: body.code ?? 'network_error',
            cause: error,
            requestId,
          }),
        );
      }

      // R4 banking-rail failures surface as 502/503 + r4_error_code.
      if (body.r4_error_code) {
        return Promise.reject(
          new R4Error(message, {
            code: body.r4_error_code,
            statusCode: status,
            cause: error,
            requestId,
          }),
        );
      }

      // Auth — 401/403 + auth-shaped codes.
      if (status === 401 || status === 403) {
        return Promise.reject(
          new AuthError(message, {
            code: body.code ?? (status === 401 ? 'unauthenticated' : 'forbidden'),
            statusCode: status,
            cause: error,
            requestId,
          }),
        );
      }

      // Validation — 400/422 with optional fields bag.
      if (status === 400 || status === 422) {
        return Promise.reject(
          new ValidationError(message, {
            code: body.code ?? 'validation_failed',
            statusCode: status,
            cause: error,
            requestId,
            fields: body.fields,
          }),
        );
      }

      // 5xx (post-retry) — surface as NetworkError so the consumer's offline
      // banner can pick it up.
      if (status != null && status >= 500) {
        return Promise.reject(
          new NetworkError(message, {
            code: body.code ?? 'server_error',
            statusCode: status,
            cause: error,
            requestId,
          }),
        );
      }

      // Anything else — generic POTError.
      return Promise.reject(
        new POTError(message, {
          code: body.code ?? 'unknown_error',
          statusCode: status,
          cause: error,
          requestId,
        }),
      );
    },
  );
}
