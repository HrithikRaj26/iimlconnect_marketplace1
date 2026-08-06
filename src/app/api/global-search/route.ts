import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { lostFoundAdmin } from '@/lib/lostFoundSupabaseAdmin';

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
          .select('id, title, price, image_url')
          .or(`title.ilike."${searchTerm}",description.ilike."${searchTerm}"`)
          .order('created_at', { ascending: false })
          .limit(4);
      } catch (e) {
        return { data: [], error: e };
      }
    };

    const getVentures = async () => {
      try {
        return await supabase
          .from('ventures')
          .select('id, name, tagline, logo_url')
          .or(`name.ilike."${searchTerm}",tagline.ilike."${searchTerm}",description.ilike."${searchTerm}"`)
          .eq('status', 'approved')
          .order('created_at', { ascending: false })
          .limit(4);
      } catch (e) {
        return { data: [], error: e };
      }
    };

    const getLost = async () => {
      try {
        return await lostFoundAdmin
          .from('lost_report')
          .select('id, category, last_seen_location, status')
          .or(`category.ilike."${searchTerm}",description.ilike."${searchTerm}"`)
          .order('created_at', { ascending: false })
          .limit(3);
      } catch (e) {
        return { data: [], error: e };
      }
    };

    const getFound = async () => {
      try {
        return await lostFoundAdmin
          .from('found_report')
          .select('id, category, pickup_location, status')
          .or(`category.ilike."${searchTerm}",description.ilike."${searchTerm}"`)
          .order('created_at', { ascending: false })
          .limit(3);
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

    // Format results for the frontend
    const marketplace = (listingsRes.data || []).map((item: any) => ({
      id: item.id,
      title: item.title,
      subtitle: `₹${item.price}`,
      image: item.image_url,
      type: 'marketplace',
      url: `/marketplace/${item.id}`
    }));

    const ventures = (venturesRes.data || []).map((item: any) => ({
      id: item.id,
      title: item.name,
      subtitle: item.tagline,
      image: item.logo_url,
      type: 'venture',
      url: `/ventures/${item.id}`
    }));

    const lostItems = (lostRes.data || []).map((item: any) => ({
      id: item.id,
      title: item.category,
      subtitle: `Lost at: ${item.last_seen_location} • Status: ${item.status}`,
      type: 'lost',
      url: `/lost-found/item/${item.id}`
    }));

    const foundItems = (foundRes.data || []).map((item: any) => ({
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
