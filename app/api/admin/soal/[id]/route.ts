import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export async function DELETE(req: NextRequest, { params }: any) {
  try {
    await requireAdmin();
    const { id } = await params;
    
    // 1. Cari semua SoalUjian yang terkait dengan soal ini
    const soalUjianList = await prisma.soalUjian.findMany({
      where: { soalId: id }
    });
    
    // 2. Hapus semua Jawaban yang terkait dengan SoalUjian tersebut
    if (soalUjianList.length > 0) {
      const soalUjianIds = soalUjianList.map(su => su.id);
      await prisma.jawaban.deleteMany({
        where: { soalUjianId: { in: soalUjianIds } }
      });
    }
    
    // 3. Hapus semua SoalUjian yang terkait
    await prisma.soalUjian.deleteMany({
      where: { soalId: id }
    });
    
    // 4. Baru hapus soal itu sendiri
    await prisma.soal.delete({ where: { id } });
    
    return NextResponse.json({ 
      success: true, 
      message: 'Soal dan data terkait berhasil dihapus' 
    });
  } catch (e: any) {
    console.error('Error hapus soal:', e);
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}