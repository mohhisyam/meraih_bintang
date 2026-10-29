const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 TAHAP 3: Adaptasi Kode untuk Turso...\n');

// ============================================
// 1. INSTALL PACKAGE YANG DIBUTUHKAN
// ============================================
console.log(' Langkah 1: Menginstall adapter Turso...');
try {
  execSync('npm install @prisma/adapter-libsql @libsql/client', { stdio: 'inherit' });
  console.log('✅ Package berhasil diinstall\n');
} catch (e) {
  console.error('❌ Gagal install package. Pastikan internet stabil.');
  process.exit(1);
}

// ============================================
// 2. UPDATE FILE lib/prisma.ts
// ============================================
console.log('📝 Langkah 2: Mengupdate lib/prisma.ts...');
const prismaLibPath = path.join(__dirname, 'lib', 'prisma.ts');

const prismaCode = `import { PrismaClient } from '@prisma/client';
import { PrismaLibSQL } from '@prisma/adapter-libsql';
import { createClient } from '@libsql/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Konfigurasi database: Turso (online) atau SQLite lokal
const url = process.env.DATABASE_URL || 'file:./dev.db';
const authToken = process.env.TURSO_AUTH_TOKEN;

let adapter: any = undefined;

// Jika URL adalah Turso (libsql:// atau https://), gunakan adapter
if (url.startsWith('libsql://') || url.startsWith('https://') || url.startsWith('http://')) {
  const client = createClient({
    url,
    authToken,
  });
  adapter = new PrismaLibSQL(client);
  console.log(' Menggunakan database Turso Cloud');
} else {
  console.log('💾 Menggunakan database SQLite Lokal');
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  adapter,
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
`;

fs.mkdirSync(path.dirname(prismaLibPath), { recursive: true });
fs.writeFileSync(prismaLibPath, prismaCode, 'utf8');
console.log('✅ lib/prisma.ts berhasil diupdate\n');

// ============================================
// 3. UPDATE FILE .env
// ============================================
console.log('🔐 Langkah 3: Mengupdate .env...');
const envPath = path.join(__dirname, '.env');

let envContent = '';
if (fs.existsSync(envPath)) {
  envContent = fs.readFileSync(envPath, 'utf8');
}

// Hapus DATABASE_URL lama jika ada
envContent = envContent.replace(/^DATABASE_URL=.*$/m, '');

// Tambahkan konfigurasi Turso
const tursoConfig = `
# Database Turso (Cloud)
DATABASE_URL=libsql://GANTI_DENGAN_URL_TURSO
TURSO_AUTH_TOKEN=GANTI_DENGAN_TOKEN_TURSO

# JWT Secret untuk autentikasi
JWT_SECRET=rahasia-tryout-desa-2026-sangat-panjang-dan-aman
`;

envContent = envContent + '\n' + tursoConfig;

// Hapus baris kosong berlebih
envContent = envContent.replace(/\n{3,}/g, '\n\n').trim() + '\n';

fs.writeFileSync(envPath, envContent, 'utf8');
console.log('✅ .env berhasil diupdate\n');

// ============================================
// 4. UPDATE .gitignore
// ============================================
console.log('🛡️ Langkah 4: Mengupdate .gitignore...');
const gitignorePath = path.join(__dirname, '.gitignore');

let gitignoreContent = '';
if (fs.existsSync(gitignorePath)) {
  gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
}

// Tambahkan .env ke gitignore jika belum ada
if (!gitignoreContent.includes('.env')) {
  gitignoreContent += '\n# Environment variables\n.env\n.env.local\n';
  fs.writeFileSync(gitignorePath, gitignoreContent, 'utf8');
  console.log('✅ .gitignore diupdate (.env tidak akan ter-upload ke GitHub)\n');
} else {
  console.log('ℹ️  .gitignore sudah aman\n');
}

// ============================================
// SELESAI
// ============================================
console.log('═══════════════════════════════════════════');
console.log('🎉 TAHAP 3 SELESAI!');
console.log('═══════════════════════════════════════════\n');

console.log('👉 LANGKAH SELANJUTNYA (LAKUKAN MANUAL):');
console.log('');
console.log('1. Buka file .env di VS Code');
console.log('2. Ganti "GANTI_DENGAN_URL_TURSO" dengan Connection String dari Turso');
console.log('   Contoh: libsql://meraih-bintang-mohhisyam.turso.io');
console.log('');
console.log('3. Ganti "GANTI_DENGAN_TOKEN_TURSO" dengan Token dari Turso');
console.log('   Contoh: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');
console.log('');
console.log('4. Simpan file .env (Ctrl+S)');
console.log('');
console.log('5. Jalankan perintah berikut di terminal:');
console.log('   npx prisma generate');
console.log('   git add .');
console.log('   git commit -m "setup turso database"');
console.log('   git push');
console.log('');
console.log('Setelah itu, kita lanjut ke TAHAP 4: Deploy ke Vercel! 🚀');