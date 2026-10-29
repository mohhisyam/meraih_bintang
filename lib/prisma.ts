import { PrismaClient } from '@prisma/client';
import { PrismaLibSQL } from '@prisma/adapter-libsql';
import { createClient } from '@libsql/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Konfigurasi database: Turso (online) atau SQLite lokal
const url = process.env.DATABASE_URL || 'file:./dev.db';
const authToken = process.env.TURSO_AUTH_TOKEN;

let adapter: any = undefined;

// Jika URL adalah Turso (libsql:// atau https://), gunakan adapter
if (url.startsWith('libsql://') || url.startsWith('https://') || url.startsWith('http://')) {
  const client = createClient({
    url,
    authToken,
  });
  adapter = new PrismaLibSQL(client);
  console.log(' Menggunakan database Turso Cloud');
} else {
  console.log('💾 Menggunakan database SQLite Lokal');
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  adapter,
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
