const fs = require('fs');
const path = require('path');

function writeFile(filePath, content) {
  const fullPath = path.join(__dirname, filePath);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(fullPath, content, 'utf8');
  console.log('✅ Created:', filePath);
}

// 1. ENV
writeFile('.env', `DATABASE_URL="file:./prisma/dev.db"
JWT_SECRET="rahasia-negara-meraih-bintang-2026-sangat-panjang"
NEXT_PUBLIC_APP_NAME="Try Out Meraih Bintang"
ADMIN_SETUP_PIN="MeraihBintang2026!"
`);

// 2. PRISMA SCHEMA
writeFile('prisma/schema.prisma', `generator client { provider = "prisma-client-js" }
datasource db { provider = "sqlite" url = env("DATABASE_URL") }

model Admin { id String @id @default(cuid()) username String @unique passwordHash String namaLengkap String createdAt DateTime @default(now()) updatedAt DateTime @updatedAt }
model Peserta { id String @id @default(cuid()) nomorPeserta String @unique namaLengkap String tempatLahir String? tanggalLahir DateTime? alamat String? whatsapp String? foto String? pinHash String statusAktif Boolean @default(true) pinHarusGanti Boolean @default(true) createdAt DateTime @default(now()) updatedAt DateTime @updatedAt sesiUjian SesiUjian[] hasil Hasil[] }
model KategoriSoal { id String @id @default(cuid()) nama String @unique deskripsi String? createdAt DateTime @default(now()) soal Soal[] }
model Soal { id String @id @default(cuid()) kategoriId String pertanyaan String pilihanA String pilihanB String pilihanC String pilihanD String pilihanE String kunciJawaban String bobot Int @default(1) gambar String? pembahasan String? createdAt DateTime @default(now()) updatedAt DateTime @updatedAt kategori KategoriSoal @relation(fields: [kategoriId], references: [id]) soalUjian SoalUjian[] }
model Ujian { id String @id @default(cuid()) nama String deskripsi String? tanggalMulai DateTime tanggalSelesai DateTime durasiMenit Int acakSoal Boolean @default(false) acakJawaban Boolean @default(false) passingGrade Int @default(70) tampilkanNilai Boolean @default(true) tampilkanPembahasan Boolean @default(false) status String @default("draft") createdAt DateTime @default(now()) updatedAt DateTime @updatedAt soalUjian SoalUjian[] sesiUjian SesiUjian[] hasil Hasil[] }
model SoalUjian { id String @id @default(cuid()) ujianId String soalId String urutan Int bobot Int @default(1) ujian Ujian @relation(fields: [ujianId], references: [id], onDelete: Cascade) soal Soal @relation(fields: [soalId], references: [id], onDelete: Cascade) @@unique([ujianId, soalId]) }
model SesiUjian { id String @id @default(cuid()) pesertaId String ujianId String token String @unique waktuMulai DateTime @default(now()) waktuSelesai DateTime? durasiDetik Int status String @default("aktif") jawabanTersimpan Json @default("{}") ipAddress String? userAgent String? createdAt DateTime @default(now()) updatedAt DateTime @updatedAt peserta Peserta @relation(fields: [pesertaId], references: [id]) ujian Ujian @relation(fields: [ujianId], references: [id]) @@unique([pesertaId, ujianId, status]) }
model Jawaban { id String @id @default(cuid()) sesiId String soalUjianId String jawaban String? benar Boolean @default(false) createdAt DateTime @default(now()) updatedAt DateTime @updatedAt @@unique([sesiId, soalUjianId]) }
model Hasil { id String @id @default(cuid()) sesiId String @unique pesertaId String ujianId String totalSoal Int jawabanBenar Int jawabanSalah Int tidakDijawab Int totalBobot Int bobotDidapat Int nilai Float statusTarget String peringkat Int? selesaiPada DateTime @default(now()) createdAt DateTime @default(now()) peserta Peserta @relation(fields: [pesertaId], references: [id]) ujian Ujian @relation(fields: [ujianId], references: [id]) }
model Pengumuman { id String @id @default(cuid()) judul String isi String prioritas String @default("normal") aktif Boolean @default(true) createdAt DateTime @default(now()) updatedAt DateTime @updatedAt }
model LogAktivitas { id String @id @default(cuid()) userId String? userType String? aksi String detail String? ip String? createdAt DateTime @default(now()) }
model Pengaturan { key String @id value String }
`);

// 3. LIB FILES
writeFile('lib/prisma.ts', `import { PrismaClient } from '@prisma/client';
const globalForPrisma = global as unknown as { prisma: PrismaClient };
export const prisma = globalForPrisma.prisma || new PrismaClient({ log: ['error'] });
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
export default prisma;`);

writeFile('lib/auth.ts', `import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
const SECRET = process.env.JWT_SECRET || 'default-secret';
export async function hashPassword(p: string) { return bcrypt.hash(p, 12); }
export async function verifyPassword(p: string, h: string) { return bcrypt.compare(p, h); }
export function signToken(payload: any) { return jwt.sign(payload, SECRET, { expiresIn: '8h' }); }
export function verifyToken(token: string) { try { return jwt.verify(token, SECRET) as any; } catch { return null; } }
export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('mb_token')?.value;
  if (!token) return null;
  return verifyToken(token);
}
export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') throw new Error('Unauthorized');
  return user;
}
export async function requirePeserta() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'peserta') throw new Error('Unauthorized');
  return user;
}
export function generateNomorPeserta(index: number) { return \`MBP-\${new Date().getFullYear()}-\${String(index).padStart(4, '0')}\`; }
export function generatePin() { return Math.floor(100000 + Math.random() * 900000).toString(); }`);

writeFile('lib/utils.ts', `export function formatDateTime(date: any) { if (!date) return '-'; return new Date(date).toLocaleString('id-ID'); }
export function shuffleArray<T>(array: T[]) { const r = [...array]; for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; }`);

// 4. SCRIPTS
writeFile('scripts/setup.js', `const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const readline = require('readline');
const prisma = new PrismaClient();
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const question = (q) => new Promise(resolve => rl.question(q, resolve));
async function main() {
  console.log('\\n=== SETUP ADMIN ===');
  const existing = await prisma.admin.findFirst();
  if (existing) { console.log('Admin sudah ada.'); rl.close(); return; }
  const setupPin = process.env.ADMIN_SETUP_PIN || 'MeraihBintang2026!';
  const inputPin = await question(\`PIN Setup (default \${setupPin}): \`);
  if ((inputPin.trim() || setupPin) !== setupPin) { console.log('Salah.'); rl.close(); return; }
  const u = await question('Username: ');
  const n = await question('Nama: ');
  const p = await question('Password (min 8): ');
  if (p.length < 8) { console.log('Kurang panjang.'); rl.close(); return; }
  await prisma.admin.create({ data: { username: u.trim(), namaLengkap: n.trim(), passwordHash: await bcrypt.hash(p, 12) } });
  const cats = ['Pancasila','Pemdes','Perundang-undangan','Bahasa Indonesia','Pengetahuan Umum','TKD'];
  for (const c of cats) await prisma.kategoriSoal.upsert({ where: { nama: c }, update: {}, create: { nama: c } });
  console.log('✅ Sukses! Login di http://localhost:3000/admin/login');
  rl.close();
}
main().catch(e => console.error(e)).finally(() => prisma.$disconnect());`);

