export type ProofType = 'verbal' | 'receipt' | 'serial' | 'imei' | 'device_unlock';

export const DOCUMENTARY_PROOF_TYPES: ProofType[] = ['receipt', 'serial', 'imei', 'device_unlock'];

/** All selectable categories (Report Lost / Report Found category picker). */
export const CATEGORIES = [
  'water bottle',
  'apparel',
  'books',
  'umbrella',
  'stationery',
  'keys',
  'charger',
  'headphones',
  'spectacles',
  'laptop',
  'phone',
  'wallet',
  'cash',
  'jewellery',
  'id card',
  'medication',
];

/** Binary sensitivity model (no tiers) — these categories are treated as sensitive. */
export const SENSITIVE_CATEGORIES = ['headphones', 'laptop', 'jewellery', 'wallet', 'cash', 'phone'];

export function isSensitiveCategory(category: string): boolean {
  return SENSITIVE_CATEGORIES.includes(category.trim().toLowerCase());
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
  is_sensitive: boolean;
  status: 'open' | 'matched' | 'resolved' | 'archived';
  created_at: string;
  visible_to_public: boolean;
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
  is_sensitive: boolean;
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
    is_sensitive: boolean;
    reporter_id: string;
  };
  found_report: {
    id: string;
    category: string;
    description: string;
    pickup_location: string;
    photo_url: string | null;
    is_sensitive: boolean;
    contents_withheld: boolean;
    finder_id: string;
  };
}
