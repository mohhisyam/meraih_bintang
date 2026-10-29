const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('💣 MEMULAI PERBAIKAN NUKLIR...\n');

// 1. Hapus folder .next (cache)
const nextPath = path.join(__dirname, '.next');
if (fs.existsSync(nextPath)) {
  console.log('️  Menghapus cache .next...');
  fs.rmSync(nextPath, { recursive: true, force: true });
  console.log('   ✅ Cache dihapus');
}

// 2. PASTIKAN file page.tsx yang benar
const targetFile = path.join(__dirname, 'app', 'admin', 'peserta', 'page.tsx');

const newContent = `'use client';
import { useEffect, useState } from 'react';

export default function PesertaPage() {
  const [peserta, setPeserta] = useState([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editData, setEditData] = useState(null);
  const [pinModal, setPinModal] = useState(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    try {
      const res = await fetch('/api/admin/peserta?q=' + encodeURIComponent(search));
      const data = await res.json();
      setPeserta(data.data || []);
    } catch (e) {
      console.error('Gagal load data:', e);
    }
  }

  useEffect(() => { load(); }, [search]);

  async function handleSave(form) {
    setLoading(true);
    try {
      if (editData) {
        await fetch('/api/admin/peserta/' + editData.id, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
        alert('Data peserta berhasil diupdate!');
      } else {
        const res = await fetch('/api/admin/peserta', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
        const data = await res.json();
        if (data.success) {
          setPinModal({ nama: form.namaLengkap, np: data.np, pin: data.pin });
        } else {
          alert('Error: ' + data.error);
        }
      }
      setShowModal(false);
      setEditData(null);
      load();
    } catch (e) {
      alert('Gagal menyimpan data');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Yakin ingin menghapus peserta ini?')) return;
    await fetch('/api/admin/peserta/' + id, { method: 'DELETE' });
    load();
  }

  async function handleResetPin(id, nama) {
    if (!confirm('Buat PIN baru untuk ' + nama + '?\\n(PIN lama akan tidak berlaku)')) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admin/peserta/' + id, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset-pin' }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPinModal({ nama: nama, np: '', pin: data.pin });
        load();
      } else {
        alert('Gagal mereset PIN: ' + (data.error || 'Unknown'));
      }
    } catch (e) {
      alert('Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="animate-fade-in p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-navy">Data Peserta</h1>
          <p className="text-sm text-slate-500">Total: {peserta.length} peserta</p>
        </div>
        <button onClick={() => { setEditData(null); setShowModal(true); }} className="px-4 py-2 gradient-gold text-navy rounded-lg text-sm font-bold">
          + Tambah Peserta
        </button>
      </div>

      <div className="bg-white rounded-xl shadow p-4 mb-4">
        <input
          type="text"
          placeholder="Cari nama atau nomor peserta..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg"
        />
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left">No. Peserta</th>
                <th className="px-4 py-3 text-left">Nama</th>
                <th className="px-4 py-3 text-left">WhatsApp</th>
                <th className="px-4 py-3 text-center">PIN</th>
                <th className="px-4 py-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {peserta.length === 0 ? (
                <tr><td colSpan="5" className="text-center py-8 text-slate-500">Belum ada peserta.</td></tr>
              ) : peserta.map(p => (
                <tr key={p.id} className="border-b hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono text-xs font-bold text-navy">{p.nomorPeserta}</td>
                  <td className="px-4 py-3 font-medium">{p.namaLengkap}</td>
                  <td className="px-4 py-3 text-slate-600">{p.whatsapp || '-'}</td>
                  <td className="px-4 py-3 text-center">
                    {p.pinPlain ? (
                      <span className="font-mono font-bold text-yellow-700 bg-yellow-50 px-3 py-1 rounded text-sm border border-yellow-200">
                        {p.pinPlain}
                      </span>
                    ) : (
                      <span className="text-xs text-red-500">Belum ada</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex gap-1 justify-center">
                      <button 
                        onClick={() => handleResetPin(p.id, p.namaLengkap)} 
                        className="px-3 py-1.5 bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 text-xs font-bold"
                        title="Reset PIN"
                      >
                        PIN
                      </button>
                      <button onClick={() => { setEditData(p); setShowModal(true); }} className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-xs font-bold">Edit</button>
                      <button onClick={() => handleDelete(p.id)} className="px-3 py-1.5 bg-red-100 text-red-700 rounded hover:bg-red-200 text-xs font-bold">Hapus</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="font-bold text-navy text-lg mb-4">{editData ? 'Edit Peserta' : 'Tambah Peserta Baru'}</h3>
            <div className="space-y-3">
              <input placeholder="Nama Lengkap *" defaultValue={editData?.namaLengkap || ''} id="input-nama" className="w-full px-3 py-2 border rounded-lg" />
              <input placeholder="Tempat Lahir" defaultValue={editData?.tempatLahir || ''} id="input-ttl" className="w-full px-3 py-2 border rounded-lg" />
              <input type="date" defaultValue={editData?.tanggalLahir ? new Date(editData.tanggalLahir).toISOString().slice(0,10) : ''} id="input-tgl" className="w-full px-3 py-2 border rounded-lg" />
              <textarea placeholder="Alamat" defaultValue={editData?.alamat || ''} id="input-alamat" className="w-full px-3 py-2 border rounded-lg" rows={2} />
              <input placeholder="Nomor WhatsApp" defaultValue={editData?.whatsapp || ''} id="input-wa" className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setShowModal(false)} disabled={loading} className="flex-1 py-2 border rounded-lg">Batal</button>
              <button onClick={() => {
                const form = {
                  namaLengkap: document.getElementById('input-nama').value,
                  tempatLahir: document.getElementById('input-ttl').value,
                  tanggalLahir: document.getElementById('input-tgl').value,
                  alamat: document.getElementById('input-alamat').value,
                  whatsapp: document.getElementById('input-wa').value,
                };
                onSave(form);
              }} disabled={loading} className="flex-1 py-2 gradient-gold text-navy rounded-lg font-bold">
                {loading ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {pinModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setPinModal(null)}>
          <div className="bg-white rounded-xl p-6 max-w-sm w-full" onClick={e => e.stopPropagation()}>
            <div className="text-center">
              <div className="text-5xl mb-3">🔑</div>
              <h3 className="font-bold text-navy text-lg mb-1">PIN Peserta</h3>
              <p className="text-sm text-slate-500 mb-4">{pinModal.nama}</p>
              <div className="bg-slate-50 p-4 rounded-lg border-2 border-dashed border-slate-300 mb-4">
                {pinModal.np && (
                  <div className="mb-2">
                    <div className="text-xs text-slate-500">Nomor Peserta</div>
                    <div className="font-mono font-bold text-navy text-lg">{pinModal.np}</div>
                  </div>
                )}
                <div>
                  <div className="text-xs text-slate-500">PIN Login</div>
                  <div className="font-mono font-black text-4xl text-yellow-600 tracking-widest">{pinModal.pin}</div>
                </div>
              </div>
              <button onClick={() => setPinModal(null)} className="w-full py-2 gradient-gold text-navy rounded-lg font-bold">Mengerti</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
`;

console.log('📝 Menulis ulang file page.tsx...');
fs.mkdirSync(path.dirname(targetFile), { recursive: true });
fs.writeFileSync(targetFile, newContent, 'utf8');
console.log('   ✅ File berhasil ditulis: ' + targetFile);

// 3. Verifikasi file
const verifyContent = fs.readFileSync(targetFile, 'utf8');
const hasPinColumn = verifyContent.includes('<th className="px-4 py-3 text-center">PIN</th>');
const hasPinPlain = verifyContent.includes('p.pinPlain');

console.log('\n🔍 VERIFIKASI:');
console.log('   - Kolom PIN di header: ' + (hasPinColumn ? '✅ ADA' : ' TIDAK ADA'));
console.log('   - Kode pinPlain: ' + (hasPinPlain ? '✅ ADA' : '❌ TIDAK ADA'));

if (hasPinColumn && hasPinPlain) {
  console.log('\n🎉 SEMUA BERHASIL! File sudah benar.');
  console.log('\n👉 LANGKAH TERAKHIR:');
  console.log('   1. Di terminal, tekan Ctrl+C untuk stop server');
  console.log('   2. Jalankan: npm run dev');
  console.log('   3. Buka browser ke http://localhost:3000/admin/peserta');
  console.log('   4. Tekan Ctrl+F5 (Hard Refresh)');
  console.log('   5. Kolom PIN akan muncul!');
} else {
  console.log('\n VERIFIKASI GAGAL. File mungkin tidak tertulis dengan benar.');
}