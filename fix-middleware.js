const fs = require('fs');
const path = require('path');

console.log('🔧 Memperbaiki infinite redirect dengan Middleware...');

// 1. Buat middleware.ts di root folder
const middlewareContent = `import { NextResponse } from 'next/server';
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
`;

fs.writeFileSync(path.join(__dirname, 'middleware.ts'), middlewareContent, 'utf8');
console.log('✅ middleware.ts dibuat di root folder');

// 2. Bersihkan app/admin/layout.tsx dari logika redirect
const adminLayoutPath = path.join(__dirname, 'app', 'admin', 'layout.tsx');
if (fs.existsSync(adminLayoutPath)) {
  const cleanLayout = `import Sidebar from '@/components/AdminSidebar';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 lg:ml-64 p-6">{children}</main>
    </div>
  );
}
`;
  fs.writeFileSync(adminLayoutPath, cleanLayout, 'utf8');
  console.log('✅ app/admin/layout.tsx dibersihkan dari redirect');
}

// 3. Hapus file layout.tsx di folder login jika sebelumnya sudah dibuat (tidak diperlukan lagi)
const loginLayoutPath = path.join(__dirname, 'app', 'admin', 'login', 'layout.tsx');
if (fs.existsSync(loginLayoutPath)) {
  fs.unlinkSync(loginLayoutPath);
  console.log('✅ app/admin/login/layout.tsx dihapus');
}

const pesertaLoginLayoutPath = path.join(__dirname, 'app', 'peserta', 'login', 'layout.tsx');
if (fs.existsSync(pesertaLoginLayoutPath)) {
  fs.unlinkSync(pesertaLoginLayoutPath);
  console.log('✅ app/peserta/login/layout.tsx dihapus');
}

console.log('\n🎉 Perbaikan Middleware selesai!');
console.log('👉 Tekan Ctrl+C di terminal untuk menghentikan server, lalu jalankan: npm run dev');