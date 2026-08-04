/** Ported from packages/shared-types/src/index.ts (original NestJS build). */

export type SensitivityTier = 1 | 2 | 3;

export type ProofType = 'verbal' | 'receipt' | 'serial' | 'imei' | 'device_unlock';

/** Tier-3 handovers must use one of these — never 'verbal' (FR-4.1, AC-8). */
export const DOCUMENTARY_PROOF_TYPES: ProofType[] = ['receipt', 'serial', 'imei', 'device_unlock'];

export function isValidProofTypeForTier(proofType: string, tier: number): boolean {
  if (tier === 3) {
    return DOCUMENTARY_PROOF_TYPES.includes(proofType as ProofType);
  }
  return true;
}

/** Section 7 example categories → auto-suggested sensitivity tier. */
export const CATEGORY_TIER_MAP: Record<string, SensitivityTier> = {
  'water bottle': 1,
  apparel: 1,
  books: 1,
  umbrella: 1,
  stationery: 1,

  keys: 2,
  charger: 2,
  headphones: 2,
  spectacles: 2,

  laptop: 3,
  phone: 3,
  wallet: 3,
  cash: 3,
  jewellery: 3,
  'id card': 3,
  medication: 3,
};

export const CATEGORIES = Object.keys(CATEGORY_TIER_MAP);

/** Falls back to Tier-2 (elevated, custodian judgement) for any category
 * not in the known list, rather than silently under- or over-classifying. */
export function suggestTierForCategory(category: string): SensitivityTier {
  return CATEGORY_TIER_MAP[category.trim().toLowerCase()] ?? 2;
}
