import { NextRequest, NextResponse } from 'next/server';
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
