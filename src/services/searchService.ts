import { MarketplaceFilters, MarketplaceListing, SearchResult } from "@/types";
import { PAGE_SIZE } from "@/constants/marketplace";
import { supabase } from "@/lib/supabase";

export interface ISearchService {
  search(filters: MarketplaceFilters, page: number): Promise<SearchResult>;
}

class SupabaseSearchService implements ISearchService {
  async search(filters: MarketplaceFilters, page: number): Promise<SearchResult> {
    const start = 0;
    const end = (page * PAGE_SIZE) - 1;

    let query = supabase
      .from('listings')
      .select('*', { count: 'exact' });

    // Apply Filters
    if (filters.query.trim()) {
      query = query.ilike('title', `%${filters.query.trim()}%`);
    }
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

    // Apply Sort
    switch (filters.sort) {
      case "price_low_high":
        query = query.order('price', { ascending: true });
        break;
      case "price_high_low":
        query = query.order('price', { ascending: false });
        break;
      case "newest":
        query = query.order('created_at', { ascending: false });
        break;
      case "relevant":
      default:
        query = query.order('created_at', { ascending: false });
        break;
    }

    query = query.range(start, end);

    const { data, count, error } = await query;

    if (error) {
      console.error("Supabase search error:", error);
      throw new Error(error.message);
    }

    // Map DB rows to MarketplaceListing type
    const items: MarketplaceListing[] = (data || []).map(row => ({
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
      createdAtOffsetMinutes: 0 // Not needed for UI sorting anymore since DB handles it
    }));

    return {
      items,
      total: count || 0,
    };
  }
}

export const searchService: ISearchService = new SupabaseSearchService();
