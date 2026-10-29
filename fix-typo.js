const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'app', 'admin', 'peserta', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Ganti onSave(form) menjadi handleSave(form) di tombol simpan
content = content.replace(/onSave\(form\);/g, 'handleSave(form);');

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ Typo onSave diperbaiki menjadi handleSave');
console.log('👉 Refresh browser dan coba tambah peserta lagi!');
