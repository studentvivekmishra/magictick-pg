import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;

  // Paths that do not require auth
  if (pathname === '/' || pathname.startsWith('/api/auth') || pathname.startsWith('/api/seed') || pathname.startsWith('/_next') || pathname.includes('.')) {
    return NextResponse.next();
  }

  // Redirect API requests to a JSON 401, but redirect pages to the login UI
  if (!token) {
    if (pathname.startsWith('/api/')) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return NextResponse.redirect(new URL('/', request.url));
  }

  try {
    // Edge-friendly JWT payload decoding
    const parts = token.split('.');
    if (parts.length !== 3) {
      if (pathname.startsWith('/api/')) {
        return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return NextResponse.redirect(new URL('/', request.url));
    }
    
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    
    const user = JSON.parse(jsonPayload);
    const role = user.role;

    // RBAC Permissions check: Tenant vs Admins
    if (role === 'TENANT') {
      if (!pathname.startsWith('/tenant') && !pathname.startsWith('/api/complaints') && !pathname.startsWith('/api/visitors') && !pathname.startsWith('/api/tenant')) {
        if (pathname.startsWith('/api/')) {
          return new NextResponse(JSON.stringify({ error: 'Forbidden' }), {
            status: 403,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        return NextResponse.redirect(new URL('/tenant', request.url));
      }
    } else {
      // Admins (Owner, Manager, Receptionist) cannot enter the Tenant portal
      if (pathname.startsWith('/tenant')) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }

      // Financial blocks
      if (pathname.startsWith('/expenses') || pathname.startsWith('/analytics') || pathname.startsWith('/settings')) {
        if (role !== 'OWNER' && role !== 'MANAGER') {
          return NextResponse.redirect(new URL('/unauthorized', request.url));
        }
      }

      if (pathname.startsWith('/api/expenses') || pathname.startsWith('/api/analytics') || pathname.startsWith('/api/settings')) {
        if (role !== 'OWNER' && role !== 'MANAGER') {
          return new NextResponse(JSON.stringify({ error: 'Forbidden' }), {
            status: 403,
            headers: { 'Content-Type': 'application/json' },
          });
        }
      }
    }

    return NextResponse.next();
  } catch (error) {
    if (pathname.startsWith('/api/')) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return NextResponse.redirect(new URL('/', request.url));
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js).*)',
  ],
};
