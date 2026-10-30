import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql'; // Nama export yang benar (huruf 'l' kecil)
import { createClient } from '@libsql/client';         // Wajib import createClient

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const url = process.env.DATABASE_URL || 'file:./dev.db';
const authToken = process.env.TURSO_AUTH_TOKEN;

let prisma: PrismaClient;

// KONDISI 1: Jika URL adalah Turso (Vercel/Production)
if (url.startsWith('libsql://') || url.startsWith('http://') || url.startsWith('https://')) {
  // 1. Buat instance client libsql terlebih dahulu
  const client = createClient({
    url,
    authToken,
  });
  
  // 2. Berikan instance client tersebut ke adapter
  const adapter = new PrismaLibSql(client);
  
  // 3. Berikan adapter yang valid ke PrismaClient
  prisma = new PrismaClient({ adapter });
  console.log('✅ Menggunakan database Turso Cloud');
} 
// KONDISI 2: Jika URL adalah SQLite Lokal (Development di komputer)
else {
  // Inisialisasi tanpa adapter untuk SQLite lokal
  prisma = new PrismaClient();
  console.log('💾 Menggunakan database SQLite Lokal');
}

// Cegah multiple instance di development
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;