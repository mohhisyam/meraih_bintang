const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

console.log('🔧 Perbaikan PIN sederhana...\n');

// 1. PERBAIKI API POST PESERTA
const apiPostPath = path.join(__dirname, 'app', 'api', 'admin', 'peserta', 'route.ts');
if (fs.existsSync(apiPostPath)) {
  let apiPost = fs.readFileSync(apiPostPath, 'utf8');
  
  // Cek apakah sudah ada pinPlain
  if (!apiPost.includes('pinPlain')) {
    // Tambahkan pinPlain setelah pinHash
    apiPost = apiPost.replace(
      /pinHash,\n\s*\}\s*\)/,
      'pinHash,\n        pinPlain: pin\n      }\n    )'
    );
    fs.writeFileSync(apiPostPath, apiPost, 'utf8');
    console.log('✅ API POST diperbaiki: pinPlain akan disimpan');
  } else {
    console.log('✅ API POST sudah ada pinPlain');
  }
} else {
  console.log('️  File API POST tidak ditemukan, skip');
}

// 2. BUAT FILE API PATCH JIKA BELUM ADA
const apiPatchDir = path.join(__dirname, 'app', 'api', 'admin', 'peserta', '[id]');
const apiPatchPath = path.join(apiPatchDir, 'route.ts');

if (!fs.existsSync(apiPatchDir)) {
  fs.mkdirSync(apiPatchDir, { recursive: true });
  console.log('📁 Folder [id] dibuat');
}

const apiPatchContent = `import { NextRequest, NextResponse } from 'next/server';
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
    await requireAdmin();
    const { id } = await params;
    const body = await req.json();
    const { action } = body;

    if (action === 'reset-pin') {
      const pin = generatePin();
      const pinHash = await hashPassword(pin);
      
      await prisma.peserta.update({
        where: { id },
        data: { pinHash, pinPlain: pin, pinHarusGanti: true }
      });
      
      return NextResponse.json({ success: true, pin });
    }

    return NextResponse.json({ error: 'Action tidak valid' }, { status: 400 });
  } catch (error: any) {
    console.error('Error PATCH:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
`;

fs.writeFileSync(apiPatchPath, apiPatchContent, 'utf8');
console.log('✅ File API PATCH dibuat: app/api/admin/peserta/[id]/route.ts');

// 3. GENERATE PIN UNTUK SEMUA PESERTA
async function generatePins() {
  console.log('\n🔍 Mencari peserta tanpa PIN...');
  const prisma = new PrismaClient();
  
  const pesertaTanpaPin = await prisma.peserta.findMany({
    where: {
      OR: [
        { pinPlain: '' },
        { pinPlain: null }
      ]
    }
  });
  
  if (pesertaTanpaPin.length === 0) {
    console.log('✅ Semua peserta sudah punya PIN!');
    await prisma.$disconnect();
    return;
  }
  
  console.log(`📋 Ditemukan ${pesertaTanpaPin.length} peserta tanpa PIN\n`);
  console.log('='.repeat(60));
  console.log('DAFTAR PIN YANG DIHASILKAN (SIMPAN INI!):');
  console.log('='.repeat(60));
  
  for (const p of pesertaTanpaPin) {
    const pinBaru = Math.floor(100000 + Math.random() * 900000).toString();
    
    await prisma.peserta.update({
      where: { id: p.id },
      data: { pinPlain: pinBaru }
    });
    
    console.log(`👤 ${p.namaLengkap}`);
    console.log(`   Nomor: ${p.nomorPeserta}`);
    console.log(`   PIN:   ${pinBaru}`);
    console.log('-'.repeat(60));
  }
  
  console.log('\n✅ SEMUA PIN BERHASIL DIGENERATE!');
  console.log('👉 Refresh halaman Data Peserta di browser (Ctrl+F5)');
  
  await prisma.$disconnect();
}

generatePins().catch(e => {
  console.error('❌ Error:', e.message);
  process.exit(1);
});