const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 MEMULAI PERBAIKAN MUTLAK...\n');

// 1. PAKSA TAMBAHKAN pinPlain ke schema.prisma
const schemaPath = path.join(__dirname, 'prisma', 'schema.prisma');
let schema = fs.readFileSync(schemaPath, 'utf8');

if (!schema.includes('pinPlain')) {
  console.log('📝 Menambahkan pinPlain ke schema.prisma...');
  // Cari baris pinHash dan tambahkan pinPlain di bawahnya
  schema = schema.replace(
    /(pinHash\s+String)/,
    '$1\n  pinPlain        String   @default("")'
  );
  fs.writeFileSync(schemaPath, schema, 'utf8');
  console.log('✅ schema.prisma berhasil diupdate!\n');
} else {
  console.log('✅ schema.prisma sudah memiliki pinPlain.\n');
}

// 2. Jalankan db push
console.log('📦 Langkah 1: Mendorong perubahan ke database (db push)...');
try {
  execSync('npx prisma db push', { stdio: 'inherit' });
  console.log('✅ Database berhasil diupdate!\n');
} catch (error) {
  console.error('❌ Gagal db push. Pastikan tidak ada program yang mengunci file database.');
  process.exit(1);
}

// 3. Jalankan generate
console.log('⚙️ Langkah 2: Generate Prisma Client...');
try {
  execSync('npx prisma generate', { stdio: 'inherit' });
  console.log('✅ Prisma Client berhasil di-generate!\n');
} catch (error) {
  console.error('❌ Gagal generate.');
  process.exit(1);
}

// 4. Generate PIN untuk peserta lama
console.log('🔑 Langkah 3: Mengisi PIN untuk peserta yang belum punya...\n');

// Kita harus require ulang PrismaClient setelah generate
// Hapus cache require agar mendapat versi terbaru
Object.keys(require.cache).forEach(key => {
  if (key.includes('@prisma/client')) {
    delete require.cache[key];
  }
});

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
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
    } else {
      console.log(`📋 Ditemukan ${pesertaTanpaPin.length} peserta tanpa PIN\n`);
      console.log('='.repeat(60));
      console.log('DAFTAR PIN BARU (SIMPAN INI!):');
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

      console.log('\n✅ SEMUA PIN BERHASIL DIGENERATE DAN DISIMPAN!');
    }
  } catch (error) {
    console.error('❌ Error saat update PIN:', error.message);
  } finally {
    await prisma.$disconnect();
    console.log('\n🎉 SELESAI!');
    console.log('👉 Jalankan: npm run dev');
    console.log('👉 Buka browser dan tekan Ctrl+F5');
  }
}

main();