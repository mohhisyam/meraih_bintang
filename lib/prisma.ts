import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import { createClient } from '@libsql/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const url = process.env.DATABASE_URL || 'file:./dev.db';
const authToken = process.env.TURSO_AUTH_TOKEN;

let prisma: PrismaClient;

// KONDISI 1: Jika URL adalah Turso (Vercel/Production)
if (url.startsWith('libsql://') || url.startsWith('http://') || url.startsWith('https://')) {
  const client = createClient({
    url,
    authToken,
  });
  const adapter = new PrismaLibSql(client);
  
  // Buat PrismaClient DENGAN adapter
  prisma = new PrismaClient({ adapter });
  console.log('✅ Menggunakan database Turso Cloud');
} 
// KONDISI 2: Jika URL adalah SQLite Lokal (Development di komputer)
else {
  // Buat PrismaClient TANPA properti adapter sama sekali
  prisma = new PrismaClient();
  console.log('💾 Menggunakan database SQLite Lokal');
}

// Cegah multiple instance di development
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;