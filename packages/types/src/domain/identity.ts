import { z } from 'zod';

/**
 * Venezuelan identity prefixes — PRD v2.6 D-11.
 *
 * - Natural personas: V (venezolano), E (extranjero), P (pasaporte)
 * - Jurídicos: J (jurídico), V (asociación civil V-RIF), E (extranjero corporate),
 *              G (gobierno), C (consejos comunales)
 */
export const NATURAL_PREFIXES = ['V', 'E', 'P'] as const;
export const JURIDICO_PREFIXES = ['J', 'V', 'E', 'G', 'C'] as const;

export const NaturalPrefixSchema = z.enum(NATURAL_PREFIXES);
export type NaturalPrefix = z.infer<typeof NaturalPrefixSchema>;

export const JuridicoPrefixSchema = z.enum(JURIDICO_PREFIXES);
export type JuridicoPrefix = z.infer<typeof JuridicoPrefixSchema>;

export const EntityTypeSchema = z.enum(['natural', 'juridico']);
export type EntityType = z.infer<typeof EntityTypeSchema>;

/**
 * Document number body (without prefix). VE convention: 7–9 digits, optional
 * thousand-dot separators displayed in UI (e.g. "22.345.678"). We store the
 * raw digit string here — formatting is a UI concern.
 */
const DocumentNumberSchema = z
  .string()
  .regex(/^\d{7,9}$/, 'Document number must be 7–9 digits');

export const NaturalIdentitySchema = z.object({
  entityType: z.literal('natural'),
  prefix: NaturalPrefixSchema,
  number: DocumentNumberSchema,
});
export type NaturalIdentity = z.infer<typeof NaturalIdentitySchema>;

export const JuridicoIdentitySchema = z.object({
  entityType: z.literal('juridico'),
  prefix: JuridicoPrefixSchema,
  number: DocumentNumberSchema,
  /** RIF razón social — required for jurídicos by FR-CP. */
  razonSocial: z.string().min(2).max(200),
});
export type JuridicoIdentity = z.infer<typeof JuridicoIdentitySchema>;

/**
 * Discriminated union: any party in the system is either natural or jurídico.
 * Discriminator: `entityType`.
 */
export const IdentityDocumentSchema = z.discriminatedUnion('entityType', [
  NaturalIdentitySchema,
  JuridicoIdentitySchema,
]);
export type IdentityDocument = z.infer<typeof IdentityDocumentSchema>;

/** Canonical display form: "V-22345678" (no thousand separators in storage). */
export function formatIdentity(doc: IdentityDocument): string {
  return `${doc.prefix}-${doc.number}`;
}
