import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { signToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { nomorPeserta } = await req.json();
    
    if (!nomorPeserta) {
      return NextResponse.json({ error: 'Nomor peserta wajib diisi' }, { status: 400 });
    }

    const peserta = await prisma.peserta.findUnique({
      where: { nomorPeserta: nomorPeserta.trim() },
    });

    if (!peserta) {
      return NextResponse.json({ error: 'Nomor peserta tidak ditemukan' }, { status: 401 });
    }

    if (!peserta.statusAktif) {
      return NextResponse.json({ error: 'Akun peserta tidak aktif' }, { status: 403 });
    }

    const token = signToken({ 
      id: peserta.id, 
      role: 'peserta', 
      nama: peserta.namaLengkap 
    });

    const response = NextResponse.json({ success: true });
    response.cookies.set('mb_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24,
    });

    return response;
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