// 5. APP LAYOUT & GLOBAL CSS
writeFile('app/globals.css', `@tailwind base; @tailwind components; @tailwind utilities;
.gradient-navy { background: linear-gradient(135deg, #0a2540 0%, #1e3a5f 100%); }
.gradient-gold { background: linear-gradient(135deg, #d4af37 0%, #f4d03f 100%); }
.animate-fade-in { animation: fadeIn 0.4s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
@media print { .no-print { display: none !important; } }`);

writeFile('app/layout.tsx', `import './globals.css'; import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Try Out Meraih Bintang', description: 'Persiapkan Diri, Raih Prestasi.' };
export default function RootLayout({ children }: { children: React.ReactNode }) { return <html lang="id"><body className="bg-slate-50 min-h-screen">{children}</body></html>; }`);

// 6. PAGES (HOME, LOGIN)
writeFile('app/page.tsx', `import Link from 'next/link'; import prisma from '@/lib/prisma';
export const dynamic = 'force-dynamic';
export default async function Home() {
  const pengumuman = await prisma.pengumuman.findMany({ where: { aktif: true }, orderBy: { createdAt: 'desc' }, take: 3 });
  return (
    <div className="min-h-screen">
      <header className="gradient-navy text-white p-6 flex justify-between items-center">
        <div className="flex items-center gap-3"><div className="w-12 h-12 rounded-full gradient-gold flex items-center justify-center text-navy font-bold">MB</div><div><h1 className="font-bold">Meraih Bintang</h1><p className="text-xs text-gold">Perangkat Desa Payaman</p></div></div>
        <div className="gap-2 flex"><Link href="/peserta/login" className="px-4 py-2 bg-white/10 rounded hover:bg-white/20">Login Peserta</Link><Link href="/admin/login" className="px-4 py-2 gradient-gold text-navy font-bold rounded">Admin</Link></div>
      </header>
      <section className="gradient-navy text-white pb-20 pt-10 text-center">
        <h2 className="text-4xl font-black mb-4">TRY OUT MERAIH BINTANG<br/><span className="text-gold">PERANGKAT DESA PAYAMAN</span></h2>
        <p className="text-xl italic mb-8">"Persiapkan Diri, Raih Prestasi, Menjadi Perangkat Desa Berkompetensi."</p>
        <Link href="/peserta/login" className="px-8 py-3 gradient-gold text-navy font-bold rounded-lg shadow-lg inline-block">🎓 Mulai Ujian</Link>
      </section>
      <div className="max-w-4xl mx-auto px-4 py-12 grid md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow"><h3 className="font-bold text-navy mb-3">📢 Pengumuman</h3>{pengumuman.length ? pengumuman.map(p => <div key={p.id} className="mb-2 border-b pb-2"><b>{p.judul}</b><p className="text-sm text-gray-600">{p.isi}</p></div>) : <p className="text-gray-500">Belum ada pengumuman.</p>}</div>
        <div className="bg-white p-6 rounded-xl shadow"><h3 className="font-bold text-navy mb-3">ℹ️ Panduan</h3><ol className="list-decimal list-inside text-sm text-gray-700 space-y-1"><li>Login dengan Nomor Peserta & PIN.</li><li>Kerjakan soal dengan teliti.</li><li>Nilai muncul otomatis setelah selesai.</li></ol></div>
      </div>
    </div>
  );
}`);

// 7. AUTH API & PAGES
writeFile('app/api/auth/admin/login/route.ts', `import { NextRequest, NextResponse } from 'next/server'; import prisma from '@/lib/prisma'; import { verifyPassword, signToken } from '@/lib/auth';
export async function POST(req: NextRequest) { const { username, password } = await req.json(); const admin = await prisma.admin.findUnique({ where: { username } }); if (!admin || !(await verifyPassword(password, admin.passwordHash))) return NextResponse.json({ error: 'Login gagal' }, { status: 401 }); const res = NextResponse.json({ success: true }); res.cookies.set('mb_token', signToken({ id: admin.id, role: 'admin' }), { httpOnly: true, path: '/', maxAge: 28800 }); return res; }`);

writeFile('app/api/auth/peserta/login/route.ts', `import { NextRequest, NextResponse } from 'next/server'; import prisma from '@/lib/prisma'; import { verifyPassword, signToken } from '@/lib/auth';
export async function POST(req: NextRequest) { const { nomorPeserta, pin } = await req.json(); const p = await prisma.peserta.findUnique({ where: { nomorPeserta: nomorPeserta.toUpperCase() } }); if (!p || !p.statusAktif || !(await verifyPassword(pin, p.pinHash))) return NextResponse.json({ error: 'Login gagal' }, { status: 401 }); const res = NextResponse.json({ success: true }); res.cookies.set('mb_token', signToken({ id: p.id, role: 'peserta' }), { httpOnly: true, path: '/', maxAge: 28800 }); return res; }`);

writeFile('app/api/auth/logout/route.ts', `import { NextResponse } from 'next/server'; export async function POST() { const res = NextResponse.json({}); res.cookies.set('mb_token', '', { maxAge: 0, path: '/' }); return res; }`);

writeFile('app/api/auth/me/route.ts', `import { NextResponse } from 'next/server'; import prisma from '@/lib/prisma'; import { getCurrentUser } from '@/lib/auth';
export async function GET() { const user = await getCurrentUser(); if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); if (user.role === 'admin') { const a = await prisma.admin.findUnique({ where: { id: user.id }, select: { id:true, username:true, namaLengkap:true } }); return NextResponse.json({ role:'admin', ...a }); } else { const p = await prisma.peserta.findUnique({ where: { id: user.id }, select: { id:true, nomorPeserta:true, namaLengkap:true } }); return NextResponse.json({ role:'peserta', ...p }); } }`);

