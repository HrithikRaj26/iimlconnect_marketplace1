import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Middleware is intentionally a pass-through.
// Auth protection is handled client-side in AppLayout using Supabase localStorage sessions.
export function middleware(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [],
};
