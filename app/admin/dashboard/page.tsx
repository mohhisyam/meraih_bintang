import prisma from '@/lib/prisma';

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
