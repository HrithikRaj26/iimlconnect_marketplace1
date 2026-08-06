// ── Shared domain types for the Marketplace Listing feature ──────────────────

export type ItemCondition = "new" | "like_new" | "good" | "fair";

export type ItemCategory =
  | "books"
  | "electronics"
  | "furniture"
  | "cycles"
  | "hostel_essentials"
  | "appliances"
  | "others";

export type PickupLocationType =
  | "hostel_room"
  | "academic_block"
  | "library"
  | "custom";

export interface ListingImage {
  /** Client-generated id used for stable React keys and reordering. */
  id: string;
  /** Local preview URL (object URL) shown before/while uploading. */
  previewUrl: string;
  /** Original File reference — sent to the upload service. */
  file: File;
  /** Upload lifecycle for this specific image. */
  status: "idle" | "uploading" | "uploaded" | "error";
  /** Remote URL once the mock/real upload completes. */
  remoteUrl?: string;
  /** Populated when status === "error". */
  errorMessage?: string;
}

export interface ListingDraft {
  images: ListingImage[];
  title: string;
  description: string;
  category: ItemCategory | null;
  condition: ItemCondition | null;
  tags: string[];
  price: string; // kept as string while editing, parsed on submit
  negotiable: boolean;
  pickupLocationType: PickupLocationType | null;
  customPickupNote: string;
}

export interface PublishedListing {
  id: string;
  title: string;
  description: string;
  category: ItemCategory;
  condition: ItemCondition;
  tags: string[];
  price: number;
  negotiable: boolean;
  pickupLocationType: PickupLocationType;
  customPickupNote?: string;
  imageUrls: string[];
  coverImageUrl: string;
  seller: {
    name: string;
    batch: string;
    avatarUrl?: string;
  };
  createdAt: string;
}

// ── Search & Filters (Feature 2) ─────────────────────────────────────────────

export type SortOption =
  | "relevant"
  | "newest"
  | "price_low_high"
  | "price_high_low";

export type PickupFilter = "hostel" | "academic_block" | "library" | "other";

export interface MarketplaceListing {
  id: string;
  title: string;
  price: number;
  category: ItemCategory;
  condition: ItemCondition;
  pickup: PickupFilter;
  imageUrl: string;
  sellerName: string;
  sellerBatch: string;
  location: string;
  postedAgo: string;
  createdAtOffsetMinutes: number; // used for "newest" sorting on mock data
}

export interface MarketplaceFilters {
  query: string;
  categories: ItemCategory[];
  conditions: ItemCondition[];
  pickups: PickupFilter[];
  minPrice: number;
  maxPrice: number;
  sort: SortOption;
}

export interface SearchResult {
  items: MarketplaceListing[];
  total: number;
}

export type AsyncStatus = "idle" | "loading" | "success" | "error";

// ── Make an Offer & In-App Chat (Feature 3) ──────────────────────────────────

export type OfferStatus =
  | "pending"      // awaiting the other party's response
  | "accepted"
  | "declined"
  | "countered"    // superseded by a counter-offer
  | "expired";

export type OfferDirection = "sent" | "received";

export interface Offer {
  id: string;
  amount: number;
  status: OfferStatus;
  direction: OfferDirection; // relative to the current user
  createdAt: number;         // epoch ms, for ordering
  note?: string;
}

export type MessageStatus = "sending" | "sent" | "delivered" | "read" | "failed";

export type MessageKind = "text" | "offer";

export interface ChatMessage {
  id: string;
  kind: MessageKind;
  authorId: string;          // "me" or the counterparty id
  createdAt: number;
  status: MessageStatus;
  // text messages
  text?: string;
  // offer messages carry a reference to an Offer
  offer?: Offer;
}

export type TransactionStatus = "negotiating" | "agreed" | "completed";

export interface Transaction {
  status: TransactionStatus;
  finalAmount?: number;
  pickupLocation?: string;
  pickupTime?: string;
}

export interface ChatParticipant {
  id: string;
  name: string;
  batch: string;
  online: boolean;
  verified: boolean;
  avatarColor: string; // simple avatar stand-in
}

export interface Conversation {
  id: string;
  participant: ChatParticipant;
  listing: {
    id: string;
    title: string;
    askingPrice: number;
    imageUrl: string;
  };
  lastMessagePreview: string;
  lastMessageAt: string;
  unreadCount: number;
  messages: ChatMessage[];
  transaction: Transaction;
}

export interface FieldErrors {
  images?: string;
  title?: string;
  category?: string;
  condition?: string;
  price?: string;
  description?: string;
  pickupLocationType?: string;
}

// ── Venture Hub & Community Types (Epic-04) ──────────────────────────────────

export type VentureCategory = "Tech" | "F&B" | "Fashion" | "Consulting/Freelance" | "Creative/Art" | "Services";

export type VentureStatus = "draft" | "pending_approval" | "approved" | "rejected" | "suspended";

export interface Venture {
  id: string;
  owner_id: string;
  name: string;
  tagline: string;
  description: string;
  category: VentureCategory;
  logo_url?: string;
  offerings: string[];
  contact_links: {
    website?: string;
    instagram?: string;
    whatsapp?: string;
    [key: string]: string | undefined;
  };
  status: VentureStatus;
  is_featured: boolean;
  is_open: boolean;
  average_rating: number;
  reviews_count: number;
  owner_name: string;
  owner_batch: string;
  created_at: string;
  terms_accepted: boolean;
  approved_at?: string;
  current_due: number;
  pending_updates?: {
    name: string;
    tagline: string;
    description: string;
    category: VentureCategory;
    logo_url?: string;
    offerings: string[];
    contact_links: {
      website?: string;
      instagram?: string;
      whatsapp?: string;
      email?: string;
    };
  } | null;
}

export interface VentureReview {
  id: string;
  venture_id: string;
  reviewer_id: string;
  rating: number;
  content: string;
  reviewer_name: string;
  reviewer_batch: string;
  created_at: string;
}

export type VenturePostType = "event" | "promotion" | "update";

export interface VenturePost {
  id: string;
  venture_id: string;
  author_id: string;
  type: VenturePostType;
  title: string;
  content: string;
  event_date?: string;
  event_location?: string;
  likes: number;
  shares: number;
  created_at: string;
  venture?: {
    name: string;
    logo_url: string | null;
    category: string;
  };
  isLiked?: boolean;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_type: "top_reviewer" | "serial_entrepreneur" | "active_supporter";
  reason: string;
  granted_at: string;
}

