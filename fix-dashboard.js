const fs = require('fs');
const path = require('path');

console.log('🔧 Memperbaiki file yang rusak formatnya...\n');

// 1. Perbaiki app/admin/dashboard/page.tsx
const dashboardContent = `import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function Dashboard() {
  const [tp, ts, th, ua] = await Promise.all([
    prisma.peserta.count(),
    prisma.soal.count(),
    prisma.hasil.count(),
    prisma.ujian.count({ where: { status: { in: ['terjadwal', 'berlangsung'] } } }),
  ]);

  return (
    <div className="animate-fade-in">
      <h1 className="text-3xl font-bold text-navy mb-6">Dashboard Admin</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { l: 'Total Peserta', v: tp, i: '👥' },
          { l: 'Total Soal', v: ts, i: '📚' },
          { l: 'Total Hasil', v: th, i: '📈' },
          { l: 'Ujian Aktif', v: ua, i: '📝' },
        ].map((s: any) => (
          <div key={s.l} className="bg-white p-5 rounded-xl shadow">
            <div className="text-2xl mb-2">{s.i}</div>
            <div className="text-gray-500 text-sm">{s.l}</div>
            <div className="text-2xl font-bold text-navy">{s.v}</div>
          </div>
        ))}
      </div>
      <div className="bg-white p-6 rounded-xl shadow">
        <h3 className="font-bold text-navy mb-4">Menu Cepat</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <a href="/admin/peserta" className="p-4 bg-slate-50 hover:bg-navy hover:text-white rounded-lg transition">➕ Tambah Peserta</a>
          <a href="/admin/soal" className="p-4 bg-slate-50 hover:bg-navy hover:text-white rounded-lg transition">📤 Impor Soal</a>
          <a href="/admin/ujian" className="p-4 bg-slate-50 hover:bg-navy hover:text-white rounded-lg transition">📅 Buat Ujian</a>
        </div>
      </div>
    </div>
  );
}
`;

fs.writeFileSync(path.join(__dirname, 'app', 'admin', 'dashboard', 'page.tsx'), dashboardContent, 'utf8');
console.log('✅ app/admin/dashboard/page.tsx diperbaiki');

// 2. Perbaiki app/page.tsx (Beranda)
const homeContent = `import Link from 'next/link';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const pengumuman = await prisma.pengumuman.findMany({ where: { aktif: true }, orderBy: { createdAt: 'desc' }, take: 3 });
  return (
    <div className="min-h-screen">
      <header className="gradient-navy text-white p-6 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full gradient-gold flex items-center justify-center text-navy font-bold">MB</div>
          <div>
            <h1 className="font-bold">Meraih Bintang</h1>
            <p className="text-xs text-gold">Perangkat Desa Payaman</p>
          </div>
        </div>
        <div className="gap-2 flex">
          <Link href="/peserta/login" className="px-4 py-2 bg-white/10 rounded hover:bg-white/20">Login Peserta</Link>
          <Link href="/admin/login" className="px-4 py-2 gradient-gold text-navy font-bold rounded">Admin</Link>
        </div>
      </header>
      <section className="gradient-navy text-white pb-20 pt-10 text-center">
        <h2 className="text-4xl font-black mb-4">TRY OUT MERAIH BINTANG<br/><span className="text-gold">PERANGKAT DESA PAYAMAN</span></h2>
        <p className="text-xl italic mb-8">"Persiapkan Diri, Raih Prestasi, Menjadi Perangkat Desa Berkompetensi."</p>
        <Link href="/peserta/login" className="px-8 py-3 gradient-gold text-navy font-bold rounded-lg shadow-lg inline-block">🎓 Mulai Ujian</Link>
      </section>
      <div className="max-w-4xl mx-auto px-4 py-12 grid md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow">
          <h3 className="font-bold text-navy mb-3">📢 Pengumuman</h3>
          {pengumuman.length ? pengumuman.map(p => (
            <div key={p.id} className="mb-2 border-b pb-2">
              <b>{p.judul}</b>
              <p className="text-sm text-gray-600">{p.isi}</p>
            </div>
          )) : <p className="text-gray-500">Belum ada pengumuman.</p>}
        </div>
        <div className="bg-white p-6 rounded-xl shadow">
          <h3 className="font-bold text-navy mb-3">ℹ️ Panduan</h3>
          <ol className="list-decimal list-inside text-sm text-gray-700 space-y-1">
            <li>Login dengan Nomor Peserta & PIN.</li>
            <li>Kerjakan soal dengan teliti.</li>
            <li>Nilai muncul otomatis setelah selesai.</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
`;

fs.writeFileSync(path.join(__dirname, 'app', 'page.tsx'), homeContent, 'utf8');
console.log('✅ app/page.tsx diperbaiki');

console.log('\n🎉 File berhasil diperbaiki!');
console.log('👉 Tekan Ctrl+C di terminal, lalu jalankan: npm run dev');