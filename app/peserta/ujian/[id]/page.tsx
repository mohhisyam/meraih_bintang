'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function ExamPage() {
  const params = useParams();
  const router = useRouter();
  const [soal, setSoal] = useState([]);
  const [idx, setIdx] = useState(0);
  const [ans, setAns] = useState({});
  const [time, setTime] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sesiId, setSesiId] = useState(null);

  useEffect(() => {
    loadSoal();
  }, [params.id]);

  useEffect(() => {
    if (time > 0) {
      const timer = setInterval(() => setTime(t => t - 1), 1000);
      return () => clearInterval(timer);
    } else if (time === 0 && !loading && soal.length > 0) {
      finish();
    }
  }, [time, loading, soal.length]);

  async function loadSoal() {
    try {
      const res = await fetch('/api/peserta/ujian/' + params.id);
      const data = await res.json();
      
      if (res.ok && data.sesi) {
        setSesiId(data.sesi.id);
        setTime(data.sesi.durasiDetik || 3600);
        
        if (data.soal && data.soal.length > 0) {
          setSoal(data.soal);
        } else {
          alert('Tidak ada soal dalam ujian ini');
          router.push('/peserta/dashboard');
        }
      } else {
        alert(data.error || 'Gagal memuat ujian');
        router.push('/peserta/dashboard');
      }
    } catch (e) {
      alert('Terjadi kesalahan');
      router.push('/peserta/dashboard');
    } finally {
      setLoading(false);
    }
  }

  const save = async (soalUjianId, jawaban) => {
    setAns(p => ({ ...p, [soalUjianId]: jawaban }));
    
    try {
      await fetch('/api/peserta/jawaban', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sesiId: sesiId, soalUjianId: soalUjianId, jawaban: jawaban })
      });
    } catch (e) {
      console.error('Gagal menyimpan jawaban:', e);
    }
  };

  const finish = async () => {
    if (!confirm('Yakin ingin menyelesaikan ujian?')) return;
    
    try {
      const res = await fetch('/api/peserta/selesai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sesiId: sesiId })
      });
      
      const data = await res.json();
      
      if (res.ok && data.hasil) {
        router.push('/peserta/hasil/' + data.hasil.id);
      } else {
        alert(data.error || 'Gagal menyelesaikan ujian');
      }
    } catch (e) {
      alert('Terjadi kesalahan');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="text-center">
          <div className="text-6xl mb-4">⏳</div>
          <p className="text-lg text-slate-600">Memuat Soal...</p>
        </div>
      </div>
    );
  }

  if (!soal || soal.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="text-center">
          <div className="text-6xl mb-4"></div>
          <p className="text-lg text-slate-600">Tidak ada soal</p>
          <button onClick={() => router.push('/peserta/dashboard')} className="mt-4 px-4 py-2 gradient-gold text-navy rounded-lg font-bold">
            Kembali
          </button>
        </div>
      </div>
    );
  }

  const cur = soal[idx];
  const progress = ((idx + 1) / soal.length) * 100;

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="gradient-navy text-white p-4 sticky top-0 z-10 shadow-lg">
        <div className="max-w-3xl mx-auto flex justify-between items-center">
          <div>
            <div className="text-sm opacity-80">Soal</div>
            <div className="font-bold text-lg">{idx + 1} / {soal.length}</div>
          </div>
          <div className="text-center flex-1 mx-4">
            <div className="w-full bg-white/20 rounded-full h-2">
              <div className="bg-gold h-2 rounded-full transition-all" style={{ width: progress + '%' }}></div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm opacity-80">Sisa Waktu</div>
            <div className="font-mono font-bold text-xl bg-white/20 px-3 py-1 rounded">
              {Math.floor(time / 3600)}:{String(Math.floor((time % 3600) / 60)).padStart(2, '0')}:{String(time % 60).padStart(2, '0')}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-6">
        <div className="bg-white p-6 rounded-xl shadow-lg mb-4">
          <div className="flex items-start gap-3 mb-6">
            <span className="flex-shrink-0 w-10 h-10 gradient-gold text-navy rounded-full flex items-center justify-center font-bold">
              {idx + 1}
            </span>
            <h3 className="text-lg font-medium text-slate-800 pt-2">{cur.pertanyaan}</h3>
          </div>

          <div className="space-y-3">
            {['A', 'B', 'C', 'D', 'E'].map(h => {
              const val = cur['pilihan' + h];
              if (!val) return null;
              
              const isSelected = ans[cur.soalUjianId] === h;
              
              return (
                <button
                  key={h}
                  onClick={() => save(cur.soalUjianId, h)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                    isSelected
                      ? 'border-gold bg-gold/10 shadow-md'
                      : 'border-slate-200 hover:border-navy hover:bg-slate-50'
                  }`}
                >
                  <span className="font-bold mr-3 text-navy">{h}.</span>
                  <span className="text-slate-700">{val}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex justify-between gap-3">
          <button
            disabled={idx === 0}
            onClick={() => setIdx(i => i - 1)}
            className="flex-1 px-4 py-3 bg-white border-2 border-slate-200 rounded-lg font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            ← Sebelumnya
          </button>
          
          {idx < soal.length - 1 ? (
            <button
              onClick={() => setIdx(i => i + 1)}
              className="flex-1 px-4 py-3 gradient-gold text-navy rounded-lg font-bold hover:opacity-90 transition"
            >
              Selanjutnya →
            </button>
          ) : (
            <button
              onClick={finish}
              className="flex-1 px-4 py-3 bg-green-500 text-white rounded-lg font-bold hover:bg-green-600 transition"
            >
              ✓ Selesai
            </button>
          )}
        </div>

        <div className="mt-6 bg-white p-4 rounded-xl shadow">
          <h4 className="font-bold text-sm text-slate-600 mb-3">Navigasi Soal</h4>
          <div className="grid grid-cols-10 gap-2">
            {soal.map((s, i) => (
              <button
                key={s.soalUjianId}
                onClick={() => setIdx(i)}
                className={`w-full aspect-square rounded text-xs font-bold transition ${
                  i === idx
                    ? 'gradient-gold text-navy'
                    : ans[s.soalUjianId]
                    ? 'bg-green-100 text-green-700 border-2 border-green-300'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <div className="flex gap-4 mt-3 text-xs text-slate-600">
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-green-100 border-2 border-green-300 rounded"></div>
              <span>Sudah dijawab</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-slate-100 rounded"></div>
              <span>Belum dijawab</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
