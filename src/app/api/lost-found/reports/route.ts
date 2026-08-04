import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/lostFoundAuth';
import { browse } from '@/lib/lostFound/reports';

/** GET /api/lost-found/reports — user; browse/search with filters. */
export async function GET(req: NextRequest) {
  const auth = await requireUser(req);
  if ('error' in auth) return auth.error;

  const { searchParams } = new URL(req.url);
  const view = searchParams.get('view');
  const results = await browse(
    {
      category: searchParams.get('category') ?? undefined,
      location: searchParams.get('location') ?? undefined,
      date: searchParams.get('date') ?? undefined,
      status: searchParams.get('status') ?? undefined,
      view: view === 'map' || view === 'list' ? view : undefined,
    },
    auth.user,
  );
  return NextResponse.json(results);
}
