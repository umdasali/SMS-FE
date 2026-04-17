import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = ['/login', '/onboarding', '/'];
const DASHBOARD_PATHS = ['/dashboard', '/students', '/teachers', '/classes', '/routine', '/attendance', '/exams', '/marksheet', '/certificates', '/settings'];
const PORTAL_PATHS = ['/portal'];
const ADMIN_PATHS = ['/saas-admin'];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get('accessToken')?.value
    || request.headers.get('authorization')?.split(' ')[1];

  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'));
  const isDashboard = DASHBOARD_PATHS.some((p) => pathname.startsWith(p));
  const isPortal = PORTAL_PATHS.some((p) => pathname.startsWith(p));
  const isAdmin = ADMIN_PATHS.some((p) => pathname.startsWith(p));

  // Not authenticated → redirect to login
  if ((isDashboard || isPortal || isAdmin) && !accessToken) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Already authenticated → redirect away from login/onboarding
  if (isPublic && pathname !== '/' && accessToken) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Root → redirect to login or dashboard
  if (pathname === '/') {
    if (accessToken) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
