export type SensitivityTier = 1 | 2 | 3;
export type ProofType = 'verbal' | 'receipt' | 'serial' | 'imei' | 'device_unlock';

export const DOCUMENTARY_PROOF_TYPES: ProofType[] = ['receipt', 'serial', 'imei', 'device_unlock'];

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

export function suggestTierForCategory(category: string): SensitivityTier {
  return CATEGORY_TIER_MAP[category.trim().toLowerCase()] ?? 2;
}

export interface Contact {
  name?: string;
  phone?: string;
  email?: string;
}

export interface LostReport {
  id: string;
  type: 'lost';
  reporter_id: string;
  category: string;
  description: string;
  last_seen_location: string;
  lost_date: string;
  photo_url: string | null;
  sensitivity_tier: SensitivityTier;
  status: 'open' | 'matched' | 'resolved' | 'archived';
  created_at: string;
  matchedFinderContact?: Contact;
}

export interface FoundReport {
  id: string;
  type: 'found';
  finder_id: string;
  category: string;
  description: string;
  photo_url: string | null;
  contents_withheld: boolean;
  pickup_location: string;
  sensitivity_tier: SensitivityTier;
  status: 'available' | 'matched' | 'resolved' | 'archived';
  created_at: string;
  finderContact?: Contact;
}

export type ReportSummary = LostReport | FoundReport;

export interface MatchQueueEntry {
  id: string;
  score: number;
  signals: Record<string, unknown>;
  state: string;
  created_at: string;
  lost_report: {
    id: string;
    category: string;
    description: string;
    last_seen_location: string;
    lost_date: string;
    photo_url: string | null;
    sensitivity_tier: SensitivityTier;
    reporter_id: string;
  };
  found_report: {
    id: string;
    category: string;
    description: string;
    pickup_location: string;
    photo_url: string | null;
    sensitivity_tier: SensitivityTier;
    contents_withheld: boolean;
    finder_id: string;
  };
}
