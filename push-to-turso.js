const fs = require('fs');
const { createClient } = require('@libsql/client');

// 1. Baca file schema.sql
const sql = fs.readFileSync('schema.sql', 'utf8');

// 2. Setup koneksi ke Turso (Pastikan URL dan Token sesuai punya kakak)
const client = createClient({
  url: 'libsql://meraih-bintang-mohhisyam.aws-ap-southeast-1.turso.io',
  authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3OTMyNzc5ODMsImlkIjoiMDFhMTg3YWYtMTgwMS03OWJiLTk5M2EtMzc3Nzg2M2U2MjUyIiwia2lkIjoiUVBQNmxGb2FnMk5IRVE4b1QxcS01Q3B3eURxdG1hUEk2eHN0aTNwQkdMVSIsInJpZCI6Ijk0YzAwZjg4LTVjMzMtNDc2Yi05YzMyLTc4MTU5ZjdkZTVjZiJ9.-A0WD1bp2bBEJZ2FMy7PzlZb6qACcl_ob8UwlO9vEk9rUD55iZRoRd0RJYsGYyRCRoLe9PBokJGTeVrh-dJaAA'
});

async function pushSchema() {
  try {
    console.log('🚀 Mulai mengirim tabel ke Turso...');
    
    // Pisahkan perintah SQL berdasarkan tanda titik koma (;)
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    // Jalankan satu per satu
    for (let i = 0; i < statements.length; i++) {
      console.log(`   Menjalankan perintah ${i + 1}/${statements.length}...`);
      await client.execute(statements[i] + ';');
    }

    console.log('\n✅ SUKSES! Semua tabel (Pengumuman, Peserta, dll) sudah dibuat di Turso!');
    console.log('🎉 Silakan refresh website Vercel kakak sekarang!');
  } catch (error) {
    console.error('\n❌ GAGAL:', error.message);
  }
}

pushSchema();