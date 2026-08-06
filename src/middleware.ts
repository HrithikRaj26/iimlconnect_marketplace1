import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that are publicly accessible without login
const PUBLIC_PATHS = ['/'];

// Prefixes that are always allowed (API routes, Next.js internals)
const ALWAYS_ALLOW_PREFIXES = [
  '/api/',
  '/_next/',
  '/favicon',
  '/robots',
  '/sitemap',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always allow internal and API routes
  if (ALWAYS_ALLOW_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  // Allow the public root (login) page
  if (PUBLIC_PATHS.includes(pathname)) {
    return NextResponse.next();
  }

  // Check for Supabase session cookies (both pkce and implicit flows)
  // Supabase stores the session in a cookie named "sb-<project-ref>-auth-token"
  const cookies = request.cookies;
  const hasSession = [...cookies.getAll()].some(
    (cookie) =>
      cookie.name.startsWith('sb-') && cookie.name.endsWith('-auth-token')
  );

  if (!hasSession) {
    // Redirect unauthenticated users to the login page
    const loginUrl = new URL('/', request.url);
    // Preserve the original destination so we can redirect back after login
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Match all routes except static files and Next.js internals
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
