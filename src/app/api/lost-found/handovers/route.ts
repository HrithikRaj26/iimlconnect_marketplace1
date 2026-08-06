import { NextRequest, NextResponse } from 'next/server';
import { requireUser, requireRole } from '@/lib/lostFoundAuth';
import { createHandover } from '@/lib/lostFound/handover';

/** POST /api/lost-found/handovers [CUSTODIAN] — AC-8/AC-9. */
export async function POST(req: NextRequest) {
  const auth = await requireUser(req);
  if ('error' in auth) return auth.error;
  const roleError = requireRole(auth.user, ['custodian', 'admin']);
  if (roleError) return roleError;

  const body = await req.json();
  if (!body.foundReportId) {
    return NextResponse.json({ message: 'foundReportId is required' }, { status: 400 });
  }

  const result = await createHandover(auth.user, body);
  switch (result.kind) {
    case 'missing_proof':
      return NextResponse.json({ message: 'proof_type is required' }, { status: 422 });
    case 'not_found':
      return NextResponse.json({ message: 'Found report not found' }, { status: 404 });
    case 'invalid_proof_for_sensitive_item':
      return NextResponse.json(
        {
          message:
            'Sensitive-item handovers require documentary/technical proof (receipt, serial, imei, or device_unlock), not verbal',
        },
        { status: 422 },
      );
    case 'ok':
      return NextResponse.json(result.handover, { status: 201 });
  }
}
