import { MarketplaceFilters, MarketplaceListing, SearchResult } from "@/types";
import { MOCK_LISTINGS } from "@/constants/mockListings";
import { PAGE_SIZE } from "@/constants/marketplace";

/**
 * Service interface — replace the mock body with a real HTTP call
 * (e.g. GET /api/listings?query=...&category=...) when the backend exists.
 * Screens depend only on this interface, never on fetch/axios directly.
 */
export interface ISearchService {
  search(filters: MarketplaceFilters, page: number): Promise<SearchResult>;
}

function delay<T>(value: T, ms: number): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

function applyFilters(
  listings: MarketplaceListing[],
  f: MarketplaceFilters
): MarketplaceListing[] {
  let result = listings;

  const q = f.query.trim().toLowerCase();
  if (q) {
    result = result.filter((l) => l.title.toLowerCase().includes(q));
  }
  if (f.categories.length) {
    result = result.filter((l) => f.categories.includes(l.category));
  }
  if (f.conditions.length) {
    result = result.filter((l) => f.conditions.includes(l.condition));
  }
  if (f.pickups.length) {
    result = result.filter((l) => f.pickups.includes(l.pickup));
  }
  result = result.filter((l) => l.price >= f.minPrice && l.price <= f.maxPrice);

  switch (f.sort) {
    case "price_low_high":
      result = [...result].sort((a, b) => a.price - b.price);
      break;
    case "price_high_low":
      result = [...result].sort((a, b) => b.price - a.price);
      break;
    case "newest":
      result = [...result].sort(
        (a, b) => a.createdAtOffsetMinutes - b.createdAtOffsetMinutes
      );
      break;
    case "relevant":
    default:
      // Mock relevance: keep seed order; a real backend would score by query match.
      break;
  }

  return result;
}

class MockSearchService implements ISearchService {
  async search(filters: MarketplaceFilters, page: number): Promise<SearchResult> {
    // Simulate network latency so loading states are visible.
    await delay(null, 450);
    const filtered = applyFilters(MOCK_LISTINGS, filters);
    const start = 0;
    const end = page * PAGE_SIZE;
    return {
      items: filtered.slice(start, end),
      total: filtered.length,
    };
  }
}

export const searchService: ISearchService = new MockSearchService();