writeFile('app/admin/login/page.tsx', `'use client'; import { useState } from 'react'; import { useRouter } from 'next/navigation';
export default function AdminLogin() { const router = useRouter(); const [u, setU] = useState(''); const [p, setP] = useState(''); const [err, setErr] = useState('');
  const submit = async (e: any) => { e.preventDefault(); setErr(''); const res = await fetch('/api/auth/admin/login', { method: 'POST', body: JSON.stringify({ username: u, password: p }) }); const d = await res.json(); if (!res.ok) setErr(d.error); else router.push('/admin/dashboard'); };
  return <div className="min-h-screen gradient-navy flex items-center justify-center p-4"><form onSubmit={submit} className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md"><h2 className="text-2xl font-bold text-navy mb-6 text-center">Login Admin</h2>{err && <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm">{err}</div>}<input className="w-full border p-3 rounded mb-3" placeholder="Username" value={u} onChange={e=>setU(e.target.value)} required /><input className="w-full border p-3 rounded mb-6" type="password" placeholder="Password" value={p} onChange={e=>setP(e.target.value)} required /><button className="w-full gradient-gold text-navy font-bold py-3 rounded">Masuk</button></form></div>; }`);

writeFile('app/peserta/login/page.tsx', `'use client'; import { useState } from 'react'; import { useRouter } from 'next/navigation';
export default function PesertaLogin() { const router = useRouter(); const [n, setN] = useState(''); const [p, setP] = useState(''); const [err, setErr] = useState('');
  const submit = async (e: any) => { e.preventDefault(); setErr(''); const res = await fetch('/api/auth/peserta/login', { method: 'POST', body: JSON.stringify({ nomorPeserta: n, pin: p }) }); const d = await res.json(); if (!res.ok) setErr(d.error); else router.push('/peserta/dashboard'); };
  return <div className="min-h-screen gradient-navy flex items-center justify-center p-4"><form onSubmit={submit} className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md"><h2 className="text-2xl font-bold text-navy mb-6 text-center">Login Peserta</h2>{err && <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm">{err}</div>}<input className="w-full border p-3 rounded mb-3 font-mono uppercase" placeholder="Nomor Peserta (MBP-...)" value={n} onChange={e=>setN(e.target.value.toUpperCase())} required /><input className="w-full border p-3 rounded mb-6 font-mono" type="password" placeholder="PIN" value={p} onChange={e=>setP(e.target.value)} required /><button className="w-full gradient-gold text-navy font-bold py-3 rounded">Masuk</button></form></div>; }`);

// 8. ADMIN LAYOUT & DASHBOARD
writeFile('components/AdminSidebar.tsx', `'use client'; import Link from 'next/link'; import { usePathname, useRouter } from 'next/navigation'; import { useState } from 'react';
const menus = [{h:'/admin/dashboard',l:'Dashboard',i:'📊'},{h:'/admin/peserta',l:'Peserta',i:'👥'},{h:'/admin/kategori',l:'Kategori',i:'🏷️'},{h:'/admin/soal',l:'Bank Soal',i:'📚'},{h:'/admin/ujian',l:'Ujian',i:'📝'},{h:'/admin/hasil',l:'Hasil',i:'📈'},{h:'/admin/kartu',l:'Cetak Kartu',i:'🪪'},{h:'/admin/pengumuman',l:'Pengumuman',i:'📢'}];
export default function Sidebar() { const path = usePathname(); const router = useRouter(); const [open, setOpen] = useState(false);
  return (<><button onClick={()=>setOpen(!open)} className="lg:hidden fixed top-4 left-4 z-50 bg-navy text-white p-2 rounded">☰</button>{open&&<div onClick={()=>setOpen(false)} className="lg:hidden fixed inset-0 bg-black/50 z-30"/>}<aside className={\`fixed lg:static inset-y-0 left-0 z-40 w-64 gradient-navy text-white transform \${open?'translate-x-0':'-translate-x-full'} lg:translate-x-0 transition flex flex-col\`}><div className="p-5 border-b border-white/10 font-bold">Meraih Bintang Admin</div><nav className="flex-1 p-3 overflow-y-auto">{menus.map(m=><Link key={m.h} href={m.h} onClick={()=>setOpen(false)} className={\`flex items-center gap-3 px-3 py-2.5 rounded mb-1 text-sm \${path===m.h?'bg-gold text-navy font-bold':'hover:bg-white/10'}\`}><span>{m.i}</span><span>{m.l}</span></Link>)}</nav><button onClick={async()=>{await fetch('/api/auth/logout',{method:'POST'});router.push('/')}} className="p-3 border-t border-white/10 text-left hover:bg-red-500/20">🚪 Logout</button></aside></>); }`);

writeFile('app/admin/layout.tsx', `import { redirect } from 'next/navigation'; import { getCurrentUser } from '@/lib/auth'; import Sidebar from '@/components/AdminSidebar';
export default async function Layout({ children }: { children: React.ReactNode }) { const u = await getCurrentUser(); if (!u || u.role !== 'admin') redirect('/admin/login'); return <div className="flex min-h-screen bg-slate-50"><Sidebar /><main className="flex-1 lg:ml-64 p-6">{children}</main></div>; }`);

writeFile('app/admin/dashboard/page.tsx', `import prisma from '@/lib/prisma'; export const dynamic = 'force-dynamic';
export default async function Dashboard() { const [tp, ts, th, ua] = await Promise.all([prisma.peserta.count(), prisma.soal.count(), prisma.hasil.count(), prisma.ujian.count({where:{status:{in:['terjadwal','berlangsung']}}} )]);
  return (<div className="animate-fade-in"><h1 className="text-3xl font-bold text-navy mb-6">Dashboard Admin</h1><div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">{[{l:'Total Peserta',v:tp,i:'👥'},{l:'Total Soal',v:ts,i:'📚'},{l:'Total Hasil',v:th,i:'📈'},{l:'Ujian Aktif',v:ua,i:'📝'}].map((s:any)=><div key={s.l} className="bg-white p-5 rounded-xl shadow"><div className="text-2xl mb-2">{s.i}</div><div className="text-gray-500 text-sm">{s.l}</div><div className="text-2xl font-bold text-navy">{s.v}</div></div>)}</div><div className="bg-white p-6 rounded-xl shadow"><h3 className="font-bold text-navy mb-4">Menu Cepat</h3><div className="grid grid-cols-2 md:grid-cols-3 gap-4"><a href="/admin/peserta" className="p-4 bg-slate-50 hover:bg-navy hover:text-white rounded-lg transition">➕ Tambah Peserta</a><a href="/admin/soal" className="p-4 bg-slate-50 hover:bg-navy hover:text-white rounded-lg transition">📤 Impor Soal</a><a href="/admin/ujian" className="p-4 bg-slate-50 hover:bg-navy hover:text-white rounded-lg transition">📅 Buat Ujian</a></div></div></div>); }`);

