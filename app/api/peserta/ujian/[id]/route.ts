import { NextRequest, NextResponse } from 'next/server';
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
