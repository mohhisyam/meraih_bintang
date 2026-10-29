const fs = require('fs');
const path = require('path');

// 1. Fix schema.prisma
const schemaPath = path.join(__dirname, 'prisma', 'schema.prisma');
let schema = fs.readFileSync(schemaPath, 'utf8');
schema = schema.replace(/jawabanTersimpan\s+Json\s+@default\("\{\}"\)/g, 'jawabanTersimpan String @default("{}")');
fs.writeFileSync(schemaPath, schema, 'utf8');
console.log('✅ Schema diperbaiki: Json → String');

// 2. Helper function untuk JSON serialization
const helperContent = `export function serializeJson(data: any): string {
  return JSON.stringify(data || {});
}

export function parseJson(str: string): any {
  try {
    return JSON.parse(str || '{}');
  } catch {
    return {};
  }
}
`;

const helperPath = path.join(__dirname, 'lib', 'json.ts');
fs.writeFileSync(helperPath, helperContent, 'utf8');
console.log('✅ Helper JSON dibuat: lib/json.ts');

// 3. Fix API routes yang menggunakan jawabanTersimpan
const routesToFix = [
  'app/api/peserta/jawaban/route.ts',
  'app/api/peserta/sesi-load/route.ts',
  'app/api/peserta/selesai/route.ts',
];

for (const route of routesToFix) {
  const routePath = path.join(__dirname, route);
  if (!fs.existsSync(routePath)) {
    console.log('⚠️  File tidak ditemukan:', route);
    continue;
  }
  
  let content = fs.readFileSync(routePath, 'utf8');
  
  // Tambahkan import helper di awal file (setelah import pertama)
  if (!content.includes('from \'@/lib/json\'')) {
    const importLine = `import { serializeJson, parseJson } from '@/lib/json';\n`;
    const firstImportIndex = content.indexOf('import ');
    if (firstImportIndex !== -1) {
      const nextNewline = content.indexOf('\n', firstImportIndex);
      content = content.slice(0, nextNewline + 1) + importLine + content.slice(nextNewline + 1);
    } else {
      content = importLine + content;
    }
  }
  
  // Fix: jawabanTersimpan saat membaca
  content = content.replace(
    /const\s+(\w+)\s*=\s*\((\w+)\.jawabanTersimpan\s+as\s+any\)\s*\|\|\s*\{\}/g,
    'const $1 = parseJson($2.jawabanTersimpan)'
  );
  
  content = content.replace(
    /const\s+(\w+)\s*=\s*\((\w+)\.jawabanTersimpan\)\s*as\s+any/g,
    'const $1 = parseJson($2.jawabanTersimpan as string)'
  );
  
  // Fix: jawabanTersimpan saat menulis
  content = content.replace(
    /jawabanTersimpan:\s*(\w+)/g,
    'jawabanTersimpan: serializeJson($1)'
  );
  
  fs.writeFileSync(routePath, content, 'utf8');
  console.log('✅ Route diperbaiki:', route);
}

console.log('\n🎉 Semua perbaikan selesai!');
console.log('👉 Jalankan: npx prisma db push');