const fs = require('fs');
const path = require('path');

console.log(' Memperbaiki sistem template soal...\n');

// 1. Buat API endpoint untuk download template Excel
const templateApiContent = `import { NextResponse } from 'next/server';
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
`;

const templateApiPath = path.join(__dirname, 'app', 'api', 'admin', 'soal', 'template', 'route.ts');
fs.mkdirSync(path.dirname(templateApiPath), { recursive: true });
fs.writeFileSync(templateApiPath, templateApiContent, 'utf8');
console.log('✅ API endpoint /api/admin/soal/template dibuat');

// 2. Update halaman Bank Soal dengan tombol yang benar
const soalPageContent = `'use client';
import { useEffect, useState } from 'react';

export default function SoalPage() {
  const [soal, setSoal] = useState([]);
  const [modal, setModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const res = await fetch('/api/admin/soal');
    const data = await res.json();
    setSoal(data.data || []);
  };

  useEffect(() => { load(); }, []);

  const save = async (f: any) => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/soal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(f)
      });
      const data = await res.json();
      if (data.success) {
        alert('✅ Soal berhasil ditambahkan!');
        setModal(false);
        load();
      } else {
        alert('❌ Error: ' + data.error);
      }
    } catch (e) {
      alert('❌ Gagal menyimpan soal');
    } finally {
      setLoading(false);
    }
  };

  const imp = async (file: File) => {
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/admin/soal', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.success) {
        alert(\`✅ Berhasil impor \${data.ok || 0} soal!\`);
        load();
      } else {
        alert('❌ Error: ' + data.error);
      }
    } catch (e) {
      alert('❌ Gagal mengimpor file');
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    window.open('/api/admin/soal/template', '_blank');
  };

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between mb-6">
        <h1 className="text-2xl font-bold text-navy">Bank Soal</h1>
        <div className="flex gap-2">
          <button 
            onClick={downloadTemplate} 
            className="px-4 py-2 bg-green-500 text-white rounded font-bold hover:bg-green-600"
          >
             Download Template
          </button>
          <label className="px-4 py-2 bg-blue-500 text-white rounded cursor-pointer hover:bg-blue-600">
             Impor Excel
            <input 
              type="file" 
              className="hidden" 
              accept=".xlsx,.xls"
              onChange={e => e.target.files?.[0] && imp(e.target.files[0])}
            />
          </label>
          <button 
            onClick={() => setModal(true)} 
            className="px-4 py-2 gradient-gold text-navy rounded font-bold"
          >
            ➕ Tambah Manual
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow mb-4">
        <p className="text-sm text-gray-600">
          💡 <b>Tips:</b> Download template Excel terlebih dahulu, isi soal sesuai format, lalu upload kembali.
          Pastikan kolom <b>kategori</b> sama dengan kategori yang sudah dibuat di menu Kategori Soal.
        </p>
      </div>

      <div className="space-y-4">
        {soal.length === 0 ? (
          <div className="bg-white p-8 rounded-xl shadow text-center text-gray-500">
            Belum ada soal. Silakan tambah manual atau impor dari Excel.
          </div>
        ) : soal.map((s: any, i: number) => (
          <div key={s.id} className="bg-white p-4 rounded-xl shadow">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-bold">
                {s.kategori?.nama || 'Umum'}
              </span>
              <span className="text-xs text-gray-500">Bobot: {s.bobot}</span>
            </div>
            <div className="font-bold mb-2">{i + 1}. {s.pertanyaan}</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              {['A', 'B', 'C', 'D', 'E'].map(h => {
                const val = s['pilihan' + h];
                if (!val) return null;
                return (
                  <div 
                    key={h} 
                    className={\`p-2 rounded \${s.kunciJawaban === h ? 'bg-green-100 border-2 border-green-500 font-bold' : 'bg-gray-50'}\`}
                  >
                    <b>{h}.</b> {val}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {modal && <SoalModal onClose={() => setModal(false)} onSave={save} loading={loading} />}
    </div>
  );
}

function SoalModal({ onClose, onSave, loading }: any) {
  const [f, setF] = useState({
    pertanyaan: '',
    pilihanA: '',
    pilihanB: '',
    pilihanC: '',
    pilihanD: '',
    pilihanE: '',
    kunciJawaban: 'A',
    bobot: 1,
    kategoriId: ''
  });

  const [kategori, setKategori] = useState([]);

  useEffect(() => {
    fetch('/api/admin/kategori').then(r => r.json()).then(d => setKategori(d.data || []));
  }, []);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white p-6 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <h3 className="font-bold text-navy text-lg mb-4">Tambah Soal Manual</h3>
        
        <div className="space-y-3">
          <select 
            value={f.kategoriId} 
            onChange={e => setF({ ...f, kategoriId: e.target.value })}
            className="w-full border p-2 rounded"
          >
            <option value="">-- Pilih Kategori --</option>
            {kategori.map((k: any) => (
              <option key={k.id} value={k.id}>{k.nama}</option>
            ))}
          </select>

          <textarea 
            className="w-full border p-2 rounded" 
            placeholder="Pertanyaan" 
            value={f.pertanyaan} 
            onChange={e => setF({ ...f, pertanyaan: e.target.value })}
            rows={3}
          />

          {['A', 'B', 'C', 'D', 'E'].map(h => (
            <input 
              key={h} 
              className="w-full border p-2 rounded" 
              placeholder={\`Pilihan \${h}\`} 
              value={(f as any)['pilihan' + h]} 
              onChange={e => setF({ ...f, ['pilihan' + h]: e.target.value })}
            />
          ))}

          <div className="grid grid-cols-2 gap-2">
            <select 
              value={f.kunciJawaban} 
              onChange={e => setF({ ...f, kunciJawaban: e.target.value })}
              className="border p-2 rounded"
            >
              {['A', 'B', 'C', 'D', 'E'].map(h => (
                <option key={h} value={h}>Kunci: {h}</option>
              ))}
            </select>
            <input 
              type="number" 
              className="border p-2 rounded" 
              placeholder="Bobot" 
              value={f.bobot} 
              onChange={e => setF({ ...f, bobot: parseInt(e.target.value) || 1 })}
            />
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <button 
            onClick={onClose} 
            className="flex-1 py-2 border rounded hover:bg-gray-50"
            disabled={loading}
          >
            Batal
          </button>
          <button 
            onClick={() => onSave(f)} 
            className="flex-1 py-2 gradient-gold text-navy rounded font-bold disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </div>
    </div>
  );
}
`;

const soalPagePath = path.join(__dirname, 'app', 'admin', 'soal', 'page.tsx');
fs.writeFileSync(soalPagePath, soalPageContent, 'utf8');
console.log('✅ app/admin/soal/page.tsx diperbaiki dengan tombol Download Template yang benar');

console.log('\n🎉 Perbaikan selesai!');
console.log('👉 Tekan Ctrl+C di terminal, lalu jalankan: npm run dev');
console.log('👉 Buka halaman Bank Soal, klik tombol "📥 Download Template" untuk mendapat file Excel');