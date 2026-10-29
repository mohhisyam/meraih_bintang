'use client';
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
        <div className="flex justify-between items-center mb-6">
  <h1 className="text-3xl font-bold text-navy">Dashboard Peserta</h1>
  <a href="/peserta/rekap" className="px-4 py-2 bg-white border-2 border-navy text-navy rounded-lg font-bold hover:bg-navy hover:text-white transition">
     📊 Rekap Nilai
  </a>
</div>
        
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
