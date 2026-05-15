import axios, { type AxiosInstance } from 'axios';
import { DEFAULT_TIMEOUT, type POTClientConfig } from './config';
import { installAuthInterceptor } from './interceptors/auth-interceptor';
import { installRetryInterceptor } from './interceptors/retry-interceptor';
import { installErrorInterceptor } from './interceptors/error-interceptor';
import { AdminModule } from './modules/admin';
import { AuthModule } from './modules/auth';
import { PoteModule } from './modules/pote';
import { TransactionModule } from './modules/transaction';

/**
 * Framework-agnostic POT API client.
 *
 * Mounting order matters:
 *   1. Auth interceptor (request)        — stamps Bearer
 *   2. Retry interceptor (request)       — stamps Idempotency-Key
 *   3. Retry interceptor (response)      — retries 5xx + network errors
 *   4. Error interceptor (response)      — maps to POTError subclasses
 *
 * Axios runs request interceptors LIFO and response interceptors FIFO, so we
 * install in the order shown above for the desired observable order.
 */
export class POTClient {
  public readonly auth: AuthModule;
  public readonly pote: PoteModule;
  public readonly transaction: TransactionModule;
  public readonly admin: AdminModule;

  private readonly _http: AxiosInstance;
  private readonly _config: POTClientConfig;

  constructor(config: POTClientConfig) {
    if (!config.baseURL) {
      throw new Error('POTClient: baseURL is required');
    }
    this._config = config;

    const base =
      (config.axiosInstance as AxiosInstance | undefined) ??
      axios.create({
        baseURL: config.baseURL,
        timeout: config.timeout ?? DEFAULT_TIMEOUT,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });
    this._http = base;

    // Mount interceptors. Order matters — see class docstring.
    installAuthInterceptor(this._http, { getAuthToken: config.getAuthToken });
    installRetryInterceptor(this._http, { maxRetries: config.maxRetries });
    installErrorInterceptor(this._http);

    this.auth = new AuthModule(this._http);
    this.pote = new PoteModule(this._http);
    this.transaction = new TransactionModule(this._http);
    this.admin = new AdminModule(this._http);
  }

  /**
   * Escape hatch for advanced consumers (e.g. wiring extra interceptors).
   * Prefer the typed module surface where possible.
   */
  get http(): AxiosInstance {
    return this._http;
  }

  /** Read-only view of the resolved config. */
  get config(): Readonly<POTClientConfig> {
    return this._config;
  }
}
