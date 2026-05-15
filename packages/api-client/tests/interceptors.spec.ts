import axios from 'axios';
import { describe, expect, it, vi } from 'vitest';
import { POTClient } from '../src/client';
import { installAuthInterceptor } from '../src/interceptors/auth-interceptor';
import { installRetryInterceptor } from '../src/interceptors/retry-interceptor';
import { installErrorInterceptor } from '../src/interceptors/error-interceptor';
import { AuthError, NetworkError, ValidationError } from '../src/errors';

/**
 * The interceptor tests use a stub axios instance — we don't hit a real
 * network. Each test wires the interceptor under test, drives a single
 * request through `axiosInstance.request()`, and asserts on either the
 * outgoing config or the rejection shape.
 */
function makeStubAxios() {
  const instance = axios.create();
  // Replace the adapter so requests never leave the process.
  instance.defaults.adapter = vi.fn() as unknown as typeof instance.defaults.adapter;
  return instance;
}

describe('auth-interceptor', () => {
  it('injects Authorization: Bearer <token> when getAuthToken returns a token', async () => {
    const http = makeStubAxios();
    installAuthInterceptor(http, { getAuthToken: () => 'token-xyz' });
    let captured: Record<string, string> | undefined;
    (http.defaults.adapter as ReturnType<typeof vi.fn>).mockImplementation(
      async (config: {
        headers?: { Authorization?: string; toJSON?: () => Record<string, string> } & Record<
          string,
          unknown
        >;
      }) => {
        captured =
          config.headers && typeof config.headers.toJSON === 'function'
            ? (config.headers.toJSON() as Record<string, string>)
            : (config.headers as unknown as Record<string, string>);
        return { data: { ok: true }, status: 200, statusText: 'OK', headers: {}, config };
      },
    );
    await http.get('/me');
    expect(captured?.Authorization).toBe('Bearer token-xyz');
  });

  it('skips Authorization header when requiresAuth=false', async () => {
    const http = makeStubAxios();
    installAuthInterceptor(http, { getAuthToken: () => 'token-xyz' });
    let captured: Record<string, string> | undefined;
    (http.defaults.adapter as ReturnType<typeof vi.fn>).mockImplementation(
      async (config: {
        headers?: { toJSON?: () => Record<string, string> } & Record<string, unknown>;
      }) => {
        captured =
          config.headers && typeof config.headers.toJSON === 'function'
            ? (config.headers.toJSON() as Record<string, string>)
            : (config.headers as unknown as Record<string, string>);
        return { data: {}, status: 200, statusText: 'OK', headers: {}, config };
      },
    );
    await http.post('/auth/otp/request', {}, { requiresAuth: false });
    expect(captured?.Authorization).toBeUndefined();
  });

  it('skips Authorization header when token accessor returns null', async () => {
    const http = makeStubAxios();
    installAuthInterceptor(http, { getAuthToken: () => null });
    let captured: Record<string, string> | undefined;
    (http.defaults.adapter as ReturnType<typeof vi.fn>).mockImplementation(
      async (config: {
        headers?: { toJSON?: () => Record<string, string> } & Record<string, unknown>;
      }) => {
        captured =
          config.headers && typeof config.headers.toJSON === 'function'
            ? (config.headers.toJSON() as Record<string, string>)
            : (config.headers as unknown as Record<string, string>);
        return { data: {}, status: 200, statusText: 'OK', headers: {}, config };
      },
    );
    await http.get('/me');
    expect(captured?.Authorization).toBeUndefined();
  });
});

