import { NextRequest, NextResponse } from 'next/server';
import { purgeResolvedReports } from '@/lib/lostFound/retention';

/**
 * POST /api/lost-found/retention/purge — AC-12. Triggered by Vercel Cron
 * (see vercel.json), not a logged-in user, so it's gated by a shared secret
 * instead of requireUser/requireRole. Vercel signs cron requests with an
 * Authorization: Bearer $CRON_SECRET header when CRON_SECRET is set.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const authHeader = req.headers.get('authorization');
  if (secret && authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const result = await purgeResolvedReports();
  return NextResponse.json(result);
}
