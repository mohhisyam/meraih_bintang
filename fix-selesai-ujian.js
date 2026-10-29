const fs = require('fs');
const path = require('path');

console.log(' Memperbaiki API selesai ujian...\n');

// ============================================
// 1. PERBAIKI API SELESAI UJIAN
// ============================================
const apiSelesaiContent = `import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePeserta } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const peserta = await requirePeserta();
    const body = await req.json();
    const { sesiId } = body;
    
    console.log(' Memproses selesai ujian untuk sesi:', sesiId);
    
    if (!sesiId) {
      return NextResponse.json({ error: 'Sesi ID tidak ditemukan' }, { status: 400 });
    }
    
    // Cari sesi ujian dengan relasi lengkap
    const sesi = await prisma.sesiUjian.findFirst({
      where: {
        id: sesiId,
        pesertaId: peserta.id
      },
      include: {
        ujian: {
          include: {
            soalUjian: {
              include: {
                soal: true
              }
            }
          }
        },
        jawaban: {
          include: {
            soalUjian: {
              include: {
                soal: true
              }
            }
          }
        }
      }
    });
    
    if (!sesi) {
      return NextResponse.json({ error: 'Sesi ujian tidak ditemukan' }, { status: 404 });
    }
    
    if (sesi.status === 'selesai') {
      return NextResponse.json({ error: 'Ujian sudah selesai' }, { status: 400 });
    }
    
    // Hitung statistik jawaban
    const totalSoal = sesi.ujian.soalUjian.length;
    const jawabanBenar = sesi.jawaban.filter(j => j.benar === true).length;
    const jawabanSalah = sesi.jawaban.filter(j => j.jawaban && j.benar === false).length;
    const tidakDijawab = totalSoal - sesi.jawaban.length;
    
    // Hitung bobot
    const totalBobot = sesi.ujian.soalUjian.reduce((sum, su) => sum + (su.bobot || 1), 0);
    const bobotDidapat = sesi.jawaban
      .filter(j => j.benar === true)
      .reduce((sum, j) => sum + (j.soalUjian?.bobot || 1), 0);
    
    // Hitung nilai
    const nilai = totalBobot > 0 ? (bobotDidapat / totalBobot) * 100 : 0;
    const statusTarget = nilai >= sesi.ujian.passingGrade ? 'lulus' : 'tidak_lulus';
    
    console.log('📊 Hasil: Benar=' + jawabanBenar + ', Salah=' + jawabanSalah + ', Nilai=' + nilai.toFixed(2));
    
    // Update status sesi
    await prisma.sesiUjian.update({
      where: { id: sesiId },
      data: {
        status: 'selesai',
        waktuSelesai: new Date()
      }
    });
    
    // Buat hasil ujian
    const hasil = await prisma.hasil.create({
      data: {
        sesiId: sesiId,
        pesertaId: peserta.id,
        ujianId: sesi.ujianId,
        totalSoal: totalSoal,
        jawabanBenar: jawabanBenar,
        jawabanSalah: jawabanSalah,
        tidakDijawab: tidakDijawab,
        totalBobot: totalBobot,
        bobotDidapat: bobotDidapat,
        nilai: Math.round(nilai * 100) / 100,
        statusTarget: statusTarget
      }
    });
    
    console.log('✅ Hasil ujian dibuat dengan ID:', hasil.id);
    
    return NextResponse.json({ 
      success: true, 
      hasil: {
        id: hasil.id,
        nilai: hasil.nilai,
        jawabanBenar: jawabanBenar,
        totalSoal: totalSoal,
        statusTarget: statusTarget
      }
    });
  } catch (e: any) {
    console.error('❌ Error di API selesai:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
`;

const apiSelesaiPath = path.join(__dirname, 'app', 'api', 'peserta', 'selesai', 'route.ts');
fs.mkdirSync(path.dirname(apiSelesaiPath), { recursive: true });
fs.writeFileSync(apiSelesaiPath, apiSelesaiContent, 'utf8');
console.log('✅ API selesai ujian diperbaiki');

// ============================================
// 2. PERBAIKI API SIMPAN JAWABAN (jaga-jaga)
// ============================================
const apiJawabanContent = `import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePeserta } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    await requirePeserta();
    const body = await req.json();
    const { sesiId, soalUjianId, jawaban } = body;
    
    if (!sesiId || !soalUjianId) {
      return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 });
    }
    
    // Cari soal ujian untuk mendapatkan kunci jawaban
    const soalUjian = await prisma.soalUjian.findUnique({
      where: { id: soalUjianId },
      include: {
        soal: true
      }
    });
    
    if (!soalUjian) {
      return NextResponse.json({ error: 'Soal tidak ditemukan' }, { status: 404 });
    }
    
    const benar = jawaban === soalUjian.soal.kunciJawaban;
    
    // Simpan atau update jawaban
    await prisma.jawaban.upsert({
      where: {
        sesiId_soalUjianId: {
          sesiId: sesiId,
          soalUjianId: soalUjianId
        }
      },
      update: {
        jawaban: jawaban,
        benar: benar
      },
      create: {
        sesiId: sesiId,
        soalUjianId: soalUjianId,
        jawaban: jawaban,
        benar: benar
      }
    });
    
    return NextResponse.json({ success: true, benar });
  } catch (e: any) {
    console.error('Error simpan jawaban:', e);
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
`;

const apiJawabanPath = path.join(__dirname, 'app', 'api', 'peserta', 'jawaban', 'route.ts');
fs.mkdirSync(path.dirname(apiJawabanPath), { recursive: true });
fs.writeFileSync(apiJawabanPath, apiJawabanContent, 'utf8');
console.log('✅ API simpan jawaban diperbaiki');

console.log('\n🎉 PERBAIKAN SELESAI!');
console.log('👉 Restart server: Ctrl+C lalu npm run dev');
console.log('👉 Test ujian lagi, klik "Selesai" akan berfungsi!');