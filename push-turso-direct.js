const fs = require('fs');

const TURSO_URL = 'https://meraih-bintang-mohhisyam.aws-ap-southeast-1.turso.io';
const TURSO_TOKEN = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3OTMyNzc5ODMsImlkIjoiMDFhMTg3YWYtMTgwMS03OWJiLTk5M2EtMzc3Nzg2M2U2MjUyIiwia2lkIjoiUVBQNmxGb2FnMk5IRVE4b1QxcS01Q3B3eURxdG1hUEk2eHN0aTNwQkdMVSIsInJpZCI6Ijk0YzAwZjg4LTVjMzMtNDc2Yi05YzMyLTc4MTU5ZjdkZTVjZiJ9.-A0WD1bp2bBEJZ2FMy7PzlZb6qACcl_ob8UwlO9vEk9rUD55iZRoRd0RJYsGYyRCRoLe9PBokJGTeVrh-dJaAA';

async function pushToTurso() {
  try {
    if (!fs.existsSync('schema.sql')) {
      console.log('❌ File schema.sql tidak ditemukan!');
      return;
    }

    const sql = fs.readFileSync('schema.sql', 'utf8');
    
    // PERBAIKAN: Hapus filter !s.startsWith('--') agar tabel tidak terlewat
    const statements = sql.split(';').map(s => s.trim()).filter(s => s.length > 0);
    
    console.log(`🚀 Ditemukan ${statements.length} perintah SQL. Mulai mengirim ke Turso...\n`);

    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i] + ';';
      console.log(`[${i + 1}/${statements.length}] Mengirim: ${stmt.substring(0, 50)}...`);

      const response = await fetch(`${TURSO_URL}/v2/pipeline`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${TURSO_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [
            {
              type: 'execute',
              stmt: { sql: stmt }
            }
          ]
        })
      });

      const data = await response.json();

      if (!response.ok || data.results?.[0]?.error) {
        console.error(`❌ Gagal pada perintah ${i + 1}:`, data.results?.[0]?.error || response.statusText);
        return;
      }
    }

    console.log('\n🎉 SUKSES! Semua tabel berhasil dibuat di database Turso!');
    console.log('👉 Silakan RELOAD website Vercel kakak sekarang!');

  } catch (error) {
    console.error('\n❌ TERJADI KESALAHAN:', error.message);
  }
}

pushToTurso();