import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/lostFoundAuth';
import { getById } from '@/lib/lostFound/reports';

/** GET /api/lost-found/reports/:id — user; phone revealed only on confirmed match (AC-6). */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireUser(req);
  if ('error' in auth) return auth.error;

  const report = await getById(params.id, auth.user);
  if (!report) return NextResponse.json({ message: 'Report not found' }, { status: 404 });
  return NextResponse.json(report);
}
