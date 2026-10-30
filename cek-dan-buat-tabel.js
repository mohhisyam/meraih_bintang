const { createClient } = require('@libsql/client');
const fs = require('fs');

// Koneksi langsung ke database Turso kakak
const client = createClient({
  url: 'libsql://meraih-bintang-mohhisyam.aws-ap-southeast-1.turso.io',
  authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3OTMyNzc5ODMsImlkIjoiMDFhMTg3YWYtMTgwMS03OWJiLTk5M2EtMzc3Nzg2M2U2MjUyIiwia2lkIjoiUVBQNmxGb2FnMk5IRVE4b1QxcS01Q3B3eURxdG1hUEk2eHN0aTNwQkdMVSIsInJpZCI6Ijk0YzAwZjg4LTVjMzMtNDc2Yi05YzMyLTc4MTU5ZjdkZTVjZiJ9.-A0WD1bp2bBEJZ2FMy7PzlZb6qACcl_ob8UwlO9vEk9rUD55iZRoRd0RJYsGYyRCRoLe9PBokJGTeVrh-dJaAA'
});

async function cekDanBuat() {
  try {
    console.log('1️⃣ Mengecek tabel yang ada di database Turso...');
    const res = await client.execute("SELECT name FROM sqlite_master WHERE type='table'");
    const tabelAda = res.rows.map(r => r.name).join(', ');
    console.log('   📋 Tabel saat ini di Turso:', tabelAda || '(KOSONG)');

    // Cek apakah tabel Pengumuman sudah ada
    const sudahAda = res.rows.some(r => r.name === 'Pengumuman' || r.name === 'pengumuman');
    
    if (sudahAda) {
      console.log('\n✅ TABEL SUDAH ADA DI TURSO!');
      console.log('⚠️ PERINGATAN: Jika Vercel masih error "no such table", berarti:');
      console.log('   1. Environment Variables di dashboard Vercel SALAH (ada typo/spasi).');
      console.log('   2. Atau Vercel belum di-Redeploy setelah Environment Variables diperbaiki.');
      return;
    }

    console.log('\n2️⃣ Tabel belum ada. Membaca file schema.sql...');
    if (!fs.existsSync('schema.sql')) {
      console.log('❌ File schema.sql TIDAK DITEMUKAN!');
      console.log('   Jalankan dulu: npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script > schema.sql');
      return;
    }

    const sql = fs.readFileSync('schema.sql', 'utf8');
    const statements = sql.split(';').map(s => s.trim()).filter(s => s.length > 0 && !s.startsWith('--'));
    console.log(`   📝 Ditemukan ${statements.length} perintah SQL.`);

    console.log('\n3️⃣ Mulai membuat tabel di Turso...');
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i] + ';';
      console.log(`   [${i+1}/${statements.length}] Menjalankan...`);
      await client.execute(stmt);
    }

    console.log('\n🎉 SUKSES! Semua tabel berhasil dibuat di Turso.');
    console.log('👉 Silakan RELOAD website Vercel kakak sekarang!');

  } catch (error) {
    console.error('\n❌ TERJADI KESALAHAN SAAT PROSES:');
    console.error(error.message);
  }
}

cekDanBuat();