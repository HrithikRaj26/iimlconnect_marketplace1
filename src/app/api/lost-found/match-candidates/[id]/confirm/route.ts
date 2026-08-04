import { NextRequest, NextResponse } from 'next/server';
import { requireUser, requireRole } from '@/lib/lostFoundAuth';
import { decide } from '@/lib/lostFound/matching';

/** POST /api/lost-found/match-candidates/:id/confirm [CUSTODIAN] — AC-6: notifies owner. */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireUser(req);
  if ('error' in auth) return auth.error;
  const roleError = requireRole(auth.user, ['custodian', 'admin']);
  if (roleError) return roleError;

  const result = await decide(params.id, 'confirm', auth.user.id);
  if (!result) return NextResponse.json({ message: 'Match candidate not found' }, { status: 404 });
  return NextResponse.json(result);
}
