import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/lostFoundAuth';
import { createLostReport } from '@/lib/lostFound/reports';

/** POST /api/lost-found/lost-reports — user (AC-1: photo optional). */
export async function POST(req: NextRequest) {
  const auth = await requireUser(req);
  if ('error' in auth) return auth.error;

  const body = await req.json();
  if (!body.category || !body.description || !body.lastSeenLocation || !body.lostDate) {
    return NextResponse.json(
      { message: 'category, description, lastSeenLocation, and lostDate are required' },
      { status: 400 },
    );
  }

  const report = await createLostReport(auth.user, body);
  return NextResponse.json(report, { status: 201 });
}
