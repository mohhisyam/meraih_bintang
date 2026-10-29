const fs = require('fs');
const path = require('path');

console.log('🔧 Perbaikan total layout login...\n');

// 1. Hapus folder .next (cache Next.js)
const nextCachePath = path.join(__dirname, '.next');
if (fs.existsSync(nextCachePath)) {
  fs.rmSync(nextCachePath, { recursive: true, force: true });
  console.log('✅ Cache .next dihapus');
}

// 2. Pastikan folder app/admin/login ada
const adminLoginDir = path.join(__dirname, 'app', 'admin', 'login');
fs.mkdirSync(adminLoginDir, { recursive: true });

// 3. Buat layout.tsx khusus untuk login admin (TANPA sidebar)
const adminLoginLayout = `// Layout kosong untuk halaman login admin
// Ini membatalkan layout admin utama sehingga sidebar tidak muncul
export default function AdminLoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
`;

fs.writeFileSync(path.join(adminLoginDir, 'layout.tsx'), adminLoginLayout, 'utf8');
console.log('✅ app/admin/login/layout.tsx dibuat');

// 4. Pastikan folder app/peserta/login ada
const pesertaLoginDir = path.join(__dirname, 'app', 'peserta', 'login');
fs.mkdirSync(pesertaLoginDir, { recursive: true });

// 5. Buat layout.tsx khusus untuk login peserta (TANPA sidebar)
const pesertaLoginLayout = `// Layout kosong untuk halaman login peserta
export default function PesertaLoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
`;

fs.writeFileSync(path.join(pesertaLoginDir, 'layout.tsx'), pesertaLoginLayout, 'utf8');
console.log('✅ app/peserta/login/layout.tsx dibuat');

// 6. Verifikasi file sudah ada
const adminLayoutExists = fs.existsSync(path.join(adminLoginDir, 'layout.tsx'));
const pesertaLayoutExists = fs.existsSync(path.join(pesertaLoginDir, 'layout.tsx'));

console.log('\n📋 Verifikasi:');
console.log(`  - app/admin/login/layout.tsx: ${adminLayoutExists ? '✅ Ada' : '❌ Tidak ada'}`);
console.log(`  - app/peserta/login/layout.tsx: ${pesertaLayoutExists ? '✅ Ada' : '❌ Tidak ada'}`);

console.log('\n🎉 Perbaikan selesai!');
console.log('👉 LANGKAH PENTING:');
console.log('   1. Tekan Ctrl+C di terminal untuk STOP server');
console.log('   2. Jalankan ulang: npm run dev');
console.log('   3. Buka http://localhost:3000/admin/login');
console.log('   4. Tekan Ctrl+Shift+R (hard refresh) di browser');