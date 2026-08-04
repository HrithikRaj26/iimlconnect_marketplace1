import { NextRequest, NextResponse } from 'next/server';
import { requireUser, requireRole } from '@/lib/lostFoundAuth';
import { override } from '@/lib/lostFound/reports';

/** POST /api/lost-found/reports/:id/override [ADMIN] — override a match / resolve a dispute, logged. */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireUser(req);
  if ('error' in auth) return auth.error;
  const roleError = requireRole(auth.user, ['admin']);
  if (roleError) return roleError;

  const body = await req.json();
  if (body.decision !== 'confirm' && body.decision !== 'reject') {
    return NextResponse.json({ message: "decision must be 'confirm' or 'reject'" }, { status: 400 });
  }

  const result = await override(params.id, auth.user, body.decision);
  if (!result) {
    return NextResponse.json({ message: 'No match candidate found for this report to override' }, { status: 404 });
  }
  return NextResponse.json(result);
}
