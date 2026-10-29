const fs = require('fs');
const path = require('path');

console.log('🔧 Memperbaiki halaman ujian peserta...\n');

// ============================================
// 1. HALAMAN UJIAN PESERTA [id]/page.tsx
// ============================================
const examPageContent = `'use client';
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
                  className={\`w-full text-left p-4 rounded-lg border-2 transition-all \${
                    isSelected
                      ? 'border-gold bg-gold/10 shadow-md'
                      : 'border-slate-200 hover:border-navy hover:bg-slate-50'
                  }\`}
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
                className={\`w-full aspect-square rounded text-xs font-bold transition \${
                  i === idx
                    ? 'gradient-gold text-navy'
                    : ans[s.soalUjianId]
                    ? 'bg-green-100 text-green-700 border-2 border-green-300'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }\`}
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
`;

const examPagePath = path.join(__dirname, 'app', 'peserta', 'ujian', '[id]', 'page.tsx');
fs.mkdirSync(path.dirname(examPagePath), { recursive: true });
fs.writeFileSync(examPagePath, examPageContent, 'utf8');
console.log('✅ Halaman ujian peserta [id]/page.tsx ditulis ulang');

// ============================================
// 2. API GET SOAL UJIAN UNTUK PESERTA
// ============================================
const apiSoalUjianContent = `import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePeserta, generateToken } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: any) {
  try {
    const peserta = await requirePeserta();
    const { id } = await params;
    
    const ujian = await prisma.ujian.findUnique({
      where: { id: id },
      include: {
        soalUjian: {
          include: {
            soal: true
          },
          orderBy: { urutan: 'asc' }
        }
      }
    });
    
    if (!ujian) {
      return NextResponse.json({ error: 'Ujian tidak ditemukan' }, { status: 404 });
    }
    
    if (ujian.status !== 'berlangsung' && ujian.status !== 'terjadwal') {
      return NextResponse.json({ error: 'Ujian tidak tersedia' }, { status: 403 });
    }
    
    const now = new Date();
    if (now < new Date(ujian.tanggalMulai) || now > new Date(ujian.tanggalSelesai)) {
      return NextResponse.json({ error: 'Ujian belum atau sudah berakhir' }, { status: 403 });
    }
    
    let sesi = await prisma.sesiUjian.findFirst({
      where: {
        pesertaId: peserta.id,
        ujianId: ujian.id,
        status: 'aktif'
      }
    });
    
    if (!sesi) {
      const token = generateToken();
      sesi = await prisma.sesiUjian.create({
        data: {
          pesertaId: peserta.id,
          ujianId: ujian.id,
          token: token,
          durasiDetik: ujian.durasiMenit * 60,
          ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
          userAgent: req.headers.get('user-agent') || 'unknown'
        }
      });
    }
    
    let soalList = ujian.soalUjian.map(su => ({
      soalUjianId: su.id,
      soalId: su.soalId,
      pertanyaan: su.soal.pertanyaan,
      pilihanA: su.soal.pilihanA,
      pilihanB: su.soal.pilihanB,
      pilihanC: su.soal.pilihanC,
      pilihanD: su.soal.pilihanD,
      pilihanE: su.soal.pilihanE,
      gambar: su.soal.gambar
    }));
    
    if (ujian.acakSoal) {
      soalList = soalList.sort(() => Math.random() - 0.5);
    }
    
    return NextResponse.json({
      sesi: {
        id: sesi.id,
        durasiDetik: sesi.durasiDetik
      },
      soal: soalList
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 401 });
  }
}
`;

const apiSoalUjianPath = path.join(__dirname, 'app', 'api', 'peserta', 'ujian', '[id]', 'route.ts');
fs.mkdirSync(path.dirname(apiSoalUjianPath), { recursive: true });
fs.writeFileSync(apiSoalUjianPath, apiSoalUjianContent, 'utf8');
console.log('✅ API soal ujian peserta [id] dibuat');

