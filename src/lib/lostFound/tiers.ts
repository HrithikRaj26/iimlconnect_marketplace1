/**
 * Binary sensitivity model (tier system removed per request). A category is
 * either sensitive or it isn't — no Tier 1/2/3 distinction.
 */

export type ProofType = 'verbal' | 'receipt' | 'serial' | 'imei' | 'device_unlock';

/** Sensitive handovers must use one of these — never 'verbal'. */
export const DOCUMENTARY_PROOF_TYPES: ProofType[] = ['receipt', 'serial', 'imei', 'device_unlock'];

export function isValidProofTypeForSensitiveItem(proofType: string, isSensitive: boolean): boolean {
  if (isSensitive) {
    return DOCUMENTARY_PROOF_TYPES.includes(proofType as ProofType);
  }
  return true;
}

export const SENSITIVE_CATEGORIES = ['headphones', 'laptop', 'jewellery', 'wallet', 'cash', 'phone'];

export function isSensitiveCategory(category: string): boolean {
  return SENSITIVE_CATEGORIES.includes(category.trim().toLowerCase());
}
