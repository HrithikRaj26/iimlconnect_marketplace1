import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/lostFoundAuth';
import { computeInstantMatches } from '@/lib/lostFound/instantMatch';

/** GET /api/lost-found/my-matches — live fuzzy match banner data for the caller's own active reports. */
export async function GET(req: NextRequest) {
  const auth = await requireUser(req);
  if ('error' in auth) return auth.error;

  const matches = await computeInstantMatches(auth.user);
  return NextResponse.json(matches);
}
