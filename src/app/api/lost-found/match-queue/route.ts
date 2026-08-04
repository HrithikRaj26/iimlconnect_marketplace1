import { NextRequest, NextResponse } from 'next/server';
import { requireUser, requireRole } from '@/lib/lostFoundAuth';
import { listQueue } from '@/lib/lostFound/matching';

/** GET /api/lost-found/match-queue [CUSTODIAN] — only state=queued rows. */
export async function GET(req: NextRequest) {
  const auth = await requireUser(req);
  if ('error' in auth) return auth.error;
  const roleError = requireRole(auth.user, ['custodian', 'admin']);
  if (roleError) return roleError;

  const queue = await listQueue();
  return NextResponse.json(queue);
}
