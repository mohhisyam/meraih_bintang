import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePeserta } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const peserta = await requirePeserta();
    
    const now = new Date();
    
    // Ambil ujian yang statusnya berlangsung ATAU terjadwal yang sudah waktunya
    const ujian = await prisma.ujian.findMany({
      where: {
        OR: [
          { status: 'berlangsung' },
          { 
            status: 'terjadwal',
            tanggalMulai: { lte: now },
            tanggalSelesai: { gte: now }
          }
        ]
      },
      include: {
        soalUjian: {
          include: { soal: true }
        }
      },
      orderBy: { tanggalMulai: 'asc' }
    });
    
    return NextResponse.json({ data: ujian });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 401 });
  }
}
