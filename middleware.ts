import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('mb_token')?.value;
  const pathname = request.nextUrl.pathname;

  // Jika tidak ada token dan mencoba akses halaman admin (kecuali login)
  if (!token && pathname.startsWith('/admin') && pathname !== '/admin/login') {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }

  // Jika tidak ada token dan mencoba akses halaman peserta (kecuali login)
  if (!token && pathname.startsWith('/peserta') && pathname !== '/peserta/login') {
    return NextResponse.redirect(new URL('/peserta/login', request.url));
  }

  // Jika sudah punya token dan mencoba buka halaman login, arahkan ke dashboard
  if (token && (pathname === '/admin/login' || pathname === '/peserta/login')) {
    try {
      // Decode JWT payload sederhana untuk tahu role-nya
      const payloadBase64 = token.split('.')[1];
      const payload = JSON.parse(Buffer.from(payloadBase64, 'base64').toString());
      
      if (payload.role === 'admin' && pathname === '/admin/login') {
        return NextResponse.redirect(new URL('/admin/dashboard', request.url));
      }
      if (payload.role === 'peserta' && pathname === '/peserta/login') {
        return NextResponse.redirect(new URL('/peserta/dashboard', request.url));
      }
    } catch (e) {
      // Token tidak valid, biarkan saja
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/peserta/:path*'],
};
