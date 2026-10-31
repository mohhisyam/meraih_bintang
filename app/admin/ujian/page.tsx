'use client';
import { useEffect, useState } from 'react';

// ==========================================
// HELPER: Format Tanggal ke WIB (Asia/Jakarta)
// ==========================================
function formatWIB(dateString: string | Date | null | undefined): string {
  if (!dateString) return '-';
  const date = new Date(dateString);
  
  return date.toLocaleString('id-ID', {
    timeZone: 'Asia/Jakarta', // Kunci agar selalu WIB
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
}

export default function UjianPage() {
  const [ujian, setUjian] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [kategori, setKategori] = useState<any[]>([]);

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

  async function handleSave(e: any) {
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
        alert('❌ Error: ' + result.error);
      }
    } catch (e: any) {
      alert('❌ Gagal menyimpan ujian: ' + e.message);
    } finally {
      setLoading(false);
    }
  }

  async function ubahStatus(id: string, statusBaru: string) {
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
        alert('❌ Gagal mengubah status');
      }
    } catch (e: any) {
      alert('❌ Error: ' + e.message);
    }
  }

  async function hapusUjian(id: string) {
    if (!confirm('Yakin ingin menghapus ujian ini?')) return;
    
    try {
      const res = await fetch('/api/admin/ujian/' + id, { method: 'DELETE' });
      if (res.ok) {
        alert('✅ Ujian dihapus');
        loadUjian();
      }
    } catch (e: any) {
      alert('❌ Gagal menghapus: ' + e.message);
    }
  }

  const statusColor: any = {
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
                <th className="px-4 py-3 text-left">Tanggal (WIB)</th>
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
                  
                  {/* PERBAIKAN DI SINI: Menggunakan fungsi formatWIB */}
                  <td className="px-4 py-3 text-xs whitespace-nowrap">
                    {formatWIB(u.tanggalMulai)} <br/> s/d <br/> {formatWIB(u.tanggalSelesai)}
                  </td>
                  
                  <td className="px-4 py-3 text-center">{u.durasiMenit} menit</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${statusColor[u.status] || 'bg-gray-100'}`}>
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