export { proxy as middleware } from '@/proxy';

// config must be defined directly here — Next.js parses it statically at build time
// and cannot resolve re-exports from other modules.
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
