const fs = require('fs');
const path = require('path');

console.log('🔧 Memperbaiki konfigurasi Prisma untuk Vercel...\n');

const packageJsonPath = path.join(__dirname, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// Pastikan bagian scripts ada
if (!packageJson.scripts) {
  packageJson.scripts = {};
}

// Tambahkan postinstall untuk menjalankan prisma generate otomatis di Vercel
packageJson.scripts.postinstall = 'prisma generate';

// Simpan kembali ke file
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n', 'utf8');

console.log('✅ Berhasil menambahkan "postinstall": "prisma generate" ke package.json');
console.log('\n👉 LANGKAH SELANJUTNYA (Jalankan di terminal):');
console.log('   1. git add package.json');
console.log('   2. git commit -m "fix: add postinstall prisma generate for vercel"');
console.log('   3. git push');