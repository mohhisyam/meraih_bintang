const fs = require('fs');
const path = require('path');

console.log('🔧 Memperbaiki API selesai ujian (tanpa include bermasalah)...\n');

// ============================================
// API SELESAI UJIAN - TANPA NESTED INCLUDE
// ============================================
const apiSelesaiContent = `import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePeserta } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const peserta = await requirePeserta();
    const body = await req.json();
    const { sesiId } = body;
    
    console.log('🔍 Memproses selesai ujian...');
    console.log('   Peserta ID:', peserta.id);
    console.log('   Sesi ID:', sesiId);
    
    if (!sesiId) {
      return NextResponse.json({ error: 'Sesi ID tidak ditemukan' }, { status: 400 });
    }
    
    // LANGKAH 1: Cek sesi
    const sesi = await prisma.sesiUjian.findFirst({
      where: { id: sesiId, pesertaId: peserta.id }
    });
    
    if (!sesi) {
      return NextResponse.json({ error: 'Sesi ujian tidak ditemukan' }, { status: 404 });
    }
    
    if (sesi.status === 'selesai') {
      return NextResponse.json({ error: 'Ujian sudah selesai' }, { status: 400 });
    }
    
    // LANGKAH 2: Ambil data ujian + soalUjian (1 level include saja)
    const ujian = await prisma.ujian.findUnique({
      where: { id: sesi.ujianId },
      include: {
        soalUjian: true  // Hanya include soalUjian, TANPA nested soal
      }
    });
    
    if (!ujian) {
      return NextResponse.json({ error: 'Ujian tidak ditemukan' }, { status: 404 });
    }
    
    console.log('   Total soal di ujian:', ujian.soalUjian.length);
    
    // LANGKAH 3: Ambil semua jawaban untuk sesi ini (TANPA include!)
    const jawabanList = await prisma.jawaban.findMany({
      where: { sesiId: sesiId }
      // TIDAK ADA include - ini yang membuat error sebelumnya
    });
    
    console.log('   Total jawaban tersimpan:', jawabanList.length);
    
    // LANGKAH 4: Buat map soalUjian untuk lookup cepat
    const soalUjianMap = {};
    for (const su of ujian.soalUjian) {
      soalUjianMap[su.id] = su;
    }
    
    // LANGKAH 5: Ambil semua soal yang terkait untuk cek kunci jawaban
    const soalIds = ujian.soalUjian.map(su => su.soalId);
    const soalList = await prisma.soal.findMany({
      where: { id: { in: soalIds } }
    });
    
    const soalMap = {};
    for (const s of soalList) {
      soalMap[s.id] = s;
    }
    
    // LANGKAH 6: Hitung statistik dengan mencocokkan data
    const totalSoal = ujian.soalUjian.length;
    let jawabanBenar = 0;
    let jawabanSalah = 0;
    let bobotDidapat = 0;
    
    for (const j of jawabanList) {
      const su = soalUjianMap[j.soalUjianId];
      if (!su) continue;
      
      const soal = soalMap[su.soalId];
      if (!soal) continue;
      
      const bobot = su.bobot || 1;
      const benar = j.jawaban === soal.kunciJawaban;
      
      if (benar) {
        jawabanBenar++;
        bobotDidapat += bobot;
      } else if (j.jawaban) {
        jawabanSalah++;
      }
    }
    
    const tidakDijawab = totalSoal - jawabanList.length;
    const totalBobot = ujian.soalUjian.reduce((sum, su) => sum + (su.bobot || 1), 0);
    const nilai = totalBobot > 0 ? (bobotDidapat / totalBobot) * 100 : 0;
    const statusTarget = nilai >= ujian.passingGrade ? 'lulus' : 'tidak_lulus';
    
    console.log(' Hasil:');
    console.log('   Benar:', jawabanBenar);
    console.log('   Salah:', jawabanSalah);
    console.log('   Tidak dijawab:', tidakDijawab);
    console.log('   Nilai:', nilai.toFixed(2));
    console.log('   Status:', statusTarget);
    
    // LANGKAH 7: Update status sesi
    await prisma.sesiUjian.update({
      where: { id: sesiId },
      data: {
        status: 'selesai',
        waktuSelesai: new Date()
      }
    });
    
    // LANGKAH 8: Buat hasil
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
    
    console.log('✅ Hasil ujian dibuat:', hasil.id);
    
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
    console.error('❌ Error:', e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
`;

const apiSelesaiPath = path.join(__dirname, 'app', 'api', 'peserta', 'selesai', 'route.ts');
fs.writeFileSync(apiSelesaiPath, apiSelesaiContent, 'utf8');
console.log('✅ API selesai ujian ditulis ulang (TANPA nested include)');

// ============================================
// PERBAIKI JUGA API SIMPAN JAWABAN
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
    
    // Ambil soalUjian + soal untuk cek kunci (2 query terpisah, aman)
    const soalUjian = await prisma.soalUjian.findUnique({
      where: { id: soalUjianId }
    });
    
    if (!soalUjian) {
      return NextResponse.json({ error: 'Soal tidak ditemukan' }, { status: 404 });
    }
    
    const soal = await prisma.soal.findUnique({
      where: { id: soalUjian.soalId }
    });
    
    if (!soal) {
      return NextResponse.json({ error: 'Data soal tidak ditemukan' }, { status: 404 });
    }
    
    const benar = jawaban === soal.kunciJawaban;
    
    await prisma.jawaban.upsert({
      where: {
        sesiId_soalUjianId: {
          sesiId: sesiId,
          soalUjianId: soalUjianId
        }
      },
      update: { jawaban: jawaban, benar: benar },
      create: { sesiId: sesiId, soalUjianId: soalUjianId, jawaban: jawaban, benar: benar }
    });
    
    return NextResponse.json({ success: true, benar });
  } catch (e: any) {
    console.error('Error simpan jawaban:', e);
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
`;

const apiJawabanPath = path.join(__dirname, 'app', 'api', 'peserta', 'jawaban', 'route.ts');
fs.writeFileSync(apiJawabanPath, apiJawabanContent, 'utf8');
console.log('✅ API simpan jawaban diperbaiki');

console.log('\n🎉 PERBAIKAN FINAL SELESAI!');
console.log('\n👉 LANGKAH TERAKHIR:');
console.log('   1. Restart server: Ctrl+C lalu npm run dev');
console.log('   2. Test ujian lagi, klik "Selesai"');
console.log('   3. Akan diarahkan ke halaman hasil!');