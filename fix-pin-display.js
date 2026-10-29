const fs = require('fs');
const path = require('path');

console.log('🔧 Memperbaiki sistem PIN agar bisa ditampilkan...\n');

// 1. UPDATE SCHEMA PRISMA - tambah field pinPlain
const schemaPath = path.join(__dirname, 'prisma', 'schema.prisma');
let schema = fs.readFileSync(schemaPath, 'utf8');

// Tambah field pinPlain setelah pinHash
if (!schema.includes('pinPlain')) {
  schema = schema.replace(
    /pinHash\s+String/,
    'pinHash         String\n  pinPlain        String   @default("")'
  );
  fs.writeFileSync(schemaPath, schema, 'utf8');
  console.log('✅ Schema Prisma: field pinPlain ditambahkan');
} else {
  console.log('✅ Schema Prisma: pinPlain sudah ada');
}

// 2. UPDATE API PESERTA (POST) - simpan PIN plain text
const pesertaApiPath = path.join(__dirname, 'app', 'api', 'admin', 'peserta', 'route.ts');
let pesertaApi = fs.readFileSync(pesertaApiPath, 'utf8');

if (!pesertaApi.includes('pinPlain')) {
  pesertaApi = pesertaApi.replace(
    /pinHash\s*:\s*pinHash/g,
    'pinHash,\n        pinPlain: pin'
  );
  fs.writeFileSync(pesertaApiPath, pesertaApi, 'utf8');
  console.log('✅ API Peserta POST: simpan PIN plain text');
}

// 3. UPDATE API PESERTA PATCH (reset PIN)
const pesertaIdApiPath = path.join(__dirname, 'app', 'api', 'admin', 'peserta', '[id]', 'route.ts');
let pesertaIdApi = `import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin, hashPassword, generatePin } from '@/lib/auth';

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
        data: { pinHash, pinPlain: pin, pinHarusGanti: true }
      });
      
      return NextResponse.json({ success: true, pin });
    }

    return NextResponse.json({ error: 'Action tidak valid' }, { status: 400 });
  } catch (error: any) {
    console.error('Error PATCH:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
`;
fs.writeFileSync(pesertaIdApiPath, pesertaIdApi, 'utf8');
console.log('✅ API Peserta PATCH: reset PIN dengan simpan pinPlain');

// 4. UPDATE HALAMAN PESERTA ADMIN - tampilkan PIN di tabel
const pesertaPagePath = path.join(__dirname, 'app', 'admin', 'peserta', 'page.tsx');
let pesertaPage = fs.readFileSync(pesertaPagePath, 'utf8');

// Tambah kolom PIN di tabel
if (!pesertaPage.includes('pinPlain')) {
  // Tambah header kolom PIN
  pesertaPage = pesertaPage.replace(
    /<th className="px-4 py-3 text-left">WhatsApp<\/th>/,
    '<th className="px-4 py-3 text-left">WhatsApp</th>\n                <th className="px-4 py-3 text-center">PIN</th>'
  );
  
  // Tambah cell PIN di setiap baris
  pesertaPage = pesertaPage.replace(
    /<td className="px-4 py-3 text-slate-600">\{p\.whatsapp \|\| '-'\}<\/td>/,
    `<td className="px-4 py-3 text-slate-600">{p.whatsapp || '-'}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="font-mono font-bold text-gold bg-yellow-50 px-2 py-1 rounded text-sm">
                      {p.pinPlain || '-'}
                    </span>
                  </td>`
  );
  
  // Update colSpan di empty state
  pesertaPage = pesertaPage.replace(
    /colSpan=\{4\}/,
    'colSpan={5}'
  );
  
  fs.writeFileSync(pesertaPagePath, pesertaPage, 'utf8');
  console.log('✅ Halaman Peserta: kolom PIN ditambahkan di tabel');
}

// 5. UPDATE API CETAK KARTU - sertakan PIN
const cetakKartuPath = path.join(__dirname, 'app', 'api', 'peserta', 'cetak-kartu', 'route.ts');
if (fs.existsSync(cetakKartuPath)) {
  let cetakKartu = fs.readFileSync(cetakKartuPath, 'utf8');
  
  // Update select untuk include pinPlain
  if (!cetakKartu.includes('pinPlain')) {
    cetakKartu = cetakKartu.replace(
      /where: \{ id: user\.id \}/,
      'where: { id: user.id },\n      select: { nomorPeserta: true, namaLengkap: true, tempatLahir: true, tanggalLahir: true, whatsapp: true, pinPlain: true }'
    );
    
    // Tampilkan PIN di kartu
    cetakKartu = cetakKartu.replace(
      /\$\{peserta\.whatsapp \?/,
      `\${peserta.pinPlain ? \`<div class="row"><span class="label">PIN Login</span><span class="value" style="font-family:monospace;font-size:18px;color:#d4af37;font-weight:900;">\${peserta.pinPlain}</span></div>\` : ''}
\${peserta.whatsapp ?`
    );
    
    fs.writeFileSync(cetakKartuPath, cetakKartu, 'utf8');
    console.log('✅ API Cetak Kartu: PIN ditambahkan');
  }
}

// 6. UPDATE HALAMAN CETAK KARTU ADMIN - tampilkan PIN
const cetakKartuAdminPath = path.join(__dirname, 'app', 'admin', 'kartu', 'page.tsx');
if (fs.existsSync(cetakKartuAdminPath)) {
  let cetakKartuAdmin = fs.readFileSync(cetakKartuAdminPath, 'utf8');
  
  if (!cetakKartuAdmin.includes('pinPlain')) {
    // Tambah kolom PIN di tabel
    cetakKartuAdmin = cetakKartuAdmin.replace(
      /<th className="px-3 py-3 text-left">Nama<\/th>/,
      '<th className="px-3 py-3 text-left">Nama</th>\n              <th className="px-3 py-3 text-center">PIN</th>'
    );
    
    cetakKartuAdmin = cetakKartuAdmin.replace(
      /<td className="px-3 py-2">\{p\.namaLengkap\}<\/td>/,
      `<td className="px-3 py-2">{p.namaLengkap}</td>
                <td className="px-3 py-2 text-center">
                  <span className="font-mono font-bold text-gold bg-yellow-50 px-2 py-1 rounded">
                    {p.pinPlain || '-'}
                  </span>
                </td>`
    );
    
    // Update generateKartuMassal untuk include PIN
    cetakKartuAdmin = cetakKartuAdmin.replace(
      /\$\{p\.whatsapp \?/,
      `\${p.pinPlain ? \`<div class="row"><span class="label">PIN Login</span><span class="value" style="font-family:monospace;font-size:18px;color:#d4af37;font-weight:900;">\${p.pinPlain}</span></div>\` : ''}
\${p.whatsapp ?`
    );
    
    fs.writeFileSync(cetakKartuAdminPath, cetakKartuAdmin, 'utf8');
    console.log('✅ Halaman Cetak Kartu Admin: PIN ditambahkan');
  }
}

console.log('\n🎉 SEMUA PERBAIKAN SELESAI!');
console.log('\n👉 LANGKAH SELANJUTNYA:');
console.log('   1. Jalankan: npx prisma db push');
console.log('   2. Tekan Ctrl+C, lalu: npm run dev');
console.log('   3. Buka menu Data Peserta - PIN akan muncul di tabel');
console.log('   4. Cetak kartu peserta - PIN akan tercetak di kartu');