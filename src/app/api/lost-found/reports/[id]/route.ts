import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/lostFoundAuth';
import { archiveReport, getById, updateReport } from '@/lib/lostFound/reports';

/** GET /api/lost-found/reports/:id — user; phone revealed only on confirmed match (AC-6). */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireUser(req);
  if ('error' in auth) return auth.error;

  const report = await getById(params.id, auth.user);
  if (!report) return NextResponse.json({ message: 'Report not found' }, { status: 404 });
  return NextResponse.json(report);
}

/** PATCH /api/lost-found/reports/:id — owner (or admin) only, "My Reports" edit. */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireUser(req);
  if ('error' in auth) return auth.error;

  const body = await req.json().catch(() => ({}));
  const result = await updateReport(params.id, auth.user, body);
  if (result === 'not_found') return NextResponse.json({ message: 'Report not found' }, { status: 404 });
  if (result === 'forbidden') return NextResponse.json({ message: 'Only the reporter can edit this report' }, { status: 403 });
  return NextResponse.json({ status: 'ok' });
}

/** DELETE /api/lost-found/reports/:id — owner (or admin) only; soft-delete (status='archived'). */
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireUser(req);
  if ('error' in auth) return auth.error;

  const result = await archiveReport(params.id, auth.user);
  if (result === 'not_found') return NextResponse.json({ message: 'Report not found' }, { status: 404 });
  if (result === 'forbidden') return NextResponse.json({ message: 'Only the reporter can delete this report' }, { status: 403 });
  return NextResponse.json({ status: 'ok' });
}
