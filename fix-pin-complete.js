const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

console.log('🔧 Memperbaiki sistem PIN secara lengkap...\n');

// 1. PERBAIKI API POST PESERTA
const apiPostPath = path.join(__dirname, 'app', 'api', 'admin', 'peserta', 'route.ts');
let apiPost = fs.readFileSync(apiPostPath, 'utf8');

// Tambahkan pinPlain ke data yang disimpan
if (!apiPost.includes('pinPlain: pin')) {
  apiPost = apiPost.replace(
    /pinHash\s*\n\s*\}\s*\)/,
    'pinHash,\n        pinPlain: pin\n      }\n    )'
  );
  fs.writeFileSync(apiPostPath, apiPost, 'utf8');
  console.log('✅ API POST diperbaiki: pinPlain akan disimpan');
} else {
  console.log('✅ API POST sudah benar');
}

// 2. PERBAIKI API PATCH (RESET PIN)
const apiPatchPath = path.join(__dirname, 'app', 'api', 'admin', 'peserta', '[id]', 'route.ts');
let apiPatch = fs.readFileSync(apiPatchPath, 'utf8');

if (!apiPatch.includes('pinPlain: pin')) {
  apiPatch = apiPatch.replace(
    /pinHash,\s*pinHarusGanti:\s*true/,
    'pinHash,\n        pinPlain: pin,\n        pinHarusGanti: true'
  );
  fs.writeFileSync(apiPatchPath, apiPatch, 'utf8');
  console.log('✅ API PATCH diperbaiki: pinPlain akan diupdate saat reset');
} else {
  console.log('✅ API PATCH sudah benar');
}

// 3. GENERATE PIN UNTUK SEMUA PESERTA YANG BELUM PUNYA
async function generatePins() {
  console.log('\n🔍 Mencari peserta tanpa PIN...');
  const prisma = new PrismaClient();
  
  const pesertaTanpaPin = await prisma.peserta.findMany({
    where: {
      OR: [
        { pinPlain: '' },
        { pinPlain: null }
      ]
    }
  });
  
  if (pesertaTanpaPin.length === 0) {
    console.log('✅ Semua peserta sudah punya PIN!');
    await prisma.$disconnect();
    return;
  }
  
  console.log(` Ditemukan ${pesertaTanpaPin.length} peserta tanpa PIN\n`);
  console.log('='.repeat(60));
  console.log('DAFTAR PIN YANG DIHASILKAN:');
  console.log('='.repeat(60));
  
  for (const p of pesertaTanpaPin) {
    const pinBaru = Math.floor(100000 + Math.random() * 900000).toString();
    
    await prisma.peserta.update({
      where: { id: p.id },
      data: { pinPlain: pinBaru }
    });
    
    console.log(`👤 ${p.namaLengkap}`);
    console.log(`   Nomor: ${p.nomorPeserta}`);
    console.log(`   PIN:   ${pinBaru}`);
    console.log('-'.repeat(60));
  }
  
  console.log('\n✅ SEMUA PIN BERHASIL DIGENERATE!');
  console.log('👉 Refresh halaman Data Peserta di browser (Ctrl+F5)');
  
  await prisma.$disconnect();
}

generatePins().catch(e => {
  console.error(' Error:', e.message);
  process.exit(1);
});