// 9. PESERTA MANAGEMENT API & PAGE
writeFile('app/api/admin/peserta/route.ts', `import { NextRequest, NextResponse } from 'next/server'; import prisma from '@/lib/prisma'; import { requireAdmin, hashPassword, generateNomorPeserta, generatePin } from '@/lib/auth';
export async function GET(req: NextRequest) { try { await requireAdmin(); const q = new URL(req.url).searchParams.get('q')||''; const w = q ? { OR: [{namaLengkap:{contains:q}},{nomorPeserta:{contains:q}}] } : {}; const [data,total] = await Promise.all([prisma.peserta.findMany({where:w,orderBy:{nomorPeserta:'asc'}}), prisma.peserta.count({where:w})]); return NextResponse.json({data,total}); } catch(e:any){return NextResponse.json({error:e.message},{status:401});} }
export async function POST(req: NextRequest) { try { await requireAdmin(); const b = await req.json(); if(!b.namaLengkap) throw new Error('Nama wajib'); const t = await prisma.peserta.count()+1; let np = generateNomorPeserta(t); while(await prisma.peserta.findUnique({where:{nomorPeserta:np}})) np = generateNomorPeserta(t++); const pin = generatePin(); await prisma.peserta.create({data:{nomorPeserta:np,namaLengkap:b.namaLengkap.trim(),pinHash:await hashPassword(pin)}}); return NextResponse.json({success:true,np,pin},{status:201}); } catch(e:any){return NextResponse.json({error:e.message},{status:400});} }`);

writeFile('app/admin/peserta/page.tsx', `'use client'; import { useEffect, useState } from 'react';
export default function Page() { const [list, setList] = useState([]); const [q, setQ] = useState(''); const [modal, setModal] = useState(false); const [res, setRes] = useState<any>(null);
  const load = async () => { const r = await fetch(\`/api/admin/peserta?q=\${q}\`); const d = await r.json(); setList(d.data); };
  useEffect(() => { load(); }, [q]);
  const add = async (n:string) => { const r = await fetch('/api/admin/peserta', {method:'POST', body:JSON.stringify({namaLengkap:n})}); const d = await r.json(); if(d.success) { setRes(d); setModal(false); load(); } else alert(d.error); };
  return (<div className="animate-fade-in"><div className="flex justify-between mb-6"><h1 className="text-2xl font-bold text-navy">Data Peserta</h1><button onClick={()=>setModal(true)} className="px-4 py-2 gradient-gold text-navy rounded font-bold">➕ Tambah</button></div><input className="w-full p-3 border rounded mb-4" placeholder="Cari peserta..." value={q} onChange={e=>setQ(e.target.value)}/><div className="bg-white rounded-xl shadow overflow-hidden"><table className="w-full text-sm"><thead className="bg-slate-50"><tr><th className="p-3 text-left">No. Peserta</th><th className="p-3 text-left">Nama</th></tr></thead><tbody>{list.map((p:any)=>(<tr key={p.id} className="border-t"><td className="p-3 font-mono">{p.nomorPeserta}</td><td className="p-3">{p.namaLengkap}</td></tr>))}</tbody></table></div>{modal&&<div className="fixed inset-0 bg-black/50 flex items-center justify-center"><div className="bg-white p-6 rounded-xl w-96"><h3 className="font-bold mb-4">Tambah Peserta</h3><input id="new-name" className="w-full border p-2 rounded mb-4" placeholder="Nama Lengkap"/><div className="flex gap-2"><button onClick={()=>setModal(false)} className="flex-1 py-2 border rounded">Batal</button><button onClick={()=>add((document.getElementById('new-name') as HTMLInputElement).value)} className="flex-1 py-2 gradient-gold text-navy rounded font-bold">Simpan</button></div></div></div>}{res&&<div className="fixed inset-0 bg-black/50 flex items-center justify-center" onClick={()=>setRes(null)}><div className="bg-white p-6 rounded-xl max-w-sm" onClick={e=>e.stopPropagation()}><h3 className="font-bold text-green-600 mb-2">Berhasil!</h3><p className="mb-2">Nomor: <b>{res.np}</b></p><p className="mb-4">PIN: <b>{res.pin}</b></p><p className="text-xs text-gray-500">Simpan data ini baik-baik!</p><button onClick={()=>setRes(null)} className="mt-4 w-full py-2 bg-navy text-white rounded">Tutup</button></div></div>}</div>); }`);

// 10. SOAL & KATEGORI API & PAGES (Simplified for brevity but functional)
writeFile('app/api/admin/kategori/route.ts', `import { NextRequest, NextResponse } from 'next/server'; import prisma from '@/lib/prisma'; import { requireAdmin } from '@/lib/auth';
export async function GET() { try { await requireAdmin(); return NextResponse.json({ data: await prisma.kategoriSoal.findMany({orderBy:{nama:'asc'}}) }); } catch(e:any){return NextResponse.json({error:e.message},{status:401});} }
export async function POST(req: NextRequest) { try { await requireAdmin(); const {nama} = await req.json(); await prisma.kategoriSoal.create({data:{nama}}); return NextResponse.json({success:true}); } catch(e:any){return NextResponse.json({error:e.message},{status:400});} }`);

writeFile('app/api/admin/soal/route.ts', `import { NextRequest, NextResponse } from 'next/server'; import prisma from '@/lib/prisma'; import { requireAdmin } from '@/lib/auth'; import * as XLSX from 'xlsx';
export async function GET(req: NextRequest) { try { await requireAdmin(); const k = new URL(req.url).searchParams.get('k'); return NextResponse.json({ data: await prisma.soal.findMany({where:k?{kategoriId:k}:{},include:{kategori:true},take:50}) }); } catch(e:any){return NextResponse.json({error:e.message},{status:401});} }
export async function POST(req: NextRequest) { try { await requireAdmin(); const ct = req.headers.get('content-type')||''; if(ct.includes('multipart')) { const fd = await req.formData(); const f = fd.get('file') as File; const buf = Buffer.from(await f.arrayBuffer()); const wb = XLSX.read(buf,{type:'buffer'}); const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]); let ok=0; for(const r of rows) { if(r['pertanyaan']&&r['A']&&r['kunci']) { await prisma.soal.create({data:{kategoriId:(await prisma.kategoriSoal.findFirst({where:{nama:String(r['kategori'])||'Umum'}}))?.id||(await prisma.kategoriSoal.create({data:{nama:'Umum'}})).id,pertanyaan:String(r['pertanyaan']),pilihanA:String(r['A']),pilihanB:String(r['B']),pilihanC:String(r['C']),pilihanD:String(r['D']),pilihanE:String(r['E']),kunciJawaban:String(r['kunci']).toUpperCase(),bobot:Number(r['bobot'])||1}}); ok++; } } return NextResponse.json({success:true,ok}); } else { const b = await req.json(); await prisma.soal.create({data:{...b,kunciJawaban:b.kunciJawaban.toUpperCase()}}); return NextResponse.json({success:true}); } } catch(e:any){return NextResponse.json({error:e.message},{status:400});} }`);

