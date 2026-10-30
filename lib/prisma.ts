import { PrismaClient } from '@prisma/client';
import { PrismaLibSQL } from '@prisma/adapter-libsql';
import { createClient } from '@libsql/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// PRIORITAS: Baca TURSO_URL dulu (untuk Vercel), baru fallback ke DATABASE_URL (untuk lokal)
const dbUrl = process.env.TURSO_URL || process.env.DATABASE_URL || 'file:./dev.db';
const authToken = process.env.TURSO_AUTH_TOKEN;

let prisma: PrismaClient;

// Jika URL adalah Turso (Vercel/Production)
if (dbUrl && (dbUrl.startsWith('libsql://') || dbUrl.startsWith('http://') || dbUrl.startsWith('https://'))) {
  const tursoClient = createClient({
    url: dbUrl,
    authToken: authToken,
  });
  const adapter = new PrismaLibSQL(tursoClient);
  
  prisma = new PrismaClient({ adapter });
  console.log('✅ Menggunakan database Turso Cloud (via Adapter)');
} 
// Jika URL adalah SQLite Lokal (Development di komputer)
else {
  prisma = new PrismaClient();
  console.log('💾 Menggunakan database SQLite Lokal');
}

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;