const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log(' MEMULAI PERBAIKAN FINAL...\n');

// LANGKAH 1: Generate Prisma Client
console.log('📦 Langkah 1: Generate Prisma Client...');
try {
  execSync('npx prisma generate', { stdio: 'inherit' });
  console.log('✅ Prisma Client berhasil di-generate!\n');
} catch (error) {
  console.error('❌ Gagal generate Prisma Client. Pastikan schema.prisma sudah benar.');
  console.error('Error:', error.message);
  process.exit(1);
}

// LANGKAH 2: Generate PIN untuk peserta lama
console.log('🔑 Langkah 2: Generate PIN untuk peserta lama...\n');

// Import PrismaClient SETELAH generate berhasil
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

      console.log('\n✅ SEMUA PIN BERHASIL DIGENERATE!');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
    console.log('\n SELESAI!');
    console.log('👉 Restart server: Ctrl+C lalu npm run dev');
    console.log('👉 Refresh browser: Ctrl+F5');
  }
}

main();