writeFile('app/admin/kategori/page.tsx', `'use client'; import { useEffect, useState } from 'react';
export default function Page() { const [cats, setCats] = useState([]); const [n, setN] = useState('');
  const load = async () => setCats((await fetch('/api/admin/kategori').then(r=>r.json())).data);
  useEffect(() => { load(); }, []);
  const add = async () => { if(!n) return; await fetch('/api/admin/kategori',{method:'POST',body:JSON.stringify({nama:n})}); setN(''); load(); };
  return (<div className="animate-fade-in"><h1 className="text-2xl font-bold text-navy mb-6">Kategori Soal</h1><div className="flex gap-2 mb-6"><input className="flex-1 border p-2 rounded" value={n} onChange={e=>setN(e.target.value)} placeholder="Nama Kategori"/><button onClick={add} className="px-4 gradient-gold text-navy rounded font-bold">Tambah</button></div><div className="grid md:grid-cols-2 gap-4">{cats.map((c:any)=>(<div key={c.id} className="bg-white p-4 rounded shadow flex justify-between"><span className="font-bold">{c.nama}</span></div>))}</div></div>); }`);

writeFile('app/admin/soal/page.tsx', `'use client'; import { useEffect, useState } from 'react';
export default function Page() { const [soal, setSoal] = useState([]); const [modal, setModal] = useState(false);
  const load = async () => setSoal((await fetch('/api/admin/soal').then(r=>r.json())).data);
  useEffect(() => { load(); }, []);
  const save = async (f:any) => { await fetch('/api/admin/soal',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(f)}); setModal(false); load(); };
  const imp = async (file:any) => { const fd = new FormData(); fd.append('file',file); await fetch('/api/admin/soal',{method:'POST',body:fd}); alert('Impor selesai'); load(); };
  return (<div className="animate-fade-in"><div className="flex justify-between mb-6"><h1 className="text-2xl font-bold text-navy">Bank Soal</h1><div className="flex gap-2"><label className="px-4 py-2 bg-blue-500 text-white rounded cursor-pointer">📤 Impor Excel<input type="file" className="hidden" onChange={e=>e.target.files?.[0]&&imp(e.target.files[0])}/></label><button onClick={()=>setModal(true)} className="px-4 gradient-gold text-navy rounded font-bold">➕ Manual</button></div></div><div className="space-y-4">{soal.map((s:any,i:number)=>(<div key={s.id} className="bg-white p-4 rounded shadow"><div className="font-bold mb-2">{i+1}. {s.pertanyaan}</div><div className="grid grid-cols-2 gap-2 text-sm">{['A','B','C','D','E'].map(h=><div key={h} className={s.kunciJawaban===h?'bg-green-100 p-1 rounded':''}>{h}. {s['pilihan'+h]}</div>)}</div></div>))}</div>{modal&&<SoalModal onClose={()=>setModal(false)} onSave={save} />}</div>); }
function SoalModal({onClose,onSave}:any) { const [f,setF] = useState({pertanyaan:'',pilihanA:'',pilihanB:'',pilihanC:'',pilihanD:'',pilihanE:'',kunciJawaban:'A',bobot:1,kategoriId:''});
  return (<div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4"><div className="bg-white p-6 rounded-xl w-full max-w-lg overflow-y-auto max-h-[90vh]"><h3 className="font-bold mb-4">Tambah Soal</h3><textarea className="w-full border p-2 rounded mb-2" placeholder="Pertanyaan" value={f.pertanyaan} onChange={e=>setF({...f,pertanyaan:e.target.value})}/>{['A','B','C','D','E'].map(h=><input key={h} className="w-full border p-2 rounded mb-2" placeholder={\`Pilihan \${h}\`} value={(f as any)['pilihan'+h]} onChange={e=>setF({...f,['pilihan'+h]:e.target.value})}/>)}<select className="w-full border p-2 rounded mb-4" value={f.kunciJawaban} onChange={e=>setF({...f,kunciJawaban:e.target.value})}>{['A','B','C','D','E'].map(h=><option key={h}>{h}</option>)}</select><div className="flex gap-2"><button onClick={onClose} className="flex-1 py-2 border rounded">Batal</button><button onClick={()=>onSave(f)} className="flex-1 py-2 gradient-gold text-navy rounded font-bold">Simpan</button></div></div></div>); }`);

// 11. UJIAN API & PAGE
writeFile('app/api/admin/ujian/route.ts', `import { NextRequest, NextResponse } from 'next/server'; import prisma from '@/lib/prisma'; import { requireAdmin } from '@/lib/auth';
export async function GET() { try { await requireAdmin(); return NextResponse.json({ data: await prisma.ujian.findMany({orderBy:{createdAt:'desc'}}) }); } catch(e:any){return NextResponse.json({error:e.message},{status:401});} }
export async function POST(req: NextRequest) { try { await requireAdmin(); const b = await req.json(); const u = await prisma.ujian.create({data:{...b,tanggalMulai:new Date(b.tanggalMulai),tanggalSelesai:new Date(b.tanggalSelesai)}});
  const s = await prisma.soal.findMany({where:{kategoriId:{in:b.kategoriIds||[]}},take:b.jumlahSoal||10});
  for(let i=0;i<s.length;i++) await prisma.soalUjian.create({data:{ujianId:u.id,soalId:s[i].id,urutan:i+1,bobot:s[i].bobot}});
  return NextResponse.json({success:true}); } catch(e:any){return NextResponse.json({error:e.message},{status:400});} }`);

