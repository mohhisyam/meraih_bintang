import Link from 'next/link';
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
