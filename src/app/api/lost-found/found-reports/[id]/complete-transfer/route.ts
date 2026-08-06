import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/lostFoundAuth';
import { completeTransfer } from '@/lib/lostFound/reports';

const MESSAGES: Record<string, string> = {
  not_found: 'Found report not found',
  forbidden: 'Only the finder can confirm the transfer',
  not_claimed: 'This item has not been claimed yet',
};

/** POST /api/lost-found/found-reports/:id/complete-transfer — finder only. */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireUser(req);
  if ('error' in auth) return auth.error;

  const result = await completeTransfer(params.id, auth.user);
  if (result !== 'ok') {
    const status = result === 'not_found' ? 404 : result === 'forbidden' ? 403 : 409;
    return NextResponse.json({ message: MESSAGES[result] }, { status });
  }
  return NextResponse.json({ status: 'resolved' });
}