writeFile('app/admin/ujian/page.tsx', `'use client'; import { useEffect, useState } from 'react';
export default function Page() { const [list, setList] = useState([]); const [cats, setCats] = useState([]); const [m, setM] = useState(false); const [f, setF] = useState({nama:'',tanggalMulai:'',tanggalSelesai:'',durasiMenit:60,kategoriIds:[],jumlahSoal:20});
  const load = async () => { setList((await fetch('/api/admin/ujian').then(r=>r.json())).data); setCats((await fetch('/api/admin/kategori').then(r=>r.json())).data); };
  useEffect(() => { load(); }, []);
  const save = async () => { await fetch('/api/admin/ujian',{method:'POST',body:JSON.stringify(f)}); setM(false); load(); };
  const toggleCat = (id:string) => setF(prev=>({...prev,kategoriIds:prev.kategoriIds.includes(id)?prev.kategoriIds.filter(x=>x!==id):[...prev.kategoriIds,id]}));
  return (<div className="animate-fade-in"><div className="flex justify-between mb-6"><h1 className="text-2xl font-bold text-navy">Pengaturan Ujian</h1><button onClick={()=>setM(true)} className="px-4 gradient-gold text-navy rounded font-bold">➕ Buat Ujian</button></div><div className="grid md:grid-cols-2 gap-4">{list.map((u:any)=>(<div key={u.id} className="bg-white p-5 rounded shadow"><h3 className="font-bold">{u.nama}</h3><p className="text-sm text-gray-500">{u.durasiMenit} menit · Status: {u.status}</p></div>))}</div>{m&&<div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4"><div className="bg-white p-6 rounded-xl w-full max-w-lg"><h3 className="font-bold mb-4">Buat Ujian</h3><input className="w-full border p-2 rounded mb-2" placeholder="Nama Ujian" value={f.nama} onChange={e=>setF({...f,nama:e.target.value})}/><div className="grid grid-cols-2 gap-2 mb-2"><input type="datetime-local" className="border p-2 rounded" value={f.tanggalMulai} onChange={e=>setF({...f,tanggalMulai:e.target.value})}/><input type="datetime-local" className="border p-2 rounded" value={f.tanggalSelesai} onChange={e=>setF({...f,tanggalSelesai:e.target.value})}/></div><div className="mb-4"><p className="text-sm font-bold mb-1">Kategori:</p><div className="grid grid-cols-2 gap-1">{cats.map((c:any)=>(<label key={c.id} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.kategoriIds.includes(c.id)} onChange={()=>toggleCat(c.id)}/>{c.nama}</label>))}</div></div><div className="flex gap-2"><button onClick={()=>setM(false)} className="flex-1 py-2 border rounded">Batal</button><button onClick={save} className="flex-1 py-2 gradient-gold text-navy rounded font-bold">Simpan</button></div></div></div>}</div>); }`);

// 12. PESERTA EXAM FLOW (The Core Logic)
writeFile('app/api/peserta/ujian-aktif/route.ts', `import { NextResponse } from 'next/server'; import prisma from '@/lib/prisma'; import { requirePeserta } from '@/lib/auth';
export async function GET() { try { const u = await requirePeserta(); const now = new Date(); const exams = await prisma.ujian.findMany({where:{status:{in:['terjadwal','berlangsung']},tanggalMulai:{lte:now},tanggalSelesai:{gte:now}},include:{_count:{select:{soalUjian:true}},hasil:{where:{pesertaId:u.id}}}});
  const res = []; for(const e of exams) { const sesi = await prisma.sesiUjian.findFirst({where:{pesertaId:u.id,ujianId:e.id,status:'aktif'}}); res.push({...e,sudahDikerjakan:e.hasil.length>0,sesiId:sesi?.id}); }
  return NextResponse.json({data:res}); } catch(e:any){return NextResponse.json({error:e.message},{status:401});} }`);

writeFile('app/api/peserta/sesi/route.ts', `import { NextRequest, NextResponse } from 'next/server'; import prisma from '@/lib/prisma'; import { requirePeserta } from '@/lib/auth'; import crypto from 'crypto';
export async function POST(req: NextRequest) { try { const u = await requirePeserta(); const {ujianId} = await req.json(); const ujian = await prisma.ujian.findUnique({where:{id:ujianId},include:{soalUjian:{include:{soal:true},orderBy:{urutan:'asc'}}}});
  if(!ujian) throw new Error('Ujian tidak ditemukan');
  let sesi = await prisma.sesiUjian.findFirst({where:{pesertaId:u.id,ujianId,status:'aktif'}});
  if(!sesi) { sesi = await prisma.sesiUjian.create({data:{pesertaId:u.id,ujianId,token:crypto.randomBytes(16).toString('hex'),durasiDetik:ujian.durasiMenit*60}}); }
  const soal = ujian.soalUjian.map(s=>({soalUjianId:s.id,pertanyaan:s.soal.pertanyaan,pilihanA:s.soal.pilihanA,pilihanB:s.soal.pilihanB,pilihanC:s.soal.pilihanC,pilihanD:s.soal.pilihanD,pilihanE:s.soal.pilihanE,bobot:s.bobot}));
  return NextResponse.json({sesiId:sesi.id,soal,sisaWaktu:ujian.durasiMenit*60}); } catch(e:any){return NextResponse.json({error:e.message},{status:400});} }`);

writeFile('app/api/peserta/jawaban/route.ts', `import { NextRequest, NextResponse } from 'next/server'; import prisma from '@/lib/prisma'; import { requirePeserta } from '@/lib/auth';
export async function POST(req: NextRequest) { try { const u = await requirePeserta(); const {sesiId,soalUjianId,jawaban} = await req.json(); const sesi = await prisma.sesiUjian.findFirst({where:{id:sesiId,pesertaId:u.id,status:'aktif'}}); if(!sesi) throw new Error('Invalid');
  const cur = (sesi.jawabanTersimpan as any)||{}; cur[soalUjianId] = jawaban;
  await prisma.sesiUjian.update({where:{id:sesiId},data:{jawabanTersimpan:cur}});
  return NextResponse.json({success:true}); } catch(e:any){return NextResponse.json({error:e.message},{status:400});} }`);

writeFile('app/api/peserta/selesai/route.ts', `import { NextRequest, NextResponse } from 'next/server'; import prisma from '@/lib/prisma'; import { requirePeserta } from '@/lib/auth';
export async function POST(req: NextRequest) { try { const u = await requirePeserta(); const {sesiId} = await req.json(); const sesi = await prisma.sesiUjian.findFirst({where:{id:sesiId,pesertaId:u.id},include:{ujian:{include:{soalUjian:{include:{soal:true}}}}}});
  if(!sesi) throw new Error('Sesi invalid');
  const existing = await prisma.hasil.findFirst({where:{sesiId}}); if(existing) return NextResponse.json({success:true,hasil:existing,already:true});
  await prisma.sesiUjian.update({where:{id:sesiId},data:{status:'selesai',waktuSelesai:new Date()}});
  const answers = (sesi.jawabanTersimpan as any)||{}; let ben=0, sal=0, kosong=0, bobotD=0, bobotT=0;
  for(const su of sesi.ujian.soalUjian) { bobotT+=su.bobot; const ans = answers[su.id]; if(!ans) kosong++; else if(ans===su.soal.kunciJawaban) { ben++; bobotD+=su.bobot; } else sal++; }
  const nilai = bobotT>0?(bobotD/bobotT)*100:0;
  const hasil = await prisma.hasil.create({data:{sesiId,pesertaId:u.id,ujianId:sesi.ujianId,totalSoal:sesi.ujian.soalUjian.length,jawabanBenar:ben,jawabanSalah:sal,tidakDijawab:kosong,totalBobot:bobotT,bobotDidapat:bobotD,nilai:Math.round(nilai*100)/100,statusTarget:nilai>=sesi.ujian.passingGrade?'MENCAPAI TARGET':'BELUM MENCAPAI TARGET'}});
  return NextResponse.json({success:true,hasil}); } catch(e:any){return NextResponse.json({error:e.message},{status:400});} }`);

