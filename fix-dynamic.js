const fs = require('fs');
const path = require('path');

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const before = content;
  // Hapus baris export const dynamic = 'force-dynamic';
  content = content.replace(/export const dynamic = ['"]force-dynamic['"];?\s*/g, '');
  
  if (content !== before) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('✅ Diperbaiki:', filePath);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      fixFile(fullPath);
    }
  }
}

console.log('🔧 Memperbaiki file...');
walkDir(path.join(__dirname, 'app'));
console.log('🎉 Selesai! Silakan refresh browser atau restart "npm run dev".');