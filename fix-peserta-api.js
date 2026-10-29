const fs = require('fs');
const path = require('path');

console.log(' Memperbaiki app/api/admin/peserta/route.ts...\n');

const cleanCode = `import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin, hashPassword, generateNomorPeserta, generatePin } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const q = new URL(req.url).searchParams.get('q') || '';
    const w = q ? { OR: [{ namaLengkap: { contains: q } }, { nomorPeserta: { contains: q } }] } : {};
    const [data, total] = await Promise.all([
      prisma.peserta.findMany({ where: w, orderBy: { nomorPeserta: 'asc' } }),
      prisma.peserta.count({ where: w })
    ]);
    return NextResponse.json({ data, total });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const b = await req.json();
    if (!b.namaLengkap) throw new Error('Nama wajib diisi');
    
    const t = await prisma.peserta.count() + 1;
    let np = generateNomorPeserta(t);
    
    // Loop untuk memastikan nomor peserta unik
    while (await prisma.peserta.findUnique({ where: { nomorPeserta: np } })) {
      np = generateNomorPeserta(t + Math.floor(Math.random() * 1000));
    }
    
    const pin = generatePin();
    const pinHash = await hashPassword(pin);
    
    await prisma.peserta.create({
      data: {
        nomorPeserta: np,
        namaLengkap: b.namaLengkap.trim(),
        pinHash
      }
    });
    
    return NextResponse.json({ success: true, np, pin }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
`;

const filePath = path.join(__dirname, 'app', 'api', 'admin', 'peserta', 'route.ts');
fs.writeFileSync(filePath, cleanCode, 'utf8');
console.log('✅ app/api/admin/peserta/route.ts berhasil diperbaiki dengan kode yang rapi.');
console.log('\n👉 Tekan Ctrl+C di terminal, lalu jalankan: npm run dev');