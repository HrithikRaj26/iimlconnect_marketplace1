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

export type AsyncStatus = "idle" | "loading" | "success" | "error";

export interface FieldErrors {
  images?: string;
  title?: string;
  category?: string;
  condition?: string;
  price?: string;
  description?: string;
  pickupLocationType?: string;
}
