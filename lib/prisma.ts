import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import { createClient } from '@libsql/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Konfigurasi database
const url = process.env.DATABASE_URL || 'file:./dev.db';
const authToken = process.env.TURSO_AUTH_TOKEN;

// PERBAIKAN: Inisialisasi dengan null, bukan undefined
let adapter: any = null;

// Jika URL adalah Turso (libsql:// atau https://), gunakan adapter
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
    adapter = null; // Fallback ke null jika error
  }
} else {
  console.log('💾 Menggunakan database SQLite Lokal');
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  adapter: adapter || undefined, // PERBAIKAN: Kirim undefined jika adapter null
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;