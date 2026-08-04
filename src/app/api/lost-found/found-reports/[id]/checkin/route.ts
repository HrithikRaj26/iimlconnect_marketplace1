import { NextRequest, NextResponse } from 'next/server';
import { requireUser, requireRole } from '@/lib/lostFoundAuth';
import { checkin } from '@/lib/lostFound/reports';

/** POST /api/lost-found/found-reports/:id/checkin [CUSTODIAN]. */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireUser(req);
  if ('error' in auth) return auth.error;
  const roleError = requireRole(auth.user, ['custodian', 'admin']);
  if (roleError) return roleError;

  const body = await req.json();
  if (!body.itemLabel) {
    return NextResponse.json({ message: 'itemLabel is required' }, { status: 400 });
  }

  const record = await checkin(params.id, auth.user, body);
  if (!record) return NextResponse.json({ message: 'Found report not found' }, { status: 404 });
  return NextResponse.json(record, { status: 201 });
}