describe('retry-interceptor (idempotency-key stamping)', () => {
  it('stamps Idempotency-Key on POST', async () => {
    const http = makeStubAxios();
    installRetryInterceptor(http);
    let captured: Record<string, string> | undefined;
    (http.defaults.adapter as ReturnType<typeof vi.fn>).mockImplementation(
      async (config: {
        headers?: { toJSON?: () => Record<string, string> } & Record<string, unknown>;
      }) => {
        captured =
          config.headers && typeof config.headers.toJSON === 'function'
            ? (config.headers.toJSON() as Record<string, string>)
            : (config.headers as unknown as Record<string, string>);
        return { data: {}, status: 200, statusText: 'OK', headers: {}, config };
      },
    );
    await http.post('/transactions/tips', { amountCents: 1000 });
    expect(captured?.['Idempotency-Key']).toBeDefined();
    expect((captured?.['Idempotency-Key'] ?? '').length).toBeGreaterThan(8);
  });

  it('does NOT stamp Idempotency-Key on GET', async () => {
    const http = makeStubAxios();
    installRetryInterceptor(http);
    let captured: Record<string, string> | undefined;
    (http.defaults.adapter as ReturnType<typeof vi.fn>).mockImplementation(
      async (config: {
        headers?: { toJSON?: () => Record<string, string> } & Record<string, unknown>;
      }) => {
        captured =
          config.headers && typeof config.headers.toJSON === 'function'
            ? (config.headers.toJSON() as Record<string, string>)
            : (config.headers as unknown as Record<string, string>);
        return { data: {}, status: 200, statusText: 'OK', headers: {}, config };
      },
    );
    await http.get('/potes');
    expect(captured?.['Idempotency-Key']).toBeUndefined();
  });

  it('honors caller-provided Idempotency-Key on POST', async () => {
    const http = makeStubAxios();
    installRetryInterceptor(http);
    let captured: Record<string, string> | undefined;
    (http.defaults.adapter as ReturnType<typeof vi.fn>).mockImplementation(
      async (config: {
        headers?: { toJSON?: () => Record<string, string> } & Record<string, unknown>;
      }) => {
        captured =
          config.headers && typeof config.headers.toJSON === 'function'
            ? (config.headers.toJSON() as Record<string, string>)
            : (config.headers as unknown as Record<string, string>);
        return { data: {}, status: 200, statusText: 'OK', headers: {}, config };
      },
    );
    await http.post(
      '/transactions/tips',
      {},
      { idempotencyKey: 'caller-supplied-key' },
    );
    expect(captured?.['Idempotency-Key']).toBe('caller-supplied-key');
  });
});

describe('error-interceptor (status → POTError mapping)', () => {
  it('maps 401 → AuthError', async () => {
    const http = makeStubAxios();
    installErrorInterceptor(http);
    (http.defaults.adapter as ReturnType<typeof vi.fn>).mockImplementation(
      async (config: unknown) => {
        return Promise.reject({
          isAxiosError: true,
          response: {
            status: 401,
            data: { code: 'unauthenticated', message: 'no session' },
            headers: { 'x-request-id': 'req-1' },
          },
          config,
          message: 'Request failed with 401',
        });
      },
    );
    await expect(http.get('/me')).rejects.toBeInstanceOf(AuthError);
  });

  it('maps 422 → ValidationError with fields bag', async () => {
    const http = makeStubAxios();
    installErrorInterceptor(http);
    (http.defaults.adapter as ReturnType<typeof vi.fn>).mockImplementation(
      async (config: unknown) => {
        return Promise.reject({
          isAxiosError: true,
          response: {
            status: 422,
            data: {
              code: 'validation_failed',
              message: 'invalid input',
              fields: { phone: 'must be E.164' },
            },
            headers: {},
          },
          config,
          message: 'Request failed with 422',
        });
      },
    );
    try {
      await http.post('/auth/otp/request', {});
      throw new Error('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(ValidationError);
      expect((err as ValidationError).fields).toEqual({ phone: 'must be E.164' });
    }
  });

  it('maps a transport-level failure (no response) → NetworkError', async () => {
    const http = makeStubAxios();
    installErrorInterceptor(http);
    (http.defaults.adapter as ReturnType<typeof vi.fn>).mockImplementation(
      async (config: unknown) => {
        return Promise.reject({
          isAxiosError: true,
          response: undefined,
          config,
          message: 'Network Error',
        });
      },
    );
    await expect(http.get('/me')).rejects.toBeInstanceOf(NetworkError);
  });
});

describe('POTClient end-to-end interceptor wiring', () => {
  it('the constructed client has Bearer + Idempotency-Key on a POST', async () => {
    const client = new POTClient({
      baseURL: 'https://api.test.po-t.app',
      getAuthToken: () => 'wired-token',
    });
    let captured: Record<string, string> | undefined;
    client.http.defaults.adapter = (async (config: {
      headers?: { toJSON?: () => Record<string, string> } & Record<string, unknown>;
    }) => {
      captured =
        config.headers && typeof config.headers.toJSON === 'function'
          ? (config.headers.toJSON() as Record<string, string>)
          : (config.headers as unknown as Record<string, string>);
      return { data: {}, status: 200, statusText: 'OK', headers: {}, config };
    }) as unknown as typeof client.http.defaults.adapter;
    await client.http.post('/potes', { commerceId: 'x' });
    expect(captured?.Authorization).toBe('Bearer wired-token');
    expect(captured?.['Idempotency-Key']).toBeDefined();
  });

  it('module methods return promises', () => {
    const client = new POTClient({ baseURL: 'https://api.test.po-t.app' });
    // Stub out the adapter so calls don't reach the network.
    client.http.defaults.adapter = (async () => {
      return {
        data: { items: [], total: 0, page: 1, pageSize: 20 },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {},
      };
    }) as unknown as typeof client.http.defaults.adapter;
    const promise = client.pote.list();
    expect(promise).toBeInstanceOf(Promise);
    return promise;
  });
});
