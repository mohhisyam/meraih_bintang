'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function DetailHasilPage() {
  const params = useParams();
  const router = useRouter();
  const [hasil, setHasil] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadDetail(); }, [params.id]);

  async function loadDetail() {
    try {
      const res = await fetch('/api/peserta/hasil/' + params.id);
      const data = await res.json();
      if (res.ok) setHasil(data.data);
      else { alert(data.error); router.push('/peserta/rekap'); }
    } catch (e) { alert('Terjadi kesalahan'); } 
    finally { setLoading(false); }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center">Memuat...</div>;
  if (!hasil) return <div className="min-h-screen flex items-center justify-center">Data tidak ditemukan</div>;

  const jawabanList = hasil.sesiUjian?.jawaban || [];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-navy">Detail Hasil Ujian</h1>
            <p className="text-slate-500">{hasil.ujian.nama}</p>
          </div>
          <button onClick={() => router.push('/peserta/rekap')} className="px-4 py-2 bg-white border-2 border-slate-200 rounded-lg hover:bg-slate-50">← Kembali</button>
        </div>

        <div className="bg-white p-6 rounded-xl shadow mb-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-slate-500 text-xs mb-1">Nilai</div>
              <div className={`text-3xl font-bold ${hasil.nilai >= hasil.ujian.passingGrade ? 'text-green-600' : 'text-red-600'}`}>{hasil.nilai.toFixed(1)}</div>
            </div>
            <div className="text-center">
              <div className="text-slate-500 text-xs mb-1">Status</div>
              <div className={`text-lg font-bold ${hasil.statusTarget === 'lulus' ? 'text-green-600' : 'text-red-600'}`}>{hasil.statusTarget === 'lulus' ? 'LULUS' : 'TIDAK LULUS'}</div>
            </div>
            <div className="text-center">
              <div className="text-slate-500 text-xs mb-1">Benar</div>
              <div className="text-2xl font-bold text-green-600">{hasil.jawabanBenar}</div>
            </div>
            <div className="text-center">
              <div className="text-slate-500 text-xs mb-1">Salah</div>
              <div className="text-2xl font-bold text-red-600">{hasil.jawabanSalah}</div>
            </div>
            <div className="text-center">
              <div className="text-slate-500 text-xs mb-1">Kosong</div>
              <div className="text-2xl font-bold text-slate-400">{hasil.tidakDijawab}</div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t text-center text-sm text-slate-500">
            Passing Grade: <b>{hasil.ujian.passingGrade}%</b> | Total Soal: <b>{hasil.totalSoal}</b> | Selesai: <b>{new Date(hasil.selesaiPada).toLocaleString('id-ID')}</b>
          </div>
        </div>

        <h2 className="text-xl font-bold text-navy mb-4">Pembahasan Soal</h2>
        <div className="space-y-4">
          {jawabanList.map((j, idx) => {
            const soal = j.soalUjian?.soal;
            if (!soal) return null;
            const isBenar = j.benar === true;
            const userAnswer = j.jawaban || '-';
            const correctAnswer = soal.kunciJawaban;
            
            return (
              <div key={j.id} className={`bg-white p-6 rounded-xl shadow border-l-4 ${isBenar ? 'border-green-500' : 'border-red-500'}`}>
                <div className="flex items-start gap-3 mb-4">
                  <span className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${isBenar ? 'bg-green-500' : 'bg-red-500'}`}>{idx + 1}</span>
                  <h3 className="text-base font-medium text-slate-800 flex-1">{soal.pertanyaan}</h3>
                </div>
                <div className="space-y-2 mb-4 pl-11">
                  {['A', 'B', 'C', 'D', 'E'].map(h => {
                    const val = soal['pilihan' + h];
                    if (!val) return null;
                    const isUserAnswer = userAnswer === h;
                    const isCorrect = correctAnswer === h;
                    let bgClass = 'bg-slate-50 border-slate-200';
                    if (isUserAnswer && isCorrect) bgClass = 'bg-green-100 border-green-500 border-2';
                    else if (isUserAnswer && !isCorrect) bgClass = 'bg-red-100 border-red-500 border-2';
                    else if (isCorrect) bgClass = 'bg-green-50 border-green-300';
                    return (
                      <div key={h} className={`p-3 rounded-lg border ${bgClass}`}>
                        <span className="font-bold mr-2">{h}.</span><span>{val}</span>
                        {isCorrect && <span className="ml-2 text-green-600 font-bold text-xs">✓ KUNCI</span>}
                        {isUserAnswer && !isCorrect && <span className="ml-2 text-red-600 font-bold text-xs">✗ JAWABAN ANDA</span>}
                      </div>
                    );
                  })}
                </div>
                {soal.pembahasan && (
                  <div className="ml-11 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="text-xs font-bold text-blue-700 mb-1">PEMBAHASAN:</div>
                    <div className="text-sm text-slate-700">{soal.pembahasan}</div>
                  </div>
                )}
                <div className="ml-11 mt-3 text-xs text-slate-500">
                  Jawaban Anda: <b className={isBenar ? 'text-green-600' : 'text-red-600'}>{userAnswer}</b> | Kunci Jawaban: <b className="text-green-600">{correctAnswer}</b>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
