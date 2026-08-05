import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/lostFoundAuth';
import { createFoundReport } from '@/lib/lostFound/reports';

/** POST /api/lost-found/found-reports — user (AC-2: photo required). */
export async function POST(req: NextRequest) {
  const auth = await requireUser(req);
  if ('error' in auth) return auth.error;

  const body = await req.json();
  if (!body.category || !body.description || !body.photoUrl || !body.foundLocation) {
    return NextResponse.json(
      { message: 'category, description, photoUrl, and foundLocation are required' },
      { status: 400 },
    );
  }

  const report = await createFoundReport(auth.user, body);
  return NextResponse.json(report, { status: 201 });
}
