import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

// ==========================================
// HELPER: Ubah waktu database (UTC) ke WIB
// ==========================================
function formatWIB(date: Date | string | null | undefined): string | null {
  if (!date) return null;
  const d = new Date(date);
  return d.toLocaleString('id-ID', {
    timeZone: 'Asia/Jakarta',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
}

function hitungStatus(tanggalMulai: string | Date, tanggalSelesai: string | Date) {
  const now = new Date();
  const mulai = new Date(tanggalMulai);
  const selesai = new Date(tanggalSelesai);
  
  if (now < mulai) return 'terjadwal';
  if (now >= mulai && now <= selesai) return 'berlangsung';
  return 'selesai';
}

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const ujian = await prisma.ujian.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        soalUjian: {
          include: { soal: true }
        }
      }
    });

    // PERBAIKAN DI SINI: Format semua tanggal ke WIB sebelum dikirim ke frontend
    const ujianFormatted = ujian.map(u => ({
      ...u,
      tanggalMulai: formatWIB(u.tanggalMulai),
      tanggalSelesai: formatWIB(u.tanggalSelesai),
      createdAt: formatWIB(u.createdAt),
      updatedAt: formatWIB(u.updatedAt)
    }));

    return NextResponse.json({ data: ujianFormatted });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const body = await req.json();
    
    const { nama, deskripsi, tanggalMulai, tanggalSelesai, durasiMenit, kategoriIds, acakSoal, acakJawaban, passingGrade } = body;
    
    if (!nama || !tanggalMulai || !tanggalSelesai) {
      return NextResponse.json({ error: 'Nama, tanggal mulai, dan tanggal selesai wajib diisi' }, { status: 400 });
    }
    
    const status = hitungStatus(tanggalMulai, tanggalSelesai);
    
    const ujian = await prisma.ujian.create({
      data: {
        nama: nama.trim(),
        deskripsi: deskripsi?.trim() || null,
        tanggalMulai: new Date(tanggalMulai),
        tanggalSelesai: new Date(tanggalSelesai),
        durasiMenit: parseInt(durasiMenit) || 60,
        acakSoal: acakSoal || false,
        acakJawaban: acakJawaban || false,
        passingGrade: parseInt(passingGrade) || 70,
        status: status
      }
    });
    
    if (kategoriIds && kategoriIds.length > 0) {
      const soalList = await prisma.soal.findMany({
        where: { kategoriId: { in: kategoriIds } }
      });
      
      for (let i = 0; i < soalList.length; i++) {
        await prisma.soalUjian.create({
          data: {
            ujianId: ujian.id,
            soalId: soalList[i].id,
            urutan: i + 1,
            bobot: soalList[i].bobot
          }
        });
      }
    }
    
    return NextResponse.json({ success: true, ujian }, { status: 201 });
  } catch (e: any) {
    console.error('Error creating ujian:', e);
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

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