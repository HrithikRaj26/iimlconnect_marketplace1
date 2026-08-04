import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/lostFoundAuth';
import { resolve } from '@/lib/lostFound/reports';

/** POST /api/lost-found/reports/:id/resolve — user (must be the reporter, or custodian/admin). */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireUser(req);
  if ('error' in auth) return auth.error;

  const body = await req.json().catch(() => ({}));
  const result = await resolve(params.id, auth.user, body);
  if (result === 'not_found') return NextResponse.json({ message: 'Lost report not found' }, { status: 404 });
  if (result === 'forbidden') {
    return NextResponse.json({ message: 'Only the reporter can resolve this report' }, { status: 403 });
  }
  return NextResponse.json(result);
}
