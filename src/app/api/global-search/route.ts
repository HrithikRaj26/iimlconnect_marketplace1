import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { lostFoundAdmin } from '@/lib/lostFoundSupabaseAdmin';
import Fuse from 'fuse.js';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q') || '';
  
  if (!query || query.length < 2) {
    return NextResponse.json({ marketplace: [], lostFound: [], ventures: [] });
  }

  const searchTerm = `%${query}%`;

  try {
    const getMarketplace = async () => {
      try {
        return await supabase
          .from('listings')
          .select('id, title, price, image_url, description')
          .order('created_at', { ascending: false })
          .limit(100);
      } catch (e) {
        return { data: [], error: e };
      }
    };

    const getVentures = async () => {
      try {
        return await supabase
          .from('ventures')
          .select('id, name, tagline, description, logo_url')
          .eq('status', 'approved')
          .order('created_at', { ascending: false })
          .limit(100);
      } catch (e) {
        return { data: [], error: e };
      }
    };

    const getLost = async () => {
      try {
        return await lostFoundAdmin
          .from('lost_report')
          .select('id, category, description, last_seen_location, status')
          .order('created_at', { ascending: false })
          .limit(100);
      } catch (e) {
        return { data: [], error: e };
      }
    };

    const getFound = async () => {
      try {
        return await lostFoundAdmin
          .from('found_report')
          .select('id, category, description, pickup_location, status')
          .order('created_at', { ascending: false })
          .limit(100);
      } catch (e) {
        return { data: [], error: e };
      }
    };

    const [listingsRes, venturesRes, lostRes, foundRes] = await Promise.all([
      getMarketplace(),
      getVentures(),
      getLost(),
      getFound()
    ]);

    // Apply Fuse.js Fuzzy Searching
    const fuseOptions = {
      includeScore: true,
      threshold: 0.4,
    };

    const fuseMarketplace = new Fuse(listingsRes.data || [], { ...fuseOptions, keys: ['title', 'description'] });
    const fuseVentures = new Fuse(venturesRes.data || [], { ...fuseOptions, keys: ['name', 'tagline', 'description'] });
    const fuseLost = new Fuse(lostRes.data || [], { ...fuseOptions, keys: ['category', 'description'] });
    const fuseFound = new Fuse(foundRes.data || [], { ...fuseOptions, keys: ['category', 'description'] });

    const matchedMarketplace = fuseMarketplace.search(query).slice(0, 4).map(res => res.item);
    const matchedVentures = fuseVentures.search(query).slice(0, 4).map(res => res.item);
    const matchedLost = fuseLost.search(query).slice(0, 3).map(res => res.item);
    const matchedFound = fuseFound.search(query).slice(0, 3).map(res => res.item);

    // Format results for the frontend
    const marketplace = matchedMarketplace.map((item: any) => ({
      id: item.id,
      title: item.title,
      subtitle: `₹${item.price}`,
      image: item.image_url,
      type: 'marketplace',
      url: `/marketplace/${item.id}`
    }));

    const ventures = matchedVentures.map((item: any) => ({
      id: item.id,
      title: item.name,
      subtitle: item.tagline,
      image: item.logo_url,
      type: 'venture',
      url: `/ventures/${item.id}`
    }));

    const lostItems = matchedLost.map((item: any) => ({
      id: item.id,
      title: item.category,
      subtitle: `Lost at: ${item.last_seen_location} • Status: ${item.status}`,
      type: 'lost',
      url: `/lost-found/item/${item.id}`
    }));

    const foundItems = matchedFound.map((item: any) => ({
      id: item.id,
      title: item.category,
      subtitle: `Found at: ${item.pickup_location} • Status: ${item.status}`,
      type: 'found',
      url: `/lost-found/item/${item.id}`
    }));

    const lostFound = [...lostItems, ...foundItems].slice(0, 4);

    return NextResponse.json({
      marketplace,
      ventures,
      lostFound
    });

  } catch (error: any) {
    console.error('Global Search Error:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message || String(error) }, { status: 500 });
  }
}
