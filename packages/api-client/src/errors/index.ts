/**
 * POT error hierarchy.
 *
 * The error-interceptor maps every 4xx/5xx + transport-level failure into one
 * of the subclasses below. Consumers should branch on `instanceof` rather than
 * sniffing `error.code` strings — the strings are stable but the class graph
 * carries discriminant information TypeScript can narrow on.
 */
export class POTError extends Error {
  /** Stable machine-readable code (e.g. "auth_invalid_otp", "validation_failed"). */
  public readonly code: string;
  /** HTTP status from the response, if any (network errors have none). */
  public readonly statusCode?: number;
  /** Optional structured cause (axios error, zod error, etc.). */
  public readonly cause?: unknown;
  /** Optional request id for log correlation (X-Request-Id header). */
  public readonly requestId?: string;

  constructor(
    message: string,
    opts: {
      code: string;
      statusCode?: number;
      cause?: unknown;
      requestId?: string;
    },
  ) {
    super(message);
    this.name = new.target.name;
    this.code = opts.code;
    this.statusCode = opts.statusCode;
    this.cause = opts.cause;
    this.requestId = opts.requestId;
    // Maintain prototype chain across transpilation targets.
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/** 401/403 + OTP/session-related failures. */
export class AuthError extends POTError {}

/**
 * 422 / 400 validation failures. `fields` mirrors the typical backend shape
 * `{ fieldName: "human reason" }` for easy form-binding on the consumer side.
 */
export class ValidationError extends POTError {
  public readonly fields: Record<string, string>;

  constructor(
    message: string,
    opts: {
      code: string;
      statusCode?: number;
      cause?: unknown;
      requestId?: string;
      fields?: Record<string, string>;
    },
  ) {
    super(message, opts);
    this.fields = opts.fields ?? {};
  }
}

/** Network-level errors (timeout, DNS, offline) or 5xx after retries exhausted. */
export class NetworkError extends POTError {}

/**
 * R4 banking-rail errors (FR-R4). The backend surfaces these as 502/503 with
 * an `r4_error_code` discriminator; the client materializes them as a distinct
 * class so consumers can show the "se notificará en cuanto se resuelva" copy
 * instead of a generic network error toast.
 */
export class R4Error extends POTError {}
