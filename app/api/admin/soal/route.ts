import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import * as XLSX from 'xlsx';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const k = new URL(req.url).searchParams.get('k');
    return NextResponse.json({
      data: await prisma.soal.findMany({
        where: k ? { kategoriId: k } : {},
        include: { kategori: true },
        take: 50
      })
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const ct = req.headers.get('content-type') || '';
    
    if (ct.includes('multipart')) {
      // IMPORT DARI EXCEL
      const fd = await req.formData();
      const f = fd.get('file') as File;
      const buf = Buffer.from(await f.arrayBuffer());
      const wb = XLSX.read(buf, { type: 'buffer' });
      const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
      let ok = 0;
      
      for (const r of rows) {
        if (r['pertanyaan'] && r['A'] && r['kunci']) {
          // PERBAIKAN: Gunakan upsert untuk kategori (AMAN DARI ERROR UNIQUE!)
          const kategoriNama = String(r['kategori']) || 'Umum';
          const kategori = await prisma.kategoriSoal.upsert({
            where: { nama: kategoriNama },
            update: {}, // Tidak update apa-apa jika sudah ada
            create: { nama: kategoriNama }
          });
          
          await prisma.soal.create({
            data: {
              kategoriId: kategori.id,
              pertanyaan: String(r['pertanyaan']),
              pilihanA: String(r['A']),
              pilihanB: String(r['B']),
              pilihanC: String(r['C']),
              pilihanD: String(r['D']),
              pilihanE: String(r['E']),
              kunciJawaban: String(r['kunci']).toUpperCase(),
              bobot: Number(r['bobot']) || 1
            }
          });
          ok++;
        }
      }
      return NextResponse.json({ success: true, ok });
      
    } else {
      // TAMBAH SOAL MANUAL (dari form)
      const b = await req.json();
      await prisma.soal.create({
        data: {
          ...b,
          kunciJawaban: b.kunciJawaban.toUpperCase()
        }
      });
      return NextResponse.json({ success: true });
    }
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}