// 13. PESERTA DASHBOARD & EXAM PAGE
writeFile('app/peserta/dashboard/page.tsx', `'use client'; import { useEffect, useState } from 'react'; import { useRouter } from 'next/navigation';
export default function Page() { const router = useRouter(); const [user, setUser] = useState<any>(null); const [exams, setExams] = useState([]);
  useEffect(() => { fetch('/api/auth/me').then(r=>r.json()).then(setUser); fetch('/api/peserta/ujian-aktif').then(r=>r.json()).then(d=>setExams(d.data)); }, []);
  const start = async (id:string) => { const r = await fetch('/api/peserta/sesi',{method:'POST',body:JSON.stringify({ujianId:id})}); const d = await r.json(); if(d.sesiId) router.push(\`/peserta/ujian/\${d.sesiId}\`); else alert(d.error); };
  if(!user) return <div className="p-10">Loading...</div>;
  return (<div className="min-h-screen bg-slate-50"><header className="gradient-navy text-white p-4 flex justify-between"><div className="font-bold">Dashboard Peserta</div><button onClick={async()=>{await fetch('/api/auth/logout',{method:'POST'});router.push('/')}} className="text-sm bg-white/20 px-3 py-1 rounded">Keluar</button></header><main className="max-w-4xl mx-auto p-6"><div className="bg-white p-6 rounded-xl shadow mb-6"><h2 className="text-xl font-bold text-navy">{user.namaLengkap}</h2><p className="font-mono text-sm text-gray-500">{user.nomorPeserta}</p></div><h3 className="font-bold text-navy mb-4">Ujian Tersedia</h3><div className="grid md:grid-cols-2 gap-4">{exams.map((e:any)=>(<div key={e.id} className="bg-white p-5 rounded shadow"><h4 className="font-bold">{e.nama}</h4><p className="text-sm text-gray-500 mb-3">{e._count.soalUjian} Soal</p>{e.sudahDikerjakan?<span className="text-green-600 text-sm font-bold">✅ Selesai</span>:<button onClick={()=>start(e.id)} className="w-full py-2 gradient-gold text-navy rounded font-bold">Mulai Ujian</button>}</div>))}</div></main></div>); }`);

writeFile('app/peserta/ujian/[id]/page.tsx', `'use client'; import { useEffect, useState } from 'react'; import { useRouter, useParams } from 'next/navigation';
export default function ExamPage() { const router = useRouter(); const params = useParams(); const [soal, setSoal] = useState([]); const [idx, setIdx] = useState(0); const [ans, setAns] = useState<any>({}); const [time, setTime] = useState(0);
  useEffect(() => { fetch(\`/api/peserta/sesi-load?sesiId=\${params.id}\`).then(r=>r.json()).then(d=>{setSoal(d.soal);setTime(d.sisaWaktuDetik);setAns(d.jawabanTersimpan||{})}); }, [params.id]);
  useEffect(() => { if(time<=0) return; const t=setInterval(()=>{setTime(v=>{if(v<=1){clearInterval(t);finish();return 0;} return v-1;})},1000); return ()=>clearInterval(t); }, [time]);
  const save = async (sid:string, j:string) => { setAns(p=>({...p,[sid]:j})); fetch('/api/peserta/jawaban',{method:'POST',body:JSON.stringify({sesiId:params.id,soalUjianId:sid,jawaban:j})}).catch(()=>{}); };
  const finish = async () => { if(!confirm('Yakin selesai?')) return; const r = await fetch('/api/peserta/selesai',{method:'POST',body:JSON.stringify({sesiId:params.id})}); const d = await r.json(); if(d.hasil?.id) router.push(\`/peserta/hasil/\${d.hasil.id}\`); };
  if(!soal.length) return <div className="min-h-screen flex items-center justify-center">Memuat Soal...</div>;
  const cur = soal[idx];
  return (<div className="min-h-screen bg-slate-100"><header className="gradient-navy text-white p-4 sticky top-0 z-10 flex justify-between"><div>Soal {idx+1}/{soal.length}</div><div className="font-mono font-bold bg-white/20 px-3 rounded">{Math.floor(time/60)}:{String(time%60).padStart(2,'0')}</div></header><main className="max-w-3xl mx-auto p-6"><div className="bg-white p-6 rounded-xl shadow mb-4"><h3 className="text-lg font-medium mb-6">{cur.pertanyaan}</h3><div className="space-y-3">{['A','B','C','D','E'].map(h=>{const val=(cur as any)['pilihan'+h]; if(!val) return null; return <button key={h} onClick={()=>save(cur.soalUjianId,h)} className={\`w-full text-left p-4 rounded border-2 \${ans[cur.soalUjianId]===h?'border-gold bg-gold/10':'border-slate-200 hover:border-navy'}\`}><span className="font-bold mr-3">{h}.</span>{val}</button>})}</div></div><div className="flex justify-between"><button disabled={idx===0} onClick={()=>setIdx(i=>i-1)} className="px-4 py-2 bg-slate-200 rounded disabled:opacity-50">Prev</button><button onClick={()=>idx<soal.length-1?setIdx(i=>i+1):finish()} className="px-4 py-2 gradient-gold text-navy rounded font-bold">{idx<soal.length-1?'Next':'Selesai'}</button></div></main></div>); }`);

writeFile('app/api/peserta/sesi-load/route.ts', `import { NextRequest, NextResponse } from 'next/server'; import prisma from '@/lib/prisma'; import { requirePeserta } from '@/lib/auth';
export async function GET(req: NextRequest) { try { const u = await requirePeserta(); const sid = req.nextUrl.searchParams.get('sesiId'); const s = await prisma.sesiUjian.findFirst({where:{id:sid,pesertaId:u.id},include:{ujian:{include:{soalUjian:{include:{soal:true},orderBy:{urutan:'asc'}}}}}}); if(!s) throw new Error('Invalid');
  const elapsed = Math.floor((Date.now()-new Date(s.waktuMulai).getTime())/1000); const sisa = Math.max(0, s.durasiDetik-elapsed);
  return NextResponse.json({soal:s.ujian.soalUjian.map(su=>({soalUjianId:su.id,pertanyaan:su.soal.pertanyaan,pilihanA:su.soal.pilihanA,pilihanB:su.soal.pilihanB,pilihanC:su.soal.pilihanC,pilihanD:su.soal.pilihanD,pilihanE:su.soal.pilihanE})),sisaWaktuDetik:sisa,jawabanTersimpan:s.jawabanTersimpan}); } catch(e:any){return NextResponse.json({error:e.message},{status:401});} }`);

