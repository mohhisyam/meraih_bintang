const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

console.log('🚀 PERBAIKAN FINAL 100%...\n');

// ============================================
// 1. TULIS ULANG FILE API ROUTE (route.ts)
// ============================================
const apiRouteContent = `import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin, hashPassword, generateNomorPeserta, generatePin } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const q = new URL(req.url).searchParams.get('q') || '';
    const w = q ? { OR: [{ namaLengkap: { contains: q } }, { nomorPeserta: { contains: q } }] } : {};
    const [data, total] = await Promise.all([
      prisma.peserta.findMany({ where: w, orderBy: { nomorPeserta: 'asc' } }),
      prisma.peserta.count({ where: w })
    ]);
    return NextResponse.json({ data, total });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const b = await req.json();
    if (!b.namaLengkap) throw new Error('Nama wajib diisi');
    
    const t = await prisma.peserta.count() + 1;
    let np = generateNomorPeserta(t);
    
    while (await prisma.peserta.findUnique({ where: { nomorPeserta: np } })) {
      np = generateNomorPeserta(t + Math.floor(Math.random() * 1000));
    }
    
    const pin = generatePin();
    const pinHash = await hashPassword(pin);
    
    await prisma.peserta.create({
      data: {
        nomorPeserta: np,
        namaLengkap: b.namaLengkap.trim(),
        tempatLahir: b.tempatLahir?.trim() || null,
        tanggalLahir: b.tanggalLahir ? new Date(b.tanggalLahir) : null,
        alamat: b.alamat?.trim() || null,
        whatsapp: b.whatsapp?.trim() || null,
        pinHash: pinHash,
        pinPlain: pin
      }
    });
    
    return NextResponse.json({ success: true, np: np, pin: pin }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

export async function PUT(req: NextRequest, { params }: any) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await req.json();
    const peserta = await prisma.peserta.update({
      where: { id },
      data: {
        namaLengkap: body.namaLengkap?.trim(),
        tempatLahir: body.tempatLahir?.trim() || null,
        tanggalLahir: body.tanggalLahir ? new Date(body.tanggalLahir) : null,
        alamat: body.alamat?.trim() || null,
        whatsapp: body.whatsapp?.trim() || null,
        statusAktif: typeof body.statusAktif === 'boolean' ? body.statusAktif : undefined,
      }
    });
    return NextResponse.json({ success: true, peserta });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: any) {
  try {
    await requireAdmin();
    const { id } = await params;
    await prisma.peserta.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

export async function PATCH(req: NextRequest, { params }: any) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await req.json();
    const { action } = body;

    if (action === 'reset-pin') {
      const pin = generatePin();
      const pinHash = await hashPassword(pin);
      
      await prisma.peserta.update({
        where: { id },
        data: { pinHash: pinHash, pinPlain: pin, pinHarusGanti: true }
      });
      
      return NextResponse.json({ success: true, pin: pin });
    }

    return NextResponse.json({ error: 'Action tidak valid' }, { status: 400 });
  } catch (error: any) {
    console.error('Error PATCH:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
`;

const apiRoutePath = path.join(__dirname, 'app', 'api', 'admin', 'peserta', 'route.ts');
fs.mkdirSync(path.dirname(apiRoutePath), { recursive: true });
fs.writeFileSync(apiRoutePath, apiRouteContent, 'utf8');
console.log('✅ File API route.ts ditulis ulang dengan pinPlain');

// ============================================
// 2. TULIS ULANG FILE HALAMAN PESERTA (page.tsx)
// ============================================
const pageContent = `'use client';
import { useEffect, useState } from 'react';

export default function PesertaPage() {
  const [peserta, setPeserta] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [pinModal, setPinModal] = useState<any>(null);
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

  async function handleSave(form: any) {
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

  async function handleDelete(id: string) {
    if (!confirm('Yakin ingin menghapus peserta ini?')) return;
    await fetch('/api/admin/peserta/' + id, { method: 'DELETE' });
    load();
  }

  async function handleResetPin(id: string, nama: string) {
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
                <tr><td colSpan={5} className="text-center py-8 text-slate-500">Belum ada peserta.</td></tr>
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
                handleSave(form);
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

const pagePath = path.join(__dirname, 'app', 'admin', 'peserta', 'page.tsx');
fs.writeFileSync(pagePath, pageContent, 'utf8');
console.log('✅ File page.tsx ditulis ulang dengan kolom PIN');

// ============================================
// 3. GENERATE PIN UNTUK PESERTA YANG SUDAH ADA
// ============================================
async function generatePins() {
  console.log('\n🔑 Memberikan PIN ke peserta yang sudah ada...\n');
  const prisma = new PrismaClient();
  
  try {
    const peserta = await prisma.peserta.findMany({
      where: {
        OR: [
          { pinPlain: '' },
          { pinPlain: null }
        ]
      }
    });
    
    if (peserta.length === 0) {
      console.log('✅ Semua peserta sudah punya PIN!');
    } else {
      console.log(`📋 Ditemukan ${peserta.length} peserta tanpa PIN\n`);
      console.log('='.repeat(60));
      
      for (const p of peserta) {
        const pinBaru = Math.floor(100000 + Math.random() * 900000).toString();
        
        await prisma.peserta.update({
          where: { id: p.id },
          data: { pinPlain: pinBaru }
        });
        
        console.log(`✅ ${p.namaLengkap} (${p.nomorPeserta}) → PIN: ${pinBaru}`);
      }
      
      console.log('\n🎉 SEMUA PIN BERHASIL DIBUAT!');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

console.log('\n Langkah terakhir: Generate PIN...');
generatePins().then(() => {
  console.log('\n🎉 PERBAIKAN SELESAI 100%!');
  console.log(' Restart server: Ctrl+C lalu npm run dev');
  console.log('👉 Refresh browser: Ctrl+F5');
});