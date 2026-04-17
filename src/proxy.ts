import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes accessible without authentication
const PUBLIC_PREFIXES = ['/login', '/onboarding'];
// /marksheet (exactly) is a public lookup page; /marksheet/[id] requires auth
const PUBLIC_EXACT = new Set(['/marksheet', '/']);

// Protected route prefixes
const DASHBOARD_PREFIXES = [
  '/dashboard', '/students', '/teachers', '/classes', '/subjects',
  '/routine', '/attendance', '/exams', '/marksheet/', '/certificates',
  '/settings', '/finance',
];
const PORTAL_PREFIXES  = ['/portal'];
const ADMIN_PREFIXES   = ['/saas-admin'];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get('accessToken')?.value;

  const isPublic =
    PUBLIC_EXACT.has(pathname) ||
    PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/'));

  const isProtected =
    DASHBOARD_PREFIXES.some((p) => pathname.startsWith(p)) ||
    PORTAL_PREFIXES.some((p)  => pathname.startsWith(p))   ||
    ADMIN_PREFIXES.some((p)   => pathname.startsWith(p));

  // Unauthenticated user hitting a protected route → send to login
  if (isProtected && !accessToken) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Authenticated user hitting the root → send to dashboard
  // (client-side DashboardLayout handles role-based redirect from /dashboard)
  if (pathname === '/' && accessToken) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Authenticated user trying to access login/onboarding → send to dashboard
  if (isPublic && pathname !== '/' && accessToken) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Unauthenticated root → login
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
