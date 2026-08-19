import { MarketplaceFilters, MarketplaceListing, SearchResult } from "@/types";
import { PAGE_SIZE } from "@/constants/marketplace";
import { supabase } from "@/lib/supabase";
import Fuse from "fuse.js";

export interface ISearchService {
  search(filters: MarketplaceFilters, page: number): Promise<SearchResult>;
}

class SupabaseSearchService implements ISearchService {
  async search(filters: MarketplaceFilters, page: number): Promise<SearchResult> {
    const start = (page - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;

    let query = supabase
      .from('listings')
      .select('*');

    // Hide sold listings. `status` is added by migration
    // marketplace_migration_005_listing_status_and_realtime.sql.
    // `or(...)` covers legacy rows where the column is NULL.
    query = query.or('status.is.null,status.neq.sold');

    // Apply Filters (Skip text query here so we can fuzzy search in memory)
    if (filters.categories.length) {
      query = query.in('category', filters.categories);
    }
    if (filters.conditions.length) {
      query = query.in('condition', filters.conditions);
    }
    if (filters.pickups.length) {
      query = query.in('pickup', filters.pickups);
    }
    
    query = query.gte('price', filters.minPrice).lte('price', filters.maxPrice);

    // Apply Sort to get a deterministically ordered batch to fuzzy search over
    switch (filters.sort) {
      case "price_low_high":
        query = query.order('price', { ascending: true });
        break;
      case "price_high_low":
        query = query.order('price', { ascending: false });
        break;
      case "newest":
      case "relevant":
      default:
        query = query.order('created_at', { ascending: false });
        break;
    }

    // Fetch a large enough batch to run fuzzy search against (e.g. 500)
    query = query.limit(500);

    const { data, error } = await query;

    if (error) {
      console.error("Supabase search error:", error);
      throw new Error(error.message);
    }

    let results = data || [];

    // Apply Fuzzy Search
    if (filters.query.trim()) {
      const fuse = new Fuse(results, {
        keys: ['title', 'description', 'category'],
        threshold: 0.4,
        includeScore: true,
      });
      // Sort by relevance if requested, otherwise keep original sort
      const matched = fuse.search(filters.query.trim());
      if (filters.sort === "relevant") {
        results = matched.map(m => m.item);
      } else {
        // Just filter, maintain original order
        const matchedIds = new Set(matched.map(m => m.item.id));
        results = results.filter(r => matchedIds.has(r.id));
      }
    }

    const total = results.length;
    const paginatedData = results.slice(0, end); // Return from 0 to end to support infinite scrolling accumulating items

    // Map DB rows to MarketplaceListing type
    const items: MarketplaceListing[] = paginatedData.map(row => ({
      id: row.id,
      title: row.title,
      description: row.description,
      price: Number(row.price),
      category: row.category,
      condition: row.condition,
      pickup: row.pickup,
      imageUrl: row.image_url,
      location: row.location,
      sellerName: row.seller_name,
      sellerBatch: row.seller_batch,
      postedAgo: new Date(row.created_at).toLocaleDateString(),
      createdAtOffsetMinutes: 0
    }));

    return {
      items,
      total,
    };
  }
}

export const searchService: ISearchService = new SupabaseSearchService();
