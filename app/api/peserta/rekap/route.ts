import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePeserta } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const peserta = await requirePeserta();
    
    const hasilList = await prisma.hasil.findMany({
      where: { pesertaId: peserta.id },
      include: { ujian: true },
      orderBy: { selesaiPada: 'desc' }
    });
    
    const totalUjian = hasilList.length;
    const totalLulus = hasilList.filter(h => h.statusTarget === 'lulus').length;
    const rataRata = hasilList.length > 0 
      ? hasilList.reduce((sum, h) => sum + h.nilai, 0) / hasilList.length 
      : 0;
    
    return NextResponse.json({
      data: hasilList,
      statistik: {
        totalUjian,
        totalLulus,
        totalTidakLulus: totalUjian - totalLulus,
        rataRata: Math.round(rataRata * 100) / 100
      }
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 401 });
  }
}
