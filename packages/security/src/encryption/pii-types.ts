/**
 * Fields that MUST be encrypted at rest per FR-LD.
 *
 * `cedula` and `rif` are Venezuelan national ID numbers; `phone` is the
 * primary auth handle (re-OTP target); `bankAccount` is settlement data.
 *
 * Column-level AES-256-GCM is the canonical pattern — see `pii.ts`.
 */
export const PII_FIELDS = ['phone', 'cedula', 'bankAccount', 'rif'] as const;

export type PiiField = (typeof PII_FIELDS)[number];

/** Type guard for runtime checks against arbitrary keys. */
export function isPiiField(key: string): key is PiiField {
  return (PII_FIELDS as readonly string[]).includes(key);
}
