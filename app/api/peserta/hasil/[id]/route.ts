import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePeserta } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: any) {
  try {
    const peserta = await requirePeserta();
    const { id } = await params;
    
    const hasil = await prisma.hasil.findUnique({
      where: { id: id },
      include: {
        ujian: true,
        sesiUjian: {
          include: {
            jawaban: {
              include: {
                soalUjian: { include: { soal: true } }
              }
            }
          }
        }
      }
    });
    
    if (!hasil || hasil.pesertaId !== peserta.id) {
      return NextResponse.json({ error: 'Hasil tidak ditemukan' }, { status: 404 });
    }
    
    return NextResponse.json({ data: hasil });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 401 });
  }
}
