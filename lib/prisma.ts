import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import { createClient } from '@libsql/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const url = process.env.DATABASE_URL || 'file:./dev.db';
const authToken = process.env.TURSO_AUTH_TOKEN;

// Inisialisasi dengan null (bukan undefined)
let adapter: any = null;

if (url && (url.startsWith('libsql://') || url.startsWith('https://') || url.startsWith('http://'))) {
  try {
    const client = createClient({
      url,
      authToken,
    });
    adapter = new PrismaLibSql(client);
    console.log('✅ Menggunakan database Turso Cloud');
  } catch (error) {
    console.error('❌ Gagal inisialisasi adapter Turso:', error);
    adapter = null; // Pastikan tetap null jika error
  }
} else {
  console.log('💾 Menggunakan database SQLite Lokal');
}

// PERBAIKAN: Kirim variabel 'adapter' langsung. 
// Jika null, Prisma akan menerimanya untuk menonaktifkan driver adapter.
// JANGAN gunakan 'undefined' di sini!
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  adapter: adapter,
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;