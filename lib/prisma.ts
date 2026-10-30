import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import { createClient } from '@libsql/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const url = process.env.DATABASE_URL || 'file:./dev.db';
const authToken = process.env.TURSO_AUTH_TOKEN;

let prisma: PrismaClient;

if (url.startsWith('libsql://') || url.startsWith('http://') || url.startsWith('https://')) {
  // Inisialisasi client dan adapter dalam satu langkah untuk mencegah referensi undefined
  const tursoClient = createClient({ url, authToken });
  const adapter = new PrismaLibSql(tursoClient);
  
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