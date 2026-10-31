import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePeserta } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: any) {
  try {
    const peserta = await requirePeserta();
    const { id } = await params;
    
    // 1. Ambil data Hasil dulu (HAPUS include sesiUjian agar tidak error)
    const hasil = await prisma.hasil.findUnique({
      where: { id: id },
      include: {
        ujian: true
      }
    });
    
    if (!hasil || hasil.pesertaId !== peserta.id) {
      return NextResponse.json({ error: 'Hasil tidak ditemukan' }, { status: 404 });
    }
    
    // 2. Ambil data Sesi dan Jawaban secara terpisah
    const sesi = await prisma.sesiUjian.findUnique({
      where: { id: hasil.sesiId },
      include: {
        jawaban: {
          include: {
            soalUjian: { 
              include: { soal: true } 
            }
          }
        }
      }
    });

    // 3. Gabungkan datanya agar frontend tidak perlu diubah
    const dataLengkap = {
      ...hasil,
      sesiUjian: sesi
    };
    
    return NextResponse.json({ data: dataLengkap });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 401 });
  }
}