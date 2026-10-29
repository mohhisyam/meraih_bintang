const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

console.log('🚀 Memulai perbaikan total sistem PIN...\n');

// 1. Pastikan schema punya pinPlain
const schemaPath = path.join(__dirname, 'prisma', 'schema.prisma');
let schema = fs.readFileSync(schemaPath, 'utf8');
if (!schema.includes('pinPlain')) {
  schema = schema.replace(/pinHash\s+String/, 'pinHash         String\n  pinPlain        String   @default("")');
  fs.writeFileSync(schemaPath, schema, 'utf8');
  console.log('✅ Schema diperbaiki: menambahkan pinPlain');
}

try {
  // 2. Update Database
  console.log('⏳ Menjalankan: npx prisma db push...');
  execSync('npx prisma db push', { stdio: 'inherit' });
  
  // 3. Generate Ulang Prisma Client (INI YANG TADI TERLEWAT)
  console.log('\n⏳ Menjalankan: npx prisma generate...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  
  console.log('\n✅ Database dan Prisma Client berhasil diperbarui!');
  
  // 4. Update PIN Peserta Lama
  console.log('\n🔧 Mencari dan mengupdate PIN peserta lama...\n');
  const prisma = new PrismaClient();
  
  const pesertaLama = await prisma.peserta.findMany({
    where: {
      OR: [
        { pinPlain: '' },
        { pinPlain: null }
      ]
    }
  });
  
  if (pesertaLama.length === 0) {
    console.log('✅ Semua peserta sudah memiliki PIN.');
  } else {
    console.log(`📋 Ditemukan ${pesertaLama.length} peserta yang perlu diupdate.\n`);
    console.log('='.repeat(60));
    console.log('DAFTAR PIN BARU (SIMPAN INI!):');
    console.log('='.repeat(60));
    
    const daftarPIN = [];
    for (const p of pesertaLama) {
      const pinBaru = Math.floor(100000 + Math.random() * 900000).toString();
      await prisma.peserta.update({
        where: { id: p.id },
        data: { pinPlain: pinBaru }
      });
      daftarPIN.push({ nomor: p.nomorPeserta, nama: p.namaLengkap, pin: pinBaru });
      console.log(`👤 ${p.namaLengkap} | No: ${p.nomorPeserta} | PIN: ${pinBaru}`);
    }
    
    const csv = 'Nomor Peserta,Nama,PIN\n' + daftarPIN.map(d => `${d.nomor},${d.nama},${d.pin}`).join('\n');
    fs.writeFileSync(path.join(__dirname, 'daftar-pin-peserta.csv'), csv, 'utf8');
    console.log('\n✅ File daftar-pin-peserta.csv berhasil dibuat di folder proyek!');
  }
  
  await prisma.$disconnect();
  console.log('\n🎉 SELESAI! Silakan restart server dan refresh browser.');
  
} catch (error) {
  console.error('\n❌ Terjadi kesalahan:', error.message);
}