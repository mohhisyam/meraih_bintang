'use client';
import { useEffect, useState } from 'react';

function formatWIB(dateString: string | Date | null | undefined): string {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleString('id-ID', {
    timeZone: 'Asia/Jakarta',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
}

export default function RekapHasilPage() {
  const [hasil, setHasil] = useState<any[]>([]);
  const [ujianList, setUjianList] = useState<any[]>([]);
  const [filterUjian, setFilterUjian] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHasil();
    loadUjian();
  }, [filterUjian]);

  async function loadHasil() {
    setLoading(true);
    try {
      const params = filterUjian ? `?ujianId=${filterUjian}` : '';
      const res = await fetch(`/api/admin/hasil${params}`);
      const data = await res.json();
      setHasil(data.data || []);
    } catch (e) {
      console.error('Gagal load hasil:', e);
    } finally {
      setLoading(false);
    }
  }

  async function loadUjian() {
    try {
      const res = await fetch('/api/admin/ujian');
      const data = await res.json();
      setUjianList(data.data || []);
    } catch (e) {
      console.error('Gagal load ujian:', e);
    }
  }

  const getRankBadge = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const getNilaiColor = (nilai: number) => {
    if (nilai >= 80) return 'text-green-700 bg-green-100';
    if (nilai >= 70) return 'text-blue-700 bg-blue-100';
    if (nilai >= 60) return 'text-yellow-700 bg-yellow-100';
    return 'text-red-700 bg-red-100';
  };

  const stats = {
    total: hasil.length,
    rataRata: hasil.length ? (hasil.reduce((a, b) => a + b.nilai, 0) / hasil.length).toFixed(1) : 0,
    tertinggi: hasil.length ? Math.max(...hasil.map(h => h.nilai)) : 0,
    terendah: hasil.length ? Math.min(...hasil.map(h => h.nilai)) : 0,
    lulus: hasil.filter(h => h.nilai >= 70).length,
    tidakLulus: hasil.filter(h => h.nilai < 70).length
  };

  return (
    <div className="animate-fade-in p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-navy">📊 Rekap Hasil & Ranking</h1>
      </div>

      <div className="bg-white p-5 rounded-xl shadow mb-6">
        <div className="flex flex-wrap gap-4 items-end mb-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium mb-1">Filter Ujian</label>
            <select 
              value={filterUjian}
              onChange={(e) => setFilterUjian(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="">-- Semua Ujian --</option>
              {ujianList.map(u => (
                <option key={u.id} value={u.id}>{u.nama}</option>
              ))}
            </select>
          </div>
          <button 
            onClick={loadHasil}
            className="px-4 py-2 gradient-gold text-navy rounded-lg font-bold"
          >
            🔄 Refresh
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          <div className="bg-slate-50 p-3 rounded-lg text-center">
            <div className="text-xs text-slate-500">Total Peserta</div>
            <div className="text-xl font-bold text-navy">{stats.total}</div>
          </div>
          <div className="bg-slate-50 p-3 rounded-lg text-center">
            <div className="text-xs text-slate-500">Rata-rata</div>
            <div className="text-xl font-bold text-navy">{stats.rataRata}</div>
          </div>
          <div className="bg-slate-50 p-3 rounded-lg text-center">
            <div className="text-xs text-slate-500">Tertinggi</div>
            <div className="text-xl font-bold text-green-600">{stats.tertinggi}</div>
          </div>
          <div className="bg-slate-50 p-3 rounded-lg text-center">
            <div className="text-xs text-slate-500">Terendah</div>
            <div className="text-xl font-bold text-red-600">{stats.terendah}</div>
          </div>
          <div className="bg-green-50 p-3 rounded-lg text-center">
            <div className="text-xs text-green-700">Lulus (≥70)</div>
            <div className="text-xl font-bold text-green-700">{stats.lulus}</div>
          </div>
          <div className="bg-red-50 p-3 rounded-lg text-center">
            <div className="text-xs text-red-700">Tidak Lulus</div>
            <div className="text-xl font-bold text-red-700">{stats.tidakLulus}</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Memuat data...</div>
        ) : hasil.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            Belum ada hasil ujian. {filterUjian && 'Coba ubah filter ujian.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-center">Rank</th>
                  <th className="px-4 py-3 text-left">Nama Peserta</th>
                  <th className="px-4 py-3 text-left">No. Peserta</th>
                  <th className="px-4 py-3 text-left">Ujian</th>
                  <th className="px-4 py-3 text-center">Nilai</th>
                  <th className="px-4 py-3 text-center">Benar/Salah/Kosong</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-left">Selesai</th>
                </tr>
              </thead>
              <tbody>
                {hasil.map((h, idx) => (
                  <tr key={h.id} className={`border-b hover:bg-slate-50 ${idx < 3 ? 'bg-yellow-50/30' : ''}`}>
                    <td className="px-4 py-3 text-center text-lg">
                      {getRankBadge(h.ranking)}
                    </td>
                    <td className="px-4 py-3 font-medium">{h.peserta.namaLengkap}</td>
                    <td className="px-4 py-3 text-xs">{h.peserta.nomorPeserta}</td>
                    <td className="px-4 py-3 text-xs">{h.ujian.nama}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded font-bold ${getNilaiColor(h.nilai)}`}>
                        {h.nilai.toFixed(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-xs">
                      <span className="text-green-600">{h.jawabanBenar}✓</span> / 
                      <span className="text-red-600">{h.jawabanSalah}✗</span> / 
                      <span className="text-gray-500">{h.tidakDijawab}○</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        h.nilai >= 70 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {h.nilai >= 70 ? 'LULUS' : 'TIDAK LULUS'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs">{formatWIB(h.selesaiPada)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}