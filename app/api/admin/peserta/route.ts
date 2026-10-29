import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin, generateNomorPeserta } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const q = new URL(req.url).searchParams.get('q') || '';
    const w = q ? { OR: [{ namaLengkap: { contains: q } }, { nomorPeserta: { contains: q } }] } : {};
    const [data, total] = await Promise.all([
      prisma.peserta.findMany({ where: w, orderBy: { nomorPeserta: 'asc' } }),
      prisma.peserta.count({ where: w })
    ]);
    return NextResponse.json({ data, total });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const b = await req.json();
    if (!b.namaLengkap) throw new Error('Nama wajib diisi');
    
    const t = await prisma.peserta.count() + 1;
    let np = generateNomorPeserta(t);
    
    while (await prisma.peserta.findUnique({ where: { nomorPeserta: np } })) {
      np = generateNomorPeserta(t + Math.floor(Math.random() * 1000));
    }
    
    await prisma.peserta.create({
      data: {
        nomorPeserta: np,
        namaLengkap: b.namaLengkap.trim(),
        tempatLahir: b.tempatLahir?.trim() || null,
        tanggalLahir: b.tanggalLahir ? new Date(b.tanggalLahir) : null,
        alamat: b.alamat?.trim() || null,
        whatsapp: b.whatsapp?.trim() || null,
      }
    });
    
    return NextResponse.json({ success: true, np: np }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

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
