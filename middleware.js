import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

const PUBLIC_PATHS = [
  '/login',
  '/signup',
  '/forgot-password',
  '/book',
  '/',
];

function isPublic(pathname) {
  if (PUBLIC_PATHS.includes(pathname)) return true;
  if (pathname.startsWith('/api/auth')) return true;
  if (pathname.startsWith('/_next')) return true;
  if (pathname.startsWith('/favicon')) return true;
  return false;
}

export async function middleware(req) {
  const { pathname } = req.nextUrl;

  if (pathname === '/doctor/first-run') return NextResponse.next();

  if (isPublic(pathname)) return NextResponse.next();

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  const role = token.role;
  if (pathname.startsWith('/doctor')) {
    if (role !== 'admin' && role !== 'staff') {
      return NextResponse.redirect(new URL('/', req.url));
    }
    if (
      (pathname.startsWith('/doctor/admin') || pathname.startsWith('/doctor/settings')) &&
      role !== 'admin'
    ) {
      return NextResponse.redirect(new URL('/doctor', req.url));
    }
  } else if (pathname.startsWith('/patient')) {
    if (role !== 'patient') {
      return NextResponse.redirect(new URL('/', req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
