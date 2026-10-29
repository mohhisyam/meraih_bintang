import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export async function PATCH(req: NextRequest, { params }: any) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await req.json();
    const { status } = body;
    
    const validStatus = ['draft', 'terjadwal', 'berlangsung', 'selesai', 'ditutup'];
    if (!validStatus.includes(status)) {
      return NextResponse.json({ error: 'Status tidak valid' }, { status: 400 });
    }
    
    const ujian = await prisma.ujian.update({
      where: { id },
      data: { status }
    });
    
    return NextResponse.json({ success: true, ujian });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: any) {
  try {
    await requireAdmin();
    const { id } = await params;
    await prisma.ujian.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
