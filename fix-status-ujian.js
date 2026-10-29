const fs = require('fs');
const path = require('path');

console.log('🔧 Memperbaiki sistem status ujian...\n');

// ============================================
// 1. UPDATE API UJIAN ADMIN - Auto Status + PATCH
// ============================================
const apiUjianContent = `import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

function hitungStatus(tanggalMulai, tanggalSelesai) {
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
    return NextResponse.json({ data: ujian });
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
    
    // Hitung status otomatis berdasarkan tanggal
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
`;

const apiUjianPath = path.join(__dirname, 'app', 'api', 'admin', 'ujian', 'route.ts');
fs.mkdirSync(path.dirname(apiUjianPath), { recursive: true });
fs.writeFileSync(apiUjianPath, apiUjianContent, 'utf8');
console.log('✅ API ujian admin diupdate (auto status + PATCH)');

// ============================================
// 2. UPDATE HALAMAN UJIAN ADMIN - Tambah Tombol Status
// ============================================
const ujianPageContent = `'use client';
import { useEffect, useState } from 'react';

export default function UjianPage() {
  const [ujian, setUjian] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [kategori, setKategori] = useState([]);

  useEffect(() => {
    loadUjian();
    loadKategori();
  }, []);

  async function loadUjian() {
    try {
      const res = await fetch('/api/admin/ujian');
      const data = await res.json();
      setUjian(data.data || []);
    } catch (e) {
      console.error('Gagal load ujian:', e);
    }
  }

  async function loadKategori() {
    try {
      const res = await fetch('/api/admin/kategori');
      const data = await res.json();
      setKategori(data.data || []);
    } catch (e) {
      console.error('Gagal load kategori:', e);
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    setLoading(true);
    
    const formData = new FormData(e.target);
    const kategoriIds = Array.from(formData.getAll('kategori'));
    
    const data = {
      nama: formData.get('nama'),
      deskripsi: formData.get('deskripsi'),
      tanggalMulai: formData.get('tanggalMulai'),
      tanggalSelesai: formData.get('tanggalSelesai'),
      durasiMenit: formData.get('durasiMenit') || 60,
      kategoriIds: kategoriIds,
      acakSoal: formData.get('acakSoal') === 'on',
      acakJawaban: formData.get('acakJawaban') === 'on',
      passingGrade: formData.get('passingGrade') || 70
    };
    
    try {
      const res = await fetch('/api/admin/ujian', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      const result = await res.json();
      
      if (res.ok) {
        alert('✅ Ujian berhasil dibuat dengan status: ' + result.ujian.status);
        setShowModal(false);
        e.target.reset();
        loadUjian();
      } else {
        alert(' Error: ' + result.error);
      }
    } catch (e) {
      alert(' Gagal menyimpan ujian');
    } finally {
      setLoading(false);
    }
  }

  async function ubahStatus(id, statusBaru) {
    if (!confirm('Ubah status ujian menjadi "' + statusBaru + '"?')) return;
    
    try {
      const res = await fetch('/api/admin/ujian/' + id, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: statusBaru })
      });
      
      if (res.ok) {
        alert('✅ Status berhasil diubah!');
        loadUjian();
      } else {
        alert(' Gagal mengubah status');
      }
    } catch (e) {
      alert('❌ Error: ' + e.message);
    }
  }

  async function hapusUjian(id) {
    if (!confirm('Yakin ingin menghapus ujian ini?')) return;
    
    try {
      const res = await fetch('/api/admin/ujian/' + id, { method: 'DELETE' });
      if (res.ok) {
        alert('✅ Ujian dihapus');
        loadUjian();
      }
    } catch (e) {
      alert(' Gagal menghapus');
    }
  }

  const statusColor = {
    draft: 'bg-gray-100 text-gray-700',
    terjadwal: 'bg-blue-100 text-blue-700',
    berlangsung: 'bg-green-100 text-green-700',
    selesai: 'bg-purple-100 text-purple-700',
    ditutup: 'bg-red-100 text-red-700'
  };

  return (
    <div className="animate-fade-in p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-navy">Pengaturan Ujian</h1>
        <button 
          onClick={() => setShowModal(true)} 
          className="px-4 py-2 gradient-gold text-navy rounded-lg font-bold"
        >
          + Buat Ujian
        </button>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        {ujian.length === 0 ? (
          <div className="p-8 text-center text-slate-500">Belum ada ujian.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left">Nama Ujian</th>
                <th className="px-4 py-3 text-left">Tanggal</th>
                <th className="px-4 py-3 text-center">Durasi</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">Soal</th>
                <th className="px-4 py-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {ujian.map(u => (
                <tr key={u.id} className="border-b hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium">{u.nama}</td>
                  <td className="px-4 py-3 text-xs">
                    {new Date(u.tanggalMulai).toLocaleString('id-ID')} - {new Date(u.tanggalSelesai).toLocaleString('id-ID')}
                  </td>
                  <td className="px-4 py-3 text-center">{u.durasiMenit} menit</td>
                  <td className="px-4 py-3 text-center">
                    <span className={\`px-2 py-1 rounded text-xs font-bold \${statusColor[u.status] || 'bg-gray-100'}\`}>
                      {u.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">{u.soalUjian?.length || 0} soal</td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex gap-1 justify-center flex-wrap">
                      {u.status !== 'berlangsung' && (
                        <button 
                          onClick={() => ubahStatus(u.id, 'berlangsung')}
                          className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-bold hover:bg-green-200"
                        >
                          Aktifkan
                        </button>
                      )}
                      {u.status !== 'selesai' && (
                        <button 
                          onClick={() => ubahStatus(u.id, 'selesai')}
                          className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-bold hover:bg-purple-200"
                        >
                          Selesai
                        </button>
                      )}
                      <button 
                        onClick={() => hapusUjian(u.id)}
                        className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-bold hover:bg-red-200"
                      >
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-navy mb-4">Buat Ujian</h2>
            
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nama Ujian *</label>
                <input name="nama" required className="w-full px-3 py-2 border rounded-lg" placeholder="Contoh: Try Out 1" />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Deskripsi</label>
                <textarea name="deskripsi" rows={2} className="w-full px-3 py-2 border rounded-lg" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Tanggal Mulai *</label>
                  <input type="datetime-local" name="tanggalMulai" required className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Tanggal Selesai *</label>
                  <input type="datetime-local" name="tanggalSelesai" required className="w-full px-3 py-2 border rounded-lg" />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Durasi (menit)</label>
                  <input type="number" name="durasiMenit" defaultValue={60} min={1} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Passing Grade (%)</label>
                  <input type="number" name="passingGrade" defaultValue={70} min={0} max={100} className="w-full px-3 py-2 border rounded-lg" />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Kategori Soal *</label>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border p-3 rounded-lg">
                  {kategori.map(k => (
                    <label key={k.id} className="flex items-center gap-2">
                      <input type="checkbox" name="kategori" value={k.id} className="rounded" />
                      <span className="text-sm">{k.nama}</span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-slate-500 mt-1">Semua soal dari kategori yang dipilih akan masuk ke ujian</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <label className="flex items-center gap-2">
                  <input type="checkbox" name="acakSoal" className="rounded" />
                  <span className="text-sm">Acak urutan soal</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" name="acakJawaban" className="rounded" />
                  <span className="text-sm">Acak urutan jawaban</span>
                </label>
              </div>
              
              <div className="flex gap-2 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2 border rounded-lg hover:bg-gray-50">
                  Batal
                </button>
                <button type="submit" disabled={loading} className="flex-1 py-2 gradient-gold text-navy rounded-lg font-bold disabled:opacity-50">
                  {loading ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
`;

