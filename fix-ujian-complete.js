const fs = require('fs');
const path = require('path');

console.log('🔧 Memperbaiki sistem ujian secara lengkap...\n');

// ============================================
// 1. API ENDPOINT UJIAN (POST & GET)
// ============================================
const apiUjianContent = `import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

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
    
    // Buat ujian
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
        status: 'draft'
      }
    });
    
    // Tambahkan soal dari kategori yang dipilih
    if (kategoriIds && kategoriIds.length > 0) {
      const soalList = await prisma.soal.findMany({
        where: {
          kategoriId: { in: kategoriIds }
        }
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
`;

const apiUjianPath = path.join(__dirname, 'app', 'api', 'admin', 'ujian', 'route.ts');
fs.mkdirSync(path.dirname(apiUjianPath), { recursive: true });
fs.writeFileSync(apiUjianPath, apiUjianContent, 'utf8');
console.log('✅ API endpoint ujian dibuat');

// ============================================
// 2. HALAMAN UJIAN ADMIN
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
        alert('✅ Ujian berhasil dibuat!');
        setShowModal(false);
        loadUjian();
      } else {
        alert('❌ Error: ' + result.error);
      }
    } catch (e) {
      alert('❌ Gagal menyimpan ujian');
    } finally {
      setLoading(false);
    }
  }

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
          <div className="p-8 text-center text-slate-500">Belum ada ujian. Klik "Buat Ujian" untuk memulai.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left">Nama Ujian</th>
                <th className="px-4 py-3 text-left">Tanggal</th>
                <th className="px-4 py-3 text-center">Durasi</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">Soal</th>
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
                    <span className={\`px-2 py-1 rounded text-xs font-bold \${
                      u.status === 'berlangsung' ? 'bg-green-100 text-green-700' :
                      u.status === 'terjadwal' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }\`}>
                      {u.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">{u.soalUjian?.length || 0} soal</td>
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
                <textarea name="deskripsi" rows={2} className="w-full px-3 py-2 border rounded-lg" placeholder="Deskripsi ujian (opsional)" />
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
fs.mkdirSync(path.dirname(ujianPagePath), { recursive: true });
fs.writeFileSync(ujianPagePath, ujianPageContent, 'utf8');
console.log('✅ Halaman ujian admin ditulis ulang');

// ============================================
// 3. API UNTUK PESERTA LIHAT UJIAN
// ============================================
const apiUjianPesertaContent = `import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePeserta } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const peserta = await requirePeserta();
    
    const now = new Date();
    
    const ujian = await prisma.ujian.findMany({
      where: {
        status: { in: ['terjadwal', 'berlangsung'] },
        tanggalMulai: { lte: now },
        tanggalSelesai: { gte: now }
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
console.log('✅ API ujian untuk peserta dibuat');

// ============================================
// 4. HALAMAN DASHBOARD PESERTA (TAMPILKAN UJIAN)
// ============================================
const dashboardPesertaContent = `'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardPeserta() {
  const [ujian, setUjian] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadUjian();
  }, []);

  async function loadUjian() {
    try {
      const res = await fetch('/api/peserta/ujian');
      const data = await res.json();
      setUjian(data.data || []);
    } catch (e) {
      console.error('Gagal load ujian:', e);
    } finally {
      setLoading(false);
    }
  }

  function mulaiUjian(ujianId) {
    router.push('/peserta/ujian/' + ujianId);
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-navy mb-6">Dashboard Peserta</h1>
        
        {loading ? (
          <div className="text-center py-12">Memuat...</div>
        ) : ujian.length === 0 ? (
          <div className="bg-white p-8 rounded-xl shadow text-center">
            <div className="text-6xl mb-4">📝</div>
            <h2 className="text-xl font-bold text-navy mb-2">Belum Ada Ujian Tersedia</h2>
            <p className="text-slate-500">Tidak ada ujian yang sedang berlangsung saat ini.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {ujian.map(u => (
              <div key={u.id} className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-xl font-bold text-navy">{u.nama}</h3>
                    {u.deskripsi && <p className="text-sm text-slate-500 mt-1">{u.deskripsi}</p>}
                  </div>
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                    Berlangsung
                  </span>
                </div>
                
                <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
                  <div>
                    <div className="text-slate-500">Jumlah Soal</div>
                    <div className="font-bold text-navy">{u.soalUjian?.length || 0} soal</div>
                  </div>
                  <div>
                    <div className="text-slate-500">Durasi</div>
                    <div className="font-bold text-navy">{u.durasiMenit} menit</div>
                  </div>
                  <div>
                    <div className="text-slate-500">Passing Grade</div>
                    <div className="font-bold text-navy">{u.passingGrade}%</div>
                  </div>
                </div>
                
                <button 
                  onClick={() => mulaiUjian(u.id)}
                  className="w-full py-3 gradient-gold text-navy font-bold rounded-lg hover:opacity-90 transition"
                >
                  Mulai Ujian
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
`;

const dashboardPesertaPath = path.join(__dirname, 'app', 'peserta', 'dashboard', 'page.tsx');
fs.mkdirSync(path.dirname(dashboardPesertaPath), { recursive: true });
fs.writeFileSync(dashboardPesertaPath, dashboardPesertaContent, 'utf8');
console.log('✅ Dashboard peserta ditulis ulang dengan daftar ujian');

console.log('\n🎉 PERBAIKAN SELESAI!');
console.log('👉 Restart server: Ctrl+C lalu npm run dev');
console.log('👉 Buka http://localhost:3000/admin/ujian');
console.log('👉 Buat ujian baru, tombol Simpan akan berfungsi!');