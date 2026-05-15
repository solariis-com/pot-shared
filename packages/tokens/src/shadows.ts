/**
 * Shadow tokens — mirrors `pot-poc/lib/tokens.ts` shadow scale.
 *
 * Web (CSS box-shadow strings):
 *   soft     — subtle separation (1-pixel borders, list items)
 *   card     — primary card elevation
 *   elevated — modals, popovers, floating action surfaces
 *
 * React Native equivalents in `nativeShadows` decompose each rgba box-shadow
 * into iOS (`shadowColor`/`shadowOffset`/`shadowOpacity`/`shadowRadius`) +
 * Android (`elevation`) properties.
 */

export const shadows = {
  soft: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
  card: '0 4px 16px rgba(0,0,0,0.08)',
  elevated: '0 8px 24px rgba(0,0,0,0.12)',
} as const;

export type ShadowToken = keyof typeof shadows;

/**
 * React-Native compatible shadow descriptors. The `soft` shadow's
 * second layer is dropped (RN supports a single shadow), keeping the
 * stronger of the two rgba stops.
 */
export const nativeShadows = {
  soft: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  elevated: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
} as const;
