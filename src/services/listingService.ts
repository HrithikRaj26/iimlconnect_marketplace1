import { ListingDraft, PublishedListing } from "@/types";
import { generateId } from "@/utils/format";

/**
 * Service interface — swap the mock implementation below for real HTTP calls
 * (e.g. fetch("/api/listings/images", ...)) once the backend is available.
 * Keeping this as an interface means screens never import fetch/axios directly.
 */
export interface IListingService {
  uploadImage(file: File): Promise<{ remoteUrl: string }>;
  publishListing(draft: ListingDraft, imageUrls: string[]): Promise<PublishedListing>;
}

/** Simulates network latency and an occasional transient failure. */
function delay<T>(value: T, ms = 900): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

class MockListingService implements IListingService {
  async uploadImage(file: File): Promise<{ remoteUrl: string }> {
    // Simulate a rare upload failure so the UI's error-handling path is exercised.
    const shouldFail = Math.random() < 0.05;
    await delay(null, 700 + Math.random() * 600);
    if (shouldFail) {
      throw new Error("Upload failed. Please check your connection and try again.");
    }
    // In production this would be the CDN/object-storage URL returned by the backend.
    return { remoteUrl: URL.createObjectURL(file) };
  }

  async publishListing(
    draft: ListingDraft,
    imageUrls: string[]
  ): Promise<PublishedListing> {
    await delay(null, 1100);

    if (!draft.category || !draft.condition || !draft.pickupLocationType) {
      // Defensive guard — screens validate before calling this, but the service
      // should never silently accept an incomplete draft.
      throw new Error("Listing is missing required fields.");
    }

    return {
      id: generateId(),
      title: draft.title.trim(),
      description: draft.description.trim(),
      category: draft.category,
      condition: draft.condition,
      tags: draft.tags,
      price: Number(draft.price),
      negotiable: draft.negotiable,
      pickupLocationType: draft.pickupLocationType,
      customPickupNote: draft.customPickupNote || undefined,
      imageUrls,
      coverImageUrl: imageUrls[0],
      seller: {
        name: "Aditya S.",
        batch: "Batch of 2026",
      },
      createdAt: new Date().toISOString(),
    };
  }
}

export const listingService: IListingService = new MockListingService();
