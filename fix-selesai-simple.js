const fs = require('fs');
const path = require('path');

console.log('🔧 Memperbaiki API selesai ujian dengan query sederhana...\n');

// ============================================
// API SELESAI UJIAN - VERSI SEDERHANA
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
    
    // LANGKAH 1: Cek sesi ada dan milik peserta ini
    const sesi = await prisma.sesiUjian.findFirst({
      where: {
        id: sesiId,
        pesertaId: peserta.id
      }
    });
    
    if (!sesi) {
      console.log('❌ Sesi tidak ditemukan untuk peserta ini');
      return NextResponse.json({ error: 'Sesi ujian tidak ditemukan' }, { status: 404 });
    }
    
    if (sesi.status === 'selesai') {
      console.log('⚠️ Ujian sudah selesai sebelumnya');
      return NextResponse.json({ error: 'Ujian sudah selesai' }, { status: 400 });
    }
    
    console.log('✅ Sesi ditemukan, status:', sesi.status);
    
    // LANGKAH 2: Ambil data ujian (terpisah)
    const ujian = await prisma.ujian.findUnique({
      where: { id: sesi.ujianId },
      include: {
        soalUjian: {
          include: {
            soal: true
          }
        }
      }
    });
    
    if (!ujian) {
      return NextResponse.json({ error: 'Ujian tidak ditemukan' }, { status: 404 });
    }
    
    console.log(' Total soal:', ujian.soalUjian.length);
    
    // LANGKAH 3: Ambil semua jawaban untuk sesi ini (terpisah)
    const jawabanList = await prisma.jawaban.findMany({
      where: { sesiId: sesiId },
      include: {
        soalUjian: {
          include: {
            soal: true
          }
        }
      }
    });
    
    console.log('📝 Total jawaban tersimpan:', jawabanList.length);
    
    // LANGKAH 4: Hitung statistik
    const totalSoal = ujian.soalUjian.length;
    const jawabanBenar = jawabanList.filter(j => j.benar === true).length;
    const jawabanSalah = jawabanList.filter(j => j.jawaban && j.benar === false).length;
    const tidakDijawab = totalSoal - jawabanList.length;
    
    // Hitung bobot
    const totalBobot = ujian.soalUjian.reduce((sum, su) => sum + (su.bobot || 1), 0);
    const bobotDidapat = jawabanList
      .filter(j => j.benar === true)
      .reduce((sum, j) => sum + (j.soalUjian?.bobot || 1), 0);
    
    // Hitung nilai
    const nilai = totalBobot > 0 ? (bobotDidapat / totalBobot) * 100 : 0;
    const statusTarget = nilai >= ujian.passingGrade ? 'lulus' : 'tidak_lulus';
    
    console.log('📊 Hasil Perhitungan:');
    console.log('   Benar:', jawabanBenar);
    console.log('   Salah:', jawabanSalah);
    console.log('   Tidak dijawab:', tidakDijawab);
    console.log('   Nilai:', nilai.toFixed(2));
    console.log('   Status:', statusTarget);
    
    // LANGKAH 5: Update status sesi
    await prisma.sesiUjian.update({
      where: { id: sesiId },
      data: {
        status: 'selesai',
        waktuSelesai: new Date()
      }
    });
    
    console.log('✅ Status sesi diupdate ke "selesai"');
    
    // LANGKAH 6: Buat hasil ujian
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
    console.error('❌ Error di API selesai:');
    console.error('   Message:', e.message);
    console.error('   Code:', e.code);
    console.error('   Meta:', e.meta);
    return NextResponse.json({ 
      error: e.message,
      code: e.code,
      details: 'Terjadi kesalahan saat memproses hasil ujian'
    }, { status: 500 });
  }
}
`;

const apiSelesaiPath = path.join(__dirname, 'app', 'api', 'peserta', 'selesai', 'route.ts');
fs.mkdirSync(path.dirname(apiSelesaiPath), { recursive: true });
fs.writeFileSync(apiSelesaiPath, apiSelesaiContent, 'utf8');
console.log('✅ API selesai ujian ditulis ulang dengan query sederhana');

console.log('\n🎉 PERBAIKAN SELESAI!');
console.log('\n👉 LANGKAH SELANJUTNYA:');
console.log('   1. Restart server: Ctrl+C lalu npm run dev');
console.log('   2. Buka terminal lain, jalankan ujian lagi');
console.log('   3. Lihat log di terminal untuk debug info');
console.log('   4. Klik "Selesai" - sekarang akan berfungsi!');