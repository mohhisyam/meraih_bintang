import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import * as XLSX from 'xlsx';

export async function GET() {
  try {
    await requireAdmin();
    
    // Data contoh untuk template
    const templateData = [
      {
        kategori: 'Pancasila dan UUD 1945',
        pertanyaan: 'Apa dasar negara Republik Indonesia?',
        A: 'Pancasila',
        B: 'UUD 1945',
        C: 'Bhineka Tunggal Ika',
        D: 'Garuda Pancasila',
        E: 'Merah Putih',
        kunci: 'A',
        bobot: 1
      },
      {
        kategori: 'Bahasa Indonesia',
        pertanyaan: 'Manakah kalimat efektif?',
        A: 'Para siswa-siswa sedang belajar.',
        B: 'Siswa sedang belajar di kelas.',
        C: 'Para siswa sedang belajar-belajar.',
        D: 'Siswa-siswa para sedang belajar.',
        E: 'Belajar siswa di kelas sedang.',
        kunci: 'B',
        bobot: 1
      }
    ];
    
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template Soal');
    
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename=template-soal.xlsx'
      }
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 401 });
  }
}
