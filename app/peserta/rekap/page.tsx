'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RekapPage() {
  const [hasil, setHasil] = useState([]);
  const [statistik, setStatistik] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => { loadRekap(); }, []);

  async function loadRekap() {
    try {
      const res = await fetch('/api/peserta/rekap');
      const data = await res.json();
      if (res.ok) {
        setHasil(data.data || []);
        setStatistik(data.statistik);
      }
    } catch (e) { console.error('Gagal load rekap:', e); } 
    finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-navy">Rekap Nilai</h1>
            <p className="text-slate-500">Ringkasan hasil try out Anda</p>
          </div>
          <button onClick={() => router.push('/peserta/dashboard')} className="px-4 py-2 bg-white border-2 border-slate-200 rounded-lg hover:bg-slate-50">
            ← Kembali
          </button>
        </div>

        {loading ? <div className="text-center py-12">Memuat data...</div> : (
          <>
            {statistik && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white p-5 rounded-xl shadow">
                  <div className="text-slate-500 text-sm mb-1">Total Ujian</div>
                  <div className="text-3xl font-bold text-navy">{statistik.totalUjian}</div>
                </div>
                <div className="bg-white p-5 rounded-xl shadow">
                  <div className="text-slate-500 text-sm mb-1">Lulus</div>
                  <div className="text-3xl font-bold text-green-600">{statistik.totalLulus}</div>
                </div>
                <div className="bg-white p-5 rounded-xl shadow">
                  <div className="text-slate-500 text-sm mb-1">Tidak Lulus</div>
                  <div className="text-3xl font-bold text-red-600">{statistik.totalTidakLulus}</div>
                </div>
                <div className="bg-white p-5 rounded-xl shadow">
                  <div className="text-slate-500 text-sm mb-1">Rata-rata</div>
                  <div className="text-3xl font-bold text-yellow-600">{statistik.rataRata.toFixed(1)}</div>
                </div>
              </div>
            )}

            {hasil.length === 0 ? (
              <div className="bg-white p-12 rounded-xl shadow text-center">
                <div className="text-6xl mb-4"></div>
                <h2 className="text-xl font-bold text-navy mb-2">Belum Ada Hasil Ujian</h2>
                <p className="text-slate-500 mb-4">Anda belum pernah mengerjakan try out.</p>
                <button onClick={() => router.push('/peserta/dashboard')} className="px-6 py-2 gradient-gold text-navy rounded-lg font-bold">Mulai Try Out</button>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left">Nama Ujian</th>
                      <th className="px-4 py-3 text-center">Tanggal</th>
                      <th className="px-4 py-3 text-center">Benar/Salah</th>
                      <th className="px-4 py-3 text-center">Nilai</th>
                      <th className="px-4 py-3 text-center">Status</th>
                      <th className="px-4 py-3 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hasil.map(h => (
                      <tr key={h.id} className="border-b hover:bg-slate-50">
                        <td className="px-4 py-3 font-medium">{h.ujian.nama}</td>
                        <td className="px-4 py-3 text-center text-xs">{new Date(h.selesaiPada).toLocaleDateString('id-ID')}</td>
                        <td className="px-4 py-3 text-center">
                          <span className="text-green-600 font-bold">{h.jawabanBenar}</span>
                          <span className="text-slate-400"> / </span>
                          <span className="text-red-600 font-bold">{h.jawabanSalah + h.tidakDijawab}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`text-lg font-bold ${h.nilai >= h.ujian.passingGrade ? 'text-green-600' : 'text-red-600'}`}>{h.nilai.toFixed(1)}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${h.statusTarget === 'lulus' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {h.statusTarget === 'lulus' ? 'LULUS' : 'TIDAK LULUS'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button onClick={() => router.push('/peserta/hasil/' + h.id)} className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-xs font-bold hover:bg-blue-200">Lihat Detail</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