// ============================================
// 3. API SIMPAN JAWABAN
// ============================================
const apiJawabanContent = `import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePeserta } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    await requirePeserta();
    const { sesiId, soalUjianId, jawaban } = await req.json();
    
    if (!sesiId || !soalUjianId) {
      return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 });
    }
    
    const sesi = await prisma.sesiUjian.findUnique({
      where: { id: sesiId },
      include: {
        ujian: {
          include: {
            soalUjian: {
              where: { id: soalUjianId },
              include: { soal: true }
            }
          }
        }
      }
    });
    
    if (!sesi || sesi.status !== 'aktif') {
      return NextResponse.json({ error: 'Sesi tidak valid' }, { status: 403 });
    }
    
    const soalUjian = sesi.ujian.soalUjian[0];
    if (!soalUjian) {
      return NextResponse.json({ error: 'Soal tidak ditemukan' }, { status: 404 });
    }
    
    const benar = jawaban === soalUjian.soal.kunciJawaban;
    
    await prisma.jawaban.upsert({
      where: {
        sesiId_soalUjianId: {
          sesiId: sesiId,
          soalUjianId: soalUjianId
        }
      },
      update: {
        jawaban: jawaban,
        benar: benar
      },
      create: {
        sesiId: sesiId,
        soalUjianId: soalUjianId,
        jawaban: jawaban,
        benar: benar
      }
    });
    
    return NextResponse.json({ success: true, benar });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
`;

const apiJawabanPath = path.join(__dirname, 'app', 'api', 'peserta', 'jawaban', 'route.ts');
fs.mkdirSync(path.dirname(apiJawabanPath), { recursive: true });
fs.writeFileSync(apiJawabanPath, apiJawabanContent, 'utf8');
console.log('✅ API simpan jawaban dibuat');

// ============================================
// 4. API SELESAI UJIAN
// ============================================
const apiSelesaiContent = `import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePeserta } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const peserta = await requirePeserta();
    const { sesiId } = await req.json();
    
    const sesi = await prisma.sesiUjian.findUnique({
      where: { id: sesiId },
      include: {
        ujian: {
          include: {
            soalUjian: {
              include: { soal: true }
            }
          }
        },
        jawaban: {
          include: {
            soalUjian: {
              include: { soal: true }
            }
          }
        }
      }
    });
    
    if (!sesi || sesi.pesertaId !== peserta.id) {
      return NextResponse.json({ error: 'Sesi tidak valid' }, { status: 403 });
    }
    
    if (sesi.status === 'selesai') {
      return NextResponse.json({ error: 'Ujian sudah selesai' }, { status: 400 });
    }
    
    const totalSoal = sesi.ujian.soalUjian.length;
    const jawabanBenar = sesi.jawaban.filter(j => j.benar).length;
    const jawabanSalah = sesi.jawaban.filter(j => j.jawaban && !j.benar).length;
    const tidakDijawab = totalSoal - sesi.jawaban.length;
    
    const totalBobot = sesi.ujian.soalUjian.reduce((sum, su) => sum + su.bobot, 0);
    const bobotDidapat = sesi.jawaban
      .filter(j => j.benar)
      .reduce((sum, j) => sum + j.soalUjian.bobot, 0);
    
    const nilai = totalBobot > 0 ? (bobotDidapat / totalBobot) * 100 : 0;
    const statusTarget = nilai >= sesi.ujian.passingGrade ? 'lulus' : 'tidak_lulus';
    
    await prisma.sesiUjian.update({
      where: { id: sesiId },
      data: {
        status: 'selesai',
        waktuSelesai: new Date()
      }
    });
    
    const hasil = await prisma.hasil.create({
      data: {
        sesiId: sesiId,
        pesertaId: peserta.id,
        ujianId: sesi.ujianId,
        totalSoal: totalSoal,
        jawabanBenar: jawabanBenar,
        jawabanSalah: jawabanSalah,
        tidakDijawab: tidakDijawab,
        totalBobot: totalBobot,
        bobotDidapat: bobotDidapat,
        nilai: Math.round(nilai * 100) / 100,
        statusTarget: statusTarget
      }
    });
    
    return NextResponse.json({ success: true, hasil });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
`;

const apiSelesaiPath = path.join(__dirname, 'app', 'api', 'peserta', 'selesai', 'route.ts');
fs.mkdirSync(path.dirname(apiSelesaiPath), { recursive: true });
fs.writeFileSync(apiSelesaiPath, apiSelesaiContent, 'utf8');
console.log('✅ API selesai ujian dibuat');

console.log('\n🎉 PERBAIKAN UJIAN PESERTA SELESAI!');
console.log('\n👉 LANGKAH SELANJUTNYA:');
console.log('   1. Restart server: Ctrl+C lalu npm run dev');
console.log('   2. Login sebagai peserta');
console.log('   3. Klik "Mulai Ujian"');
console.log('   4. Ujian akan tampil dengan timer dan navigasi soal!');