const ujianPagePath = path.join(__dirname, 'app', 'admin', 'ujian', 'page.tsx');
fs.writeFileSync(ujianPagePath, ujianPageContent, 'utf8');
console.log('✅ Halaman ujian admin diupdate dengan tombol status');

// ============================================
// 3. UPDATE API UJIAN [id] ROUTE
// ============================================
const apiUjianIdContent = `import { NextRequest, NextResponse } from 'next/server';
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
`;

const apiUjianIdPath = path.join(__dirname, 'app', 'api', 'admin', 'ujian', '[id]', 'route.ts');
fs.mkdirSync(path.dirname(apiUjianIdPath), { recursive: true });
fs.writeFileSync(apiUjianIdPath, apiUjianIdContent, 'utf8');
console.log('✅ API ujian [id] dibuat (PATCH & DELETE)');

// ============================================
// 4. UPDATE API UJIAN PESERTA - Tambah fallback
// ============================================
const apiUjianPesertaContent = `import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePeserta } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const peserta = await requirePeserta();
    
    const now = new Date();
    
    // Ambil ujian yang statusnya berlangsung ATAU terjadwal yang sudah waktunya
    const ujian = await prisma.ujian.findMany({
      where: {
        OR: [
          { status: 'berlangsung' },
          { 
            status: 'terjadwal',
            tanggalMulai: { lte: now },
            tanggalSelesai: { gte: now }
          }
        ]
      },
      include: {
        soalUjian: {
          include: { soal: true }
        }
      },
      orderBy: { tanggalMulai: 'asc' }
    });
    
    return NextResponse.json({ data: ujian });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 401 });
  }
}
`;

const apiUjianPesertaPath = path.join(__dirname, 'app', 'api', 'peserta', 'ujian', 'route.ts');
fs.mkdirSync(path.dirname(apiUjianPesertaPath), { recursive: true });
fs.writeFileSync(apiUjianPesertaPath, apiUjianPesertaContent, 'utf8');
console.log('✅ API ujian peserta diupdate dengan fallback');

console.log('\n🎉 PERBAIKAN STATUS UJIAN SELESAI!');
console.log('\n👉 LANGKAH SELANJUTNYA:');
console.log('   1. Restart server: Ctrl+C lalu npm run dev');
console.log('   2. Buka http://localhost:3000/admin/ujian');
console.log('   3. Klik tombol "Aktifkan" di ujian "Uji Coba"');
console.log('   4. Status akan berubah jadi "berlangsung" (hijau)');
console.log('   5. Login sebagai peserta → ujian akan muncul!');