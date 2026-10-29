import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin, hashPassword, generatePin } from '@/lib/auth';

export async function PUT(req: NextRequest, { params }: any) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await req.json();
    const peserta = await prisma.peserta.update({
      where: { id },
      data: {
        namaLengkap: body.namaLengkap?.trim(),
        tempatLahir: body.tempatLahir?.trim() || null,
        tanggalLahir: body.tanggalLahir ? new Date(body.tanggalLahir) : null,
        alamat: body.alamat?.trim() || null,
        whatsapp: body.whatsapp?.trim() || null,
        statusAktif: typeof body.statusAktif === 'boolean' ? body.statusAktif : undefined,
      }
    });
    return NextResponse.json({ success: true, peserta });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: any) {
  try {
    await requireAdmin();
    const { id } = await params;
    await prisma.peserta.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

export async function PATCH(req: NextRequest, { params }: any) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await req.json();
    const { action } = body;

    if (action === 'reset-pin') {
      const pin = generatePin();
      const pinHash = await hashPassword(pin);
      
      await prisma.peserta.update({
        where: { id },
        data: { pinHash, pinPlain: pin, pinHarusGanti: true }
      });
      
      return NextResponse.json({ success: true, pin });
    }

    return NextResponse.json({ error: 'Action tidak valid' }, { status: 400 });
  } catch (error: any) {
    console.error('Error PATCH:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
