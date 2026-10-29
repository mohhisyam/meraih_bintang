const fs = require('fs');
const path = require('path');

console.log('🔧 Memperbaiki error generateToken...\n');

// ============================================
// 1. PERBAIKI API SOAL UJIAN PESERTA [id]
// ============================================
const apiSoalUjianContent = `import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePeserta } from '@/lib/auth';

// Fungsi helper untuk generate token sesi
function generateSesiToken() {
  return 'SES-' + Date.now() + '-' + Math.random().toString(36).substring(2, 8).toUpperCase();
}

export async function GET(req: NextRequest, { params }: any) {
  try {
    const peserta = await requirePeserta();
    const { id } = await params;
    
    const ujian = await prisma.ujian.findUnique({
      where: { id: id },
      include: {
        soalUjian: {
          include: {
            soal: true
          },
          orderBy: { urutan: 'asc' }
        }
      }
    });
    
    if (!ujian) {
      return NextResponse.json({ error: 'Ujian tidak ditemukan' }, { status: 404 });
    }
    
    if (ujian.status !== 'berlangsung' && ujian.status !== 'terjadwal') {
      return NextResponse.json({ error: 'Ujian tidak tersedia' }, { status: 403 });
    }
    
    const now = new Date();
    if (now < new Date(ujian.tanggalMulai) || now > new Date(ujian.tanggalSelesai)) {
      return NextResponse.json({ error: 'Ujian belum atau sudah berakhir' }, { status: 403 });
    }
    
    let sesi = await prisma.sesiUjian.findFirst({
      where: {
        pesertaId: peserta.id,
        ujianId: ujian.id,
        status: 'aktif'
      }
    });
    
    if (!sesi) {
      const token = generateSesiToken();
      sesi = await prisma.sesiUjian.create({
        data: {
          pesertaId: peserta.id,
          ujianId: ujian.id,
          token: token,
          durasiDetik: ujian.durasiMenit * 60,
          ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
          userAgent: req.headers.get('user-agent') || 'unknown'
        }
      });
    }
    
    let soalList = ujian.soalUjian.map(su => ({
      soalUjianId: su.id,
      soalId: su.soalId,
      pertanyaan: su.soal.pertanyaan,
      pilihanA: su.soal.pilihanA,
      pilihanB: su.soal.pilihanB,
      pilihanC: su.soal.pilihanC,
      pilihanD: su.soal.pilihanD,
      pilihanE: su.soal.pilihanE,
      gambar: su.soal.gambar
    }));
    
    if (ujian.acakSoal) {
      soalList = soalList.sort(() => Math.random() - 0.5);
    }
    
    return NextResponse.json({
      sesi: {
        id: sesi.id,
        durasiDetik: sesi.durasiDetik
      },
      soal: soalList
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 401 });
  }
}
`;

const apiSoalUjianPath = path.join(__dirname, 'app', 'api', 'peserta', 'ujian', '[id]', 'route.ts');
fs.mkdirSync(path.dirname(apiSoalUjianPath), { recursive: true });
fs.writeFileSync(apiSoalUjianPath, apiSoalUjianContent, 'utf8');
console.log('✅ API soal ujian peserta [id] diperbaiki (generateToken dihapus)');

// ============================================
// 2. TAMBAHKAN generateToken ke lib/auth.ts (opsional, untuk jaga-jaga)
// ============================================
const authPath = path.join(__dirname, 'lib', 'auth.ts');
if (fs.existsSync(authPath)) {
  let authContent = fs.readFileSync(authPath, 'utf8');
  
  if (!authContent.includes('generateToken')) {
    // Tambahkan fungsi generateToken di akhir file sebelum export terakhir
    const tokenFunction = `

// Generate token untuk sesi ujian
export function generateToken(): string {
  return 'TKN-' + Date.now() + '-' + Math.random().toString(36).substring(2, 10).toUpperCase();
}
`;
    
    // Tambahkan sebelum baris terakhir (biasanya ada export atau closing)
    authContent = authContent + tokenFunction;
    fs.writeFileSync(authPath, authContent, 'utf8');
    console.log('✅ Fungsi generateToken ditambahkan ke lib/auth.ts');
  } else {
    console.log('ℹ️  Fungsi generateToken sudah ada di lib/auth.ts');
  }
} else {
  console.log('⚠️  File lib/auth.ts tidak ditemukan, skip');
}

console.log('\n🎉 PERBAIKAN SELESAI!');
console.log('👉 Restart server: Ctrl+C lalu npm run dev');