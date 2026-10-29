const fs = require('fs');
const path = require('path');

console.log(' Membuat fitur rekap nilai peserta...\n');

// ============================================
// 1. API REKAP NILAI PESERTA
// ============================================
const apiRekapContent = `import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePeserta } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const peserta = await requirePeserta();
    
    const hasilList = await prisma.hasil.findMany({
      where: { pesertaId: peserta.id },
      include: {
        ujian: true
      },
      orderBy: { selesaiPada: 'desc' }
    });
    
    // Hitung statistik keseluruhan
    const totalUjian = hasilList.length;
    const totalLulus = hasilList.filter(h => h.statusTarget === 'lulus').length;
    const rataRata = hasilList.length > 0 
      ? hasilList.reduce((sum, h) => sum + h.nilai, 0) / hasilList.length 
      : 0;
    
    return NextResponse.json({
      data: hasilList,
      statistik: {
        totalUjian,
        totalLulus,
        totalTidakLulus: totalUjian - totalLulus,
        rataRata: Math.round(rataRata * 100) / 100
      }
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 401 });
  }
}
`;

const apiRekapPath = path.join(__dirname, 'app', 'api', 'peserta', 'rekap', 'route.ts');
fs.mkdirSync(path.dirname(apiRekapPath), { recursive: true });
fs.writeFileSync(apiRekapPath, apiRekapContent, 'utf8');
console.log('✅ API rekap nilai dibuat');

// ============================================
// 2. API DETAIL HASIL (dengan pembahasan)
// ============================================
const apiDetailContent = `import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePeserta } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: any) {
  try {
    const peserta = await requirePeserta();
    const { id } = await params;
    
    const hasil = await prisma.hasil.findUnique({
      where: { id: id },
      include: {
        ujian: true,
        sesiUjian: {
          include: {
            jawaban: {
              include: {
                soalUjian: {
                  include: {
                    soal: true
                  }
                }
              }
            }
          }
        }
      }
    });
    
    if (!hasil || hasil.pesertaId !== peserta.id) {
      return NextResponse.json({ error: 'Hasil tidak ditemukan' }, { status: 404 });
    }
    
    return NextResponse.json({ data: hasil });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 401 });
  }
}
`;

const apiDetailPath = path.join(__dirname, 'app', 'api', 'peserta', 'hasil', '[id]', 'route.ts');
fs.mkdirSync(path.dirname(apiDetailPath), { recursive: true });
fs.writeFileSync(apiDetailPath, apiDetailContent, 'utf8');
console.log('✅ API detail hasil dibuat');

// ============================================
// 3. HALAMAN REKAP NILAI
// ============================================
const rekapPageContent = `'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RekapPage() {
  const [hasil, setHasil] = useState([]);
  const [statistik, setStatistik] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadRekap();
  }, []);

  async function loadRekap() {
    try {
      const res = await fetch('/api/peserta/rekap');
      const data = await res.json();
      if (res.ok) {
        setHasil(data.data || []);
        setStatistik(data.statistik);
      }
    } catch (e) {
      console.error('Gagal load rekap:', e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-navy">Rekap Nilai</h1>
            <p className="text-slate-500">Ringkasan hasil try out Anda</p>
          </div>
          <button 
            onClick={() => router.push('/peserta/dashboard')}
            className="px-4 py-2 bg-white border-2 border-slate-200 rounded-lg hover:bg-slate-50"
          >
            ← Kembali
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">Memuat data...</div>
        ) : (
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
                  <div className="text-3xl font-bold text-gold">{statistik.rataRata.toFixed(1)}</div>
                </div>
              </div>
            )}

            {hasil.length === 0 ? (
              <div className="bg-white p-12 rounded-xl shadow text-center">
                <div className="text-6xl mb-4">📊</div>
                <h2 className="text-xl font-bold text-navy mb-2">Belum Ada Hasil Ujian</h2>
                <p className="text-slate-500 mb-4">Anda belum pernah mengerjakan try out.</p>
                <button 
                  onClick={() => router.push('/peserta/dashboard')}
                  className="px-6 py-2 gradient-gold text-navy rounded-lg font-bold"
                >
                  Mulai Try Out
                </button>
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
                        <td className="px-4 py-3 text-center text-xs">
                          {new Date(h.selesaiPada).toLocaleDateString('id-ID')}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="text-green-600 font-bold">{h.jawabanBenar}</span>
                          <span className="text-slate-400"> / </span>
                          <span className="text-red-600 font-bold">{h.jawabanSalah + h.tidakDijawab}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={\`text-lg font-bold \${h.nilai >= h.ujian.passingGrade ? 'text-green-600' : 'text-red-600'}\`}>
                            {h.nilai.toFixed(1)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={\`px-2 py-1 rounded text-xs font-bold \${
                            h.statusTarget === 'lulus' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }\`}>
                            {h.statusTarget === 'lulus' ? 'LULUS' : 'TIDAK LULUS'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button 
                            onClick={() => router.push('/peserta/hasil/' + h.id)}
                            className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-xs font-bold hover:bg-blue-200"
                          >
                            Lihat Detail
                          </button>
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
`;

const rekapPagePath = path.join(__dirname, 'app', 'peserta', 'rekap', 'page.tsx');
fs.mkdirSync(path.dirname(rekapPagePath), { recursive: true });
fs.writeFileSync(rekapPagePath, rekapPageContent, 'utf8');
console.log('✅ Halaman rekap nilai dibuat');

// ============================================
// 4. HALAMAN DETAIL HASIL (dengan pembahasan)
// ============================================
const detailPageContent = `'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function DetailHasilPage() {
  const params = useParams();
  const router = useRouter();
  const [hasil, setHasil] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDetail();
  }, [params.id]);

  async function loadDetail() {
    try {
      const res = await fetch('/api/peserta/hasil/' + params.id);
      const data = await res.json();
      if (res.ok) {
        setHasil(data.data);
      } else {
        alert(data.error || 'Gagal memuat detail');
        router.push('/peserta/rekap');
      }
    } catch (e) {
      alert('Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Memuat...</div>;
  }

  if (!hasil) {
    return <div className="min-h-screen flex items-center justify-center">Data tidak ditemukan</div>;
  }

  const jawabanList = hasil.sesiUjian?.jawaban || [];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-navy">Detail Hasil Ujian</h1>
            <p className="text-slate-500">{hasil.ujian.nama}</p>
          </div>
          <button 
            onClick={() => router.push('/peserta/rekap')}
            className="px-4 py-2 bg-white border-2 border-slate-200 rounded-lg hover:bg-slate-50"
          >
            ← Kembali
          </button>
        </div>

        {/* Kartu Ringkasan */}
        <div className="bg-white p-6 rounded-xl shadow mb-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-slate-500 text-xs mb-1">Nilai</div>
              <div className={\`text-3xl font-bold \${hasil.nilai >= hasil.ujian.passingGrade ? 'text-green-600' : 'text-red-600'}\`}>
                {hasil.nilai.toFixed(1)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-slate-500 text-xs mb-1">Status</div>
              <div className={\`text-lg font-bold \${hasil.statusTarget === 'lulus' ? 'text-green-600' : 'text-red-600'}\`}>
                {hasil.statusTarget === 'lulus' ? 'LULUS' : 'TIDAK LULUS'}
              </div>
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
              <div className="text-slate-500 text-xs mb-1">Tidak Dijawab</div>
              <div className="text-2xl font-bold text-slate-400">{hasil.tidakDijawab}</div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t text-center text-sm text-slate-500">
            Passing Grade: <b>{hasil.ujian.passingGrade}%</b> | Total Soal: <b>{hasil.totalSoal}</b> | 
            Selesai: <b>{new Date(hasil.selesaiPada).toLocaleString('id-ID')}</b>
          </div>
        </div>

        {/* Pembahasan Soal */}
        <h2 className="text-xl font-bold text-navy mb-4">Pembahasan Soal</h2>
        <div className="space-y-4">
          {jawabanList.map((j, idx) => {
            const soal = j.soalUjian?.soal;
            if (!soal) return null;
            
            const isBenar = j.benar === true;
            const userAnswer = j.jawaban || '-';
            const correctAnswer = soal.kunciJawaban;
            
            return (
              <div key={j.id} className={\`bg-white p-6 rounded-xl shadow border-l-4 \${
                isBenar ? 'border-green-500' : 'border-red-500'
              }\`}>
                <div className="flex items-start gap-3 mb-4">
                  <span className={\`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-white \${
                    isBenar ? 'bg-green-500' : 'bg-red-500'
                  }\`}>
                    {idx + 1}
                  </span>
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
                      <div key={h} className={\`p-3 rounded-lg border \${bgClass}\`}>
                        <span className="font-bold mr-2">{h}.</span>
                        <span>{val}</span>
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
                  Jawaban Anda: <b className={isBenar ? 'text-green-600' : 'text-red-600'}>{userAnswer}</b>
                  {' | '}Kunci Jawaban: <b className="text-green-600">{correctAnswer}</b>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
`;

const detailPagePath = path.join(__dirname, 'app', 'peserta', 'hasil', '[id]', 'page.tsx');
fs.mkdirSync(path.dirname(detailPagePath), { recursive: true });
fs.writeFileSync(detailPagePath, detailPageContent, 'utf8');
console.log('✅ Halaman detail hasil dibuat');

// ============================================
// 5. UPDATE DASHBOARD PESERTA - Tambah Menu Rekap
// ============================================
const dashboardPath = path.join(__dirname, 'app', 'peserta', 'dashboard', 'page.tsx');
if (fs.existsSync(dashboardPath)) {
  let dashboard = fs.readFileSync(dashboardPath, 'utf8');
  
  // Tambah tombol rekap di header
  if (!dashboard.includes('/peserta/rekap')) {
    dashboard = dashboard.replace(
      /<h1 className="text-3xl font-bold text-navy mb-6">Dashboard Peserta<\/h1>/,
      \`<div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-navy">Dashboard Peserta</h1>
          <a href="/peserta/rekap" className="px-4 py-2 bg-white border-2 border-navy text-navy rounded-lg font-bold hover:bg-navy hover:text-white transition">
             Rekap Nilai
          </a>
        </div>\`
    );
    fs.writeFileSync(dashboardPath, dashboard, 'utf8');
    console.log('✅ Dashboard peserta diupdate dengan tombol Rekap Nilai');
  }
}

console.log('\n🎉 FITUR REKAP NILAI SELESAI!');
console.log('\n👉 LANGKAH SELANJUTNYA:');
console.log('   1. Restart server: Ctrl+C lalu npm run dev');
console.log('   2. Login sebagai peserta');
console.log('   3. Di dashboard, klik tombol "📊 Rekap Nilai"');
console.log('   4. Lihat statistik dan daftar hasil ujian');
console.log('   5. Klik "Lihat Detail" untuk melihat pembahasan soal');