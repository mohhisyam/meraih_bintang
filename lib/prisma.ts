import { PrismaClient } from '@prisma/client';
import { PrismaLibSQL } from '@prisma/adapter-libsql';
import { createClient } from '@libsql/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// .trim() akan menghapus spasi/enter tersembunyi di awal/akhir
const url = (process.env.DATABASE_URL || 'file:./dev.db').trim();
const authToken = (process.env.TURSO_AUTH_TOKEN || '').trim();

let prisma: PrismaClient;

// Jika URL dimulai dengan libsql:// (Artinya di Vercel/Production)
if (url.startsWith('libsql://')) {
  const client = createClient({
    url: url,
    authToken: authToken,
  });
  const adapter = new PrismaLibSQL(client);
  prisma = new PrismaClient({ adapter });
  console.log('✅ Terhubung ke Turso Cloud');
} else {
  // Jika di komputer lokal (Development)
  prisma = new PrismaClient();
  console.log('💾 Menggunakan database SQLite Lokal');
}

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;