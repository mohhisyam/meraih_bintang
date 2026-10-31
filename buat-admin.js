const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function buatAdmin() {
  const username = 'admin';
  const password = 'admin123'; // <-- GANTI PASSWORD INI SESUAI KEINGINAN KAKAK
  const namaLengkap = 'Administrator Utama';

  try {
    console.log('🔄 Sedang membuat akun admin...');
    
    // 1. Enkripsi password
    const passwordHash = await bcrypt.hash(password, 10);

    // 2. Cek apakah sudah ada
    const existing = await prisma.admin.findUnique({ where: { username } });
    if (existing) {
      console.log('⚠️ Akun admin sudah ada. Silakan login.');
      return;
    }

    // 3. Buat akun baru di database
    await prisma.admin.create({
      data: {
        username,
        passwordHash,
        namaLengkap,
      }
    });

    console.log('\n✅ SUKSES! Akun admin berhasil dibuat.');
    console.log('👉 Username :', username);
    console.log('👉 Password :', password);
    console.log('\n🎉 Silakan coba login di website sekarang!');

  } catch (error) {
    console.error('❌ Gagal:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

buatAdmin();