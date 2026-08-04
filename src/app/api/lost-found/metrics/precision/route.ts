import { NextRequest, NextResponse } from 'next/server';
import { requireUser, requireRole } from '@/lib/lostFoundAuth';
import { precision } from '@/lib/lostFound/metrics';

/** GET /api/lost-found/metrics/precision [ADMIN]. */
export async function GET(req: NextRequest) {
  const auth = await requireUser(req);
  if ('error' in auth) return auth.error;
  const roleError = requireRole(auth.user, ['admin']);
  if (roleError) return roleError;

  const { searchParams } = new URL(req.url);
  const result = await precision(searchParams.get('from') ?? undefined, searchParams.get('to') ?? undefined);
  return NextResponse.json(result);
}
