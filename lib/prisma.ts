import { PrismaClient } from '@prisma/client';
import { PrismaLibSQL } from '@prisma/adapter-libsql'; // <-- KEMBALI KE KAPITAL (SQL)
import { createClient } from '@libsql/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const url = process.env.DATABASE_URL || 'file:./dev.db';
const authToken = process.env.TURSO_AUTH_TOKEN;

let prisma: PrismaClient;

if (url.startsWith('libsql://') || url.startsWith('http://') || url.startsWith('https://')) {
  // 1. Buat client libsql
  const tursoClient = createClient({ url, authToken });
  
  // 2. Berikan ke adapter (dengan nama PrismaLibSQL yang sesuai versi 5.22.0)
  const adapter = new PrismaLibSQL(tursoClient);
  
  // 3. Berikan adapter ke PrismaClient
  prisma = new PrismaClient({ adapter });
  console.log('✅ Menggunakan database Turso Cloud');
} else {
  prisma = new PrismaClient();
  console.log('💾 Menggunakan database SQLite Lokal');
}

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;