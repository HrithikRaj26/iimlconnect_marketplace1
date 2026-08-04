import { NextRequest, NextResponse } from 'next/server';
import { lostFoundAdmin } from './lostFoundSupabaseAdmin';

export type LostFoundRole = 'user' | 'custodian' | 'admin';

export interface LostFoundUser {
  id: string;
  email?: string;
  role: LostFoundRole;
}

/**
 * Every Lost & Found route handler requires a valid Supabase JWT — ports
 * the contract SupabaseAuthGuard enforced globally in the NestJS build.
 * There's no framework-level "guard" in Next.js route handlers, so each
 * handler calls this first and returns its error response directly if it
 * fails, instead of throwing into a shared exception filter.
 */
export async function requireUser(req: NextRequest): Promise<{ user: LostFoundUser } | { error: NextResponse }> {
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
  if (!token) {
    return { error: NextResponse.json({ message: 'Missing bearer token' }, { status: 401 }) };
  }

  const { data, error } = await lostFoundAdmin.auth.getUser(token);
  if (error || !data.user) {
    return { error: NextResponse.json({ message: 'Invalid or expired token' }, { status: 401 }) };
  }

  const role = data.user.app_metadata?.['role'];
  return {
    user: {
      id: data.user.id,
      email: data.user.email ?? undefined,
      role: role === 'custodian' || role === 'admin' ? role : 'user',
    },
  };
}

/**
 * Ports RolesGuard's contract: admin is a superset of custodian (confirmed
 * decision from the original build — an admin account can do everything a
 * custodian can, plus overrides/metrics).
 */
export function requireRole(user: LostFoundUser, allowed: LostFoundRole[]): NextResponse | null {
  if (!allowed.includes(user.role)) {
    return NextResponse.json({ message: `Requires role: ${allowed.join(' or ')}` }, { status: 403 });
  }
  return null;
}
