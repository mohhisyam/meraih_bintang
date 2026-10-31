import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    
    const ujianId = new URL(req.url).searchParams.get('ujianId');
    const where = ujianId ? { ujianId } : {};
    
    const hasilList = await prisma.hasil.findMany({
      where,
      include: {
        peserta: true,
        ujian: true
      },
      orderBy: { nilai: 'desc' }
    });

    // Hitung ranking per ujian
    const groupedByUjian: Record<string, typeof hasilList> = {};
    hasilList.forEach(h => {
      if (!groupedByUjian[h.ujianId]) groupedByUjian[h.ujianId] = [];
      groupedByUjian[h.ujianId].push(h);
    });

    const hasilDenganRanking = hasilList.map(h => {
      const listUjian = groupedByUjian[h.ujianId];
      const rank = listUjian.findIndex(x => x.id === h.id) + 1;
      return { ...h, ranking: rank };
    });

    const ujianList = await prisma.ujian.findMany({
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ 
      data: hasilDenganRanking,
      ujian: ujianList
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 401 });
  }
}