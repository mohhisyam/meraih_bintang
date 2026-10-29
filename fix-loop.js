const fs = require('fs');
const path = require('path');

console.log('🔧 Memperbaiki infinite redirect loop...');

// Buat file layout khusus untuk halaman login admin agar tidak mewarisi layout utama
const loginLayoutPath = path.join(__dirname, 'app', 'admin', 'login', 'layout.tsx');
const content = `// Layout ini membatalkan layout admin utama khusus untuk halaman login
// sehingga tidak terjadi infinite redirect
export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
`;

fs.writeFileSync(loginLayoutPath, content, 'utf8');
console.log('✅ app/admin/login/layout.tsx berhasil dibuat');

// Lakukan hal yang sama untuk login peserta jika ada layout peserta
const pesertaLoginLayoutPath = path.join(__dirname, 'app', 'peserta', 'login', 'layout.tsx');
fs.writeFileSync(pesertaLoginLayoutPath, content, 'utf8');
console.log('✅ app/peserta/login/layout.tsx berhasil dibuat');

console.log('\n🎉 Perbaikan selesai!');
console.log('👉 Refresh browser Anda (Ctrl + F5) atau restart server.');