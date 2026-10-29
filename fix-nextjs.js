const fs = require('fs');
const path = require('path');

console.log('🔧 Memperbaiki konfigurasi Next.js...');

// 1. Bersihkan next.config.js / next.config.ts dari konfigurasi yang bentrok
const configFiles = ['next.config.js', 'next.config.ts'];
for (const file of configFiles) {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    const cleanConfig = `/** @type {import('next').NextConfig} */
const nextConfig = {
  // Konfigurasi bersih tanpa cacheComponents yang bentrok dengan dynamic
};
module.exports = nextConfig;
`;
    // Jika file-nya .ts, sesuaikan sedikit
    const finalConfig = file.endsWith('.ts') 
      ? cleanConfig.replace('module.exports = nextConfig;', 'export default nextConfig;')
      : cleanConfig;
      
    fs.writeFileSync(filePath, finalConfig, 'utf8');
    console.log('✅ Dibersihkan:', file);
  }
}

// 2. Tambahkan kembali 'export const dynamic = "force-dynamic"' ke halaman yang butuh database
const pagesToFix = [
  'app/page.tsx',
  'app/admin/dashboard/page.tsx'
];

for (const page of pagesToFix) {
  const filePath = path.join(__dirname, page);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Hapus dulu jika ada yang salah format
    content = content.replace(/export const dynamic = ['"]force-dynamic['"];?\s*/g, '');
    
    // Tambahkan di baris setelah import terakhir
    const lines = content.split('\n');
    let lastImportIndex = 0;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim().startsWith('import ')) {
        lastImportIndex = i;
      }
    }
    
    lines.splice(lastImportIndex + 1, 0, "export const dynamic = 'force-dynamic';");
    
    fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
    console.log('✅ Ditambahkan dynamic flag ke:', page);
  }
}

console.log('\n🎉 Perbaikan Next.js selesai!');
console.log('👉 Tekan Ctrl+C di terminal, lalu jalankan: npm run dev');