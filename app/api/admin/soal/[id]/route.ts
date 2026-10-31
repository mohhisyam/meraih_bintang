import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export async function DELETE(req: NextRequest, { params }: any) {
  try {
    await requireAdmin();
    const { id } = await params;
    
    // Hapus soal dari database
    await prisma.soal.delete({ where: { id } });
    
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}