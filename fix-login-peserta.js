const fs = require('fs');
const path = require('path');

console.log('🔧 Memaksa mengganti halaman login peserta...\n');

// 1. Ganti total file halaman login peserta
const loginPagePath = path.join(__dirname, 'app', 'peserta', 'login', 'page.tsx');
const loginPageCode = `'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPeserta() {
  const [nomor, setNomor] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch('/api/auth/peserta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nomorPeserta: nomor }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        router.push('/peserta/dashboard');
      } else {
        setError(data.error || 'Nomor peserta tidak ditemukan');
      }
    } catch (err) {
      setError('Terjadi kesalahan jaringan');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen gradient-navy flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md">
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto gradient-gold rounded-full flex items-center justify-center text-2xl font-bold text-navy mb-3">MB</div>
          <h1 className="text-2xl font-bold text-navy">Login Peserta</h1>
          <p className="text-sm text-slate-500">Try Out Perangkat Desa Payaman</p>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nomor Peserta</label>
            <input 
              type="text" 
              value={nomor} 
              onChange={e => setNomor(e.target.value)} 
              placeholder="Contoh: MBP-2026-0001" 
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-gold outline-none" 
              required 
              autoComplete="off"
            />
          </div>
          
          {error && (
            <p className="text-red-500 text-sm bg-red-50 p-2 rounded">{error}</p>
          )}
          
          <button 
            type="submit" 
            disabled={loading} 
            className="w-full py-3 gradient-gold text-navy font-bold rounded-lg hover:opacity-90 disabled:opacity-50"
          >
            {loading ? 'Memproses...' : 'Masuk'}
          </button>
        </form>
      </div>
    </div>
  );
}
`;

fs.mkdirSync(path.dirname(loginPagePath), { recursive: true });
fs.writeFileSync(loginPagePath, loginPageCode, 'utf8');
console.log('✅ app/peserta/login/page.tsx berhasil diganti (HANYA Nomor Peserta)');

// 2. Ganti total file API login peserta
const apiLoginPath = path.join(__dirname, 'app', 'api', 'auth', 'peserta', 'route.ts');
const apiLoginCode = `import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { signToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { nomorPeserta } = await req.json();
    
    if (!nomorPeserta) {
      return NextResponse.json({ error: 'Nomor peserta wajib diisi' }, { status: 400 });
    }

    const peserta = await prisma.peserta.findUnique({
      where: { nomorPeserta: nomorPeserta.trim() },
    });

    if (!peserta) {
      return NextResponse.json({ error: 'Nomor peserta tidak ditemukan' }, { status: 401 });
    }

    if (!peserta.statusAktif) {
      return NextResponse.json({ error: 'Akun peserta tidak aktif' }, { status: 403 });
    }

    const token = signToken({ 
      id: peserta.id, 
      role: 'peserta', 
      nama: peserta.namaLengkap 
    });

    const response = NextResponse.json({ success: true });
    response.cookies.set('mb_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24,
    });

    return response;
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
`;

fs.mkdirSync(path.dirname(apiLoginPath), { recursive: true });
fs.writeFileSync(apiLoginPath, apiLoginCode, 'utf8');
console.log('✅ app/api/auth/peserta/route.ts berhasil diganti');

console.log('\n🎉 PERBAIKAN SELESAI!');
console.log('👉 LANGKAH TERAKHIR:');
console.log('   1. Tekan Ctrl+C di terminal untuk STOP server');
console.log('   2. Jalankan: npm run dev');
console.log('   3. Buka browser Mode Incognito (Ctrl+Shift+N)');
console.log('   4. Buka http://localhost:3000/peserta/login');
console.log('   5. Tekan Ctrl+F5 (Hard Refresh)');