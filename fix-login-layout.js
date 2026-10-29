const fs = require('fs');
const path = require('path');

console.log('🔧 Memperbaiki layout halaman login...');

// 1. Buat layout khusus untuk halaman login admin (tanpa sidebar)
const adminLoginLayout = `// Layout ini membatalkan layout admin utama untuk halaman login
// sehingga sidebar tidak muncul di halaman login
export default function AdminLoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
`;

const adminLoginLayoutPath = path.join(__dirname, 'app', 'admin', 'login', 'layout.tsx');
fs.mkdirSync(path.dirname(adminLoginLayoutPath), { recursive: true });
fs.writeFileSync(adminLoginLayoutPath, adminLoginLayout, 'utf8');
console.log('✅ app/admin/login/layout.tsx dibuat (tanpa sidebar)');

// 2. Buat layout khusus untuk halaman login peserta (tanpa sidebar)
const pesertaLoginLayout = `// Layout ini membatalkan layout peserta utama untuk halaman login
export default function PesertaLoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
`;

const pesertaLoginLayoutPath = path.join(__dirname, 'app', 'peserta', 'login', 'layout.tsx');
fs.mkdirSync(path.dirname(pesertaLoginLayoutPath), { recursive: true });
fs.writeFileSync(pesertaLoginLayoutPath, pesertaLoginLayout, 'utf8');
console.log('✅ app/peserta/login/layout.tsx dibuat (tanpa sidebar)');

console.log('\n Layout login berhasil diperbaiki!');
console.log('👉 Refresh browser Anda (Ctrl + F5)');