const fs = require('fs');
const path = require('path');

console.log('🧹 Menghapus sistem PIN...\n');

// 1. Bersihkan Schema
const schemaPath = path.join(__dirname, 'prisma', 'schema.prisma');
let schema = fs.readFileSync(schemaPath, 'utf8');
schema = schema.replace(/^\s*pinHash\s+String.*\n/gm, '');
schema = schema.replace(/^\s*pinPlain\s+String\s*@default\(""\).*\n/gm, '');
schema = schema.replace(/^\s*pinHarusGanti\s+Boolean\s*@default\(true\).*\n/gm, '');
fs.writeFileSync(schemaPath, schema, 'utf8');
console.log('✅ Schema prisma dibersihkan');

// 2. Bersihkan API Admin
const adminApiPath = path.join(__dirname, 'app', 'api', 'admin', 'peserta', 'route.ts');
if (fs.existsSync(adminApiPath)) {
    let content = fs.readFileSync(adminApiPath, 'utf8');
    content = content.replace(/const pin = generatePin\(\);\s*/g, '');
    content = content.replace(/const pinHash = await hashPassword\(pin\);\s*/g, '');
    content = content.replace(/pinHash,\s*/g, '');
    content = content.replace(/pinPlain:\s*pin,?\s*/g, '');
    content = content.replace(/, pin/g, '');
    fs.writeFileSync(adminApiPath, content, 'utf8');
    console.log('✅ API Admin dibersihkan');
}

// 3. Tulis Ulang Halaman Admin Peserta (Tanpa Kolom PIN)
const adminPagePath = path.join(__dirname, 'app', 'admin', 'peserta', 'page.tsx');
const adminPageContent = `'use client';
import { useEffect, useState } from 'react';

export default function PesertaPage() {
  const [peserta, setPeserta] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    const res = await fetch('/api/admin/peserta?q=' + encodeURIComponent(search));
    const data = await res.json();
    setPeserta(data.data || []);
  }
  useEffect(() => { load(); }, [search]);

  async function handleSave(form: any) {
    setLoading(true);
    try {
      if (editData) {
        await fetch('/api/admin/peserta/' + editData.id, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      } else {
        await fetch('/api/admin/peserta', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      }
      setShowModal(false); setEditData(null); load();
    } catch (e) { alert('Gagal menyimpan'); } finally { setLoading(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm('Yakin hapus?')) return;
    await fetch('/api/admin/peserta/' + id, { method: 'DELETE' }); load();
  }

  return (
    <div className="animate-fade-in p-6">
      <div className="flex justify-between mb-6">
        <h1 className="text-2xl font-bold text-navy">Data Peserta</h1>
        <button onClick={() => { setEditData(null); setShowModal(true); }} className="px-4 py-2 gradient-gold text-navy rounded-lg font-bold">+ Tambah</button>
      </div>
      <input type="text" placeholder="Cari..." value={search} onChange={e => setSearch(e.target.value)} className="w-full px-4 py-2 border rounded-lg mb-4" />
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left">No. Peserta</th>
              <th className="px-4 py-3 text-left">Nama</th>
              <th className="px-4 py-3 text-left">WhatsApp</th>
              <th className="px-4 py-3 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {peserta.map(p => (
              <tr key={p.id} className="border-b hover:bg-slate-50">
                <td className="px-4 py-3 font-mono font-bold">{p.nomorPeserta}</td>
                <td className="px-4 py-3">{p.namaLengkap}</td>
                <td className="px-4 py-3">{p.whatsapp || '-'}</td>
                <td className="px-4 py-3 text-center">
                  <button onClick={() => { setEditData(p); setShowModal(true); }} className="px-3 py-1 bg-blue-100 text-blue-700 rounded mr-1">Edit</button>
                  <button onClick={() => handleDelete(p.id)} className="px-3 py-1 bg-red-100 text-red-700 rounded">Hapus</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-xl w-full max-w-md">
            <h3 className="font-bold text-lg mb-4">{editData ? 'Edit' : 'Tambah'} Peserta</h3>
            <input placeholder="Nama Lengkap *" defaultValue={editData?.namaLengkap} id="nama" className="w-full border p-2 rounded mb-2" />
            <input placeholder="WhatsApp" defaultValue={editData?.whatsapp} id="wa" className="w-full border p-2 rounded mb-4" />
            <div className="flex gap-2">
              <button onClick={() => setShowModal(false)} className="flex-1 border p-2 rounded">Batal</button>
              <button onClick={() => handleSave({ namaLengkap: document.getElementById('nama').value, whatsapp: document.getElementById('wa').value })} className="flex-1 gradient-gold text-navy p-2 rounded font-bold">Simpan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}`;
fs.writeFileSync(adminPagePath, adminPageContent, 'utf8');
console.log('✅ Halaman Admin Peserta ditulis ulang tanpa PIN');

console.log('\n🎉 Selesai! Jalankan: npx prisma db push && npx prisma generate');