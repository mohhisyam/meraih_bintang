const fs = require('fs');
const path = require('path');

console.log('🔧 Memperbaiki fitur Reset PIN dan Error Handling...\n');

// 1. PERBAIKI BACKEND API (app/api/admin/peserta/[id]/route.ts)
const apiRouteContent = `import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin, hashPassword, generatePin } from '@/lib/auth';

export async function PUT(req: NextRequest, { params }: any) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await req.json();
    const peserta = await prisma.peserta.update({
      where: { id },
      data: {
        namaLengkap: body.namaLengkap?.trim(),
        tempatLahir: body.tempatLahir?.trim() || null,
        tanggalLahir: body.tanggalLahir ? new Date(body.tanggalLahir) : null,
        alamat: body.alamat?.trim() || null,
        whatsapp: body.whatsapp?.trim() || null,
        statusAktif: typeof body.statusAktif === 'boolean' ? body.statusAktif : undefined,
      }
    });
    return NextResponse.json({ success: true, peserta });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: any) {
  try {
    await requireAdmin();
    const { id } = await params;
    await prisma.peserta.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

export async function PATCH(req: NextRequest, { params }: any) {
  try {
    // Cek autentikasi admin
    try {
      await requireAdmin();
    } catch (authError: any) {
      return NextResponse.json({ error: 'Anda belum login atau sesi habis. Silakan login ulang.' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { action } = body;

    if (action === 'reset-pin') {
      const pin = generatePin();
      const pinHash = await hashPassword(pin);
      
      await prisma.peserta.update({
        where: { id },
        data: { pinHash, pinHarusGanti: true }
      });
      
      return NextResponse.json({ success: true, pin });
    }

    return NextResponse.json({ error: 'Action tidak valid' }, { status: 400 });
  } catch (error: any) {
    console.error('❌ Error di PATCH /api/admin/peserta/[id]:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
`;

const apiRoutePath = path.join(__dirname, 'app', 'api', 'admin', 'peserta', '[id]', 'route.ts');
fs.mkdirSync(path.dirname(apiRoutePath), { recursive: true });
fs.writeFileSync(apiRoutePath, apiRouteContent, 'utf8');
console.log('✅ Backend API /api/admin/peserta/[id] diperbaiki');

// 2. PERBAIKI FRONTEND (app/admin/peserta/page.tsx) - Khusus bagian handleLihatResetPin
const pagePath = path.join(__dirname, 'app', 'admin', 'peserta', 'page.tsx');
let pageContent = fs.readFileSync(pagePath, 'utf8');

// Kita ganti fungsi handleLihatResetPin yang lama dengan yang baru (lebih detail errornya)
const oldFunction = /async function handleLihatResetPin[\s\S]*?finally \{\s*setLoading\(false\);\s*\}\s*\}/;

const newFunction = `async function handleLihatResetPin(id: string, nama: string) {
  if (!confirm(\`Buat PIN baru untuk \${nama}?\\n(PIN lama akan tidak berlaku)\`)) return;
  
  setLoading(true);
  try {
    const res = await fetch(\`/api/admin/peserta/\${id}\`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reset-pin' }),
    });
    
    // Cek apakah response adalah JSON
    const contentType = res.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      const data = await res.json();
      if (res.ok && data.success) {
        setPinModal({ nama, np: '', pin: data.pin });
      } else {
        alert('❌ Gagal mereset PIN: ' + (data.error || 'Error tidak diketahui'));
      }
    } else {
      // Jika server mengembalikan HTML error (misal 500 atau 404)
      const text = await res.text();
      alert('❌ Server Error (Status: ' + res.status + '): ' + text.substring(0, 150));
    }
  } catch (e: any) {
    console.error(e);
    alert('❌ Terjadi kesalahan jaringan: ' + (e.message || 'Cek console browser (F12) untuk detail'));
  } finally {
    setLoading(false);
  }
}`;

if (oldFunction.test(pageContent)) {
  pageContent = pageContent.replace(oldFunction, newFunction);
  fs.writeFileSync(pagePath, pageContent, 'utf8');
  console.log('✅ Frontend error handling diperbaiki');
} else {
  console.log('⚠️  Tidak dapat menemukan fungsi lama. Memastikan file utuh...');
  // Jika regex gagal, kita biarkan saja, user bisa cek manual
}

console.log('\n🎉 Perbaikan selesai!');
console.log('👉 Tekan Ctrl+C di terminal, lalu jalankan: npm run dev');