import { PrismaClient } from '@prisma/client';
import { PrismaLibSQL } from '@prisma/adapter-libsql';
import { createClient } from '@libsql/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const dbUrl = process.env.TURSO_URL || process.env.DATABASE_URL || 'file:./dev.db';
const authToken = process.env.TURSO_AUTH_TOKEN;

let prisma: PrismaClient;

if (dbUrl && (dbUrl.startsWith('libsql://') || dbUrl.startsWith('http://') || dbUrl.startsWith('https://'))) {
  const tursoClient = createClient({
    url: dbUrl,
    authToken: authToken,
  });
  const adapter = new PrismaLibSQL(tursoClient);
  
  prisma = new PrismaClient({ adapter });
  console.log('✅ Menggunakan database Turso Cloud (via Adapter)');
} else {
  prisma = new PrismaClient();
  console.log('💾 Menggunakan database SQLite Lokal');
}

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;