// 14. HASIL PAGE
writeFile('app/peserta/hasil/[id]/page.tsx', `'use client'; import { useEffect, useState } from 'react'; import { useParams, useRouter } from 'next/navigation';
export default function ResultPage() { const params = useParams(); const router = useRouter(); const [h, setH] = useState<any>(null);
  useEffect(() => { fetch(\`/api/peserta/hasil/\${params.id}\`).then(r=>r.json()).then(d=>setH(d.hasil)); }, [params.id]);
  if(!h) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  return (<div className="min-h-screen bg-slate-50 py-10 px-4"><div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden"><div className="gradient-navy text-white p-6 text-center"><h1 className="text-2xl font-bold">HASIL TRY OUT</h1></div><div className="p-8 text-center"><div className={\`text-6xl font-black mb-2 \${h.nilai>=70?'text-green-600':'text-orange-600'}\`}>{h.nilai}</div><div className="text-sm text-gray-500 mb-6">Nilai Akhir</div><div className="grid grid-cols-3 gap-4 mb-6"><div className="bg-slate-50 p-3 rounded"><div className="font-bold text-green-600">{h.jawabanBenar}</div><div className="text-xs">Benar</div></div><div className="bg-slate-50 p-3 rounded"><div className="font-bold text-red-600">{h.jawabanSalah}</div><div className="text-xs">Salah</div></div><div className="bg-slate-50 p-3 rounded"><div className="font-bold text-gray-600">{h.tidakDijawab}</div><div className="text-xs">Kosong</div></div></div><div className={\`inline-block px-4 py-2 rounded-full font-bold text-sm \${h.statusTarget==='MENCAPAI TARGET'?'bg-green-100 text-green-700':'bg-orange-100 text-orange-700'}\`}>{h.statusTarget}</div></div><div className="p-6 bg-slate-50 flex justify-center"><button onClick={()=>window.print()} className="px-6 py-2 gradient-navy text-white rounded-lg font-bold no-print">🖨️ Cetak Hasil</button></div></div></div>); }`);

writeFile('app/api/peserta/hasil/[id]/route.ts', `import { NextRequest, NextResponse } from 'next/server'; import prisma from '@/lib/prisma'; import { requirePeserta } from '@/lib/auth';
export async function GET(req: NextRequest, {params}:any) { try { const u = await requirePeserta(); const h = await prisma.hasil.findFirst({where:{id:params.id,pesertaId:u.id}}); if(!h) throw new Error('Not found'); return NextResponse.json({hasil:h}); } catch(e:any){return NextResponse.json({error:e.message},{status:401});} }`);

// 15. CETAK KARTU & PENGUMUMAN (Simplified)
writeFile('app/admin/kartu/page.tsx', `'use client'; import { useEffect, useState } from 'react';
export default function Page() { const [list, setList] = useState([]);
  useEffect(() => { fetch('/api/admin/peserta').then(r=>r.json()).then(d=>setList(d.data)); }, []);
  const print = (p:any) => { const w = window.open('','_blank'); w?.document.write(\`<html><head><title>Kartu \${p.nomorPeserta}</title><style>body{font-family:sans-serif;text-align:center;padding:20px;border:2px solid #0a2540;border-radius:10px;max-width:400px;margin:20px auto;}</style></head><body><h2>KARTU PESERTA</h2><h3>\${p.namaLengkap}</h3><p>\${p.nomorPeserta}</p><p>Try Out Meraih Bintang</p></body></html>\`); w?.print(); };
  return (<div className="animate-fade-in"><h1 className="text-2xl font-bold text-navy mb-6">Cetak Kartu</h1><div className="grid md:grid-cols-2 gap-4">{list.map((p:any)=>(<div key={p.id} className="bg-white p-4 rounded shadow flex justify-between items-center"><div><b>{p.namaLengkap}</b><br/><span className="text-xs font-mono">{p.nomorPeserta}</span></div><button onClick={()=>print(p)} className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm">Cetak</button></div>))}</div></div>); }`);

writeFile('app/admin/pengumuman/page.tsx', `'use client'; import { useEffect, useState } from 'react';
export default function Page() { const [list, setList] = useState([]); const [t, setT] = useState(''); const [i, setI] = useState('');
  const load = async () => setList((await fetch('/api/admin/pengumuman').then(r=>r.json())).data);
  useEffect(() => { load(); }, []);
  const add = async () => { await fetch('/api/admin/pengumuman',{method:'POST',body:JSON.stringify({judul:t,isi:i})}); setT(''); setI(''); load(); };
  return (<div className="animate-fade-in"><h1 className="text-2xl font-bold text-navy mb-6">Pengumuman</h1><div className="bg-white p-4 rounded shadow mb-6"><input className="w-full border p-2 rounded mb-2" placeholder="Judul" value={t} onChange={e=>setT(e.target.value)}/><textarea className="w-full border p-2 rounded mb-2" placeholder="Isi" value={i} onChange={e=>setI(e.target.value)}/><button onClick={add} className="px-4 gradient-gold text-navy rounded font-bold">Posting</button></div><div className="space-y-4">{list.map((p:any)=>(<div key={p.id} className="bg-white p-4 rounded shadow"><h3 className="font-bold">{p.judul}</h3><p className="text-sm text-gray-600">{p.isi}</p></div>))}</div></div>); }`);

writeFile('app/api/admin/pengumuman/route.ts', `import { NextRequest, NextResponse } from 'next/server'; import prisma from '@/lib/prisma'; import { requireAdmin } from '@/lib/auth';
export async function GET() { try { await requireAdmin(); return NextResponse.json({ data: await prisma.pengumuman.findMany({orderBy:{createdAt:'desc'}}) }); } catch(e:any){return NextResponse.json({error:e.message},{status:401});} }
export async function POST(req: NextRequest) { try { await requireAdmin(); const b = await req.json(); await prisma.pengumuman.create({data:{judul:b.judul,isi:b.isi}}); return NextResponse.json({success:true}); } catch(e:any){return NextResponse.json({error:e.message},{status:400});} }`);

console.log('\n🎉 SEMUA FILE BERHASIL DIBUAT!');
console.log('👉 Lanjutkan dengan: npx prisma db push');