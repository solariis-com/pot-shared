import { createHash, randomUUID } from 'node:crypto';

const UUID_V4_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Generate an idempotency key (UUID v4).
 *
 * Used per FR-LD on R4 webhooks and any mutation that must not be replayed
 * (e.g. `r4_transaction_id` dedupe). The caller persists `(operation, key)`
 * → outcome and short-circuits subsequent matching requests.
 */
export function generateIdempotencyKey(): string {
  return randomUUID();
}

/** Validate an idempotency key. Accepts canonical UUID v4 (case-insensitive). */
export function validateIdempotencyKey(key: string): boolean {
  return typeof key === 'string' && UUID_V4_RE.test(key);
}

/**
 * Derive a deterministic SHA-256 key from `(operation, params)`.
 *
 * Use when the client does not supply an explicit idempotency key but the
 * request body itself is sufficient to deduplicate (e.g. "create transaction
 * with these exact terms"). Sorted JSON ensures key-order doesn't change the
 * hash. Returns a 64-char hex string.
 *
 * NOTE: This is NOT a security primitive — it's an idempotency fingerprint.
 * Two different callers submitting identical params will collide on purpose;
 * that's the deduplication contract.
 */
export function derivedKey(
  operation: string,
  params: Record<string, unknown>
): string {
  const normalized = canonicalize(params);
  const input = `${operation}\u0000${normalized}`;
  return createHash('sha256').update(input, 'utf8').digest('hex');
}

/** JSON.stringify with deterministic key order. Handles nested objects + arrays. */
function canonicalize(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return '[' + value.map(canonicalize).join(',') + ']';
  }
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return (
    '{' +
    keys.map((k) => JSON.stringify(k) + ':' + canonicalize(obj[k])).join(',') +
    '}'
  );
}
