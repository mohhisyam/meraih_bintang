const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Mencari peserta yang belum punya PIN...\n');
  
  // Cari semua peserta yang pinPlain-nya kosong
  const pesertaLama = await prisma.peserta.findMany({
    where: {
      OR: [
        { pinPlain: '' },
        { pinPlain: null }
      ]
    }
  });
  
  if (pesertaLama.length === 0) {
    console.log('✅ Semua peserta sudah punya PIN. Tidak ada yang perlu diupdate.');
    return;
  }
  
  console.log(`📋 Ditemukan ${pesertaLama.length} peserta yang perlu diupdate PIN.\n`);
  console.log('='.repeat(60));
  console.log('DAFTAR PIN BARU (SIMPAN INI!):');
  console.log('='.repeat(60));
  
  const daftarPIN = [];
  
  for (const p of pesertaLama) {
    // Generate PIN 6 digit
    const pinBaru = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Update database
    await prisma.peserta.update({
      where: { id: p.id },
      data: { pinPlain: pinBaru }
    });
    
    daftarPIN.push({ nomor: p.nomorPeserta, nama: p.namaLengkap, pin: pinBaru });
    console.log(`👤 ${p.namaLengkap}`);
    console.log(`   Nomor: ${p.nomorPeserta}`);
    console.log(`   PIN:   ${pinBaru}`);
    console.log('-'.repeat(60));
  }
  
  // Simpan juga ke file CSV agar bisa diunduh
  const csv = 'Nomor Peserta,Nama,PIN\n' + daftarPIN.map(d => `${d.nomor},${d.nama},${d.pin}`).join('\n');
  const fs = require('fs');
  const path = require('path');
  fs.writeFileSync(path.join(__dirname, 'daftar-pin-peserta.csv'), csv, 'utf8');
  
  console.log('\n✅ SEMUA PIN BERHASIL DIUPDATE!');
  console.log('📄 File CSV juga disimpan: daftar-pin-peserta.csv');
  console.log('\n👉 Refresh halaman Data Peserta di browser, PIN akan muncul!');
}

main()
  .catch(e => console.error('❌ Error:', e))
  .finally(() => prisma.$disconnect());