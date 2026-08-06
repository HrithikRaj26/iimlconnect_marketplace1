import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/lostFoundAuth';
import { claimItem } from '@/lib/lostFound/reports';

const MESSAGES: Record<string, string> = {
  not_found: 'Found report not found',
  sensitive_item: 'Sensitive items must be collected through the PGP Office handover process, not a direct claim',
  already_claimed: 'This item has already been claimed',
  not_available: 'This item is no longer available to claim',
};

/** POST /api/lost-found/found-reports/:id/claim — any user; self-service "this is mine". */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireUser(req);
  if ('error' in auth) return auth.error;

  const result = await claimItem(params.id, auth.user);
  if (result !== 'ok') {
    const status = result === 'not_found' ? 404 : result === 'sensitive_item' ? 422 : 409;
    return NextResponse.json({ message: MESSAGES[result] }, { status });
  }
  return NextResponse.json({ status: 'claimed' });
}
