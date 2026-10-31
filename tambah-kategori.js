const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function tambahKategori() {
  // Daftar kategori sesuai permintaan kakak
  const kategoriList = [
    { nama: 'Pemerintahan Desa', deskripsi: 'Materi seputar Pemerintahan Desa' },
    { nama: 'Pancasila dan UUD', deskripsi: 'Materi Pancasila dan Undang-Undang Dasar' },
    { nama: 'Administrasi Perkantoran', deskripsi: 'Materi Administrasi dan Tata Naskah Dinas' },
    { nama: 'Pengetahuan Komputer', deskripsi: 'Materi Teknologi Informasi dan Komputer' },
    { nama: 'Pengetahuan Agama', deskripsi: 'Materi Keagamaan' },
    { nama: 'Pengetahuan Umum', deskripsi: 'Materi Pengetahuan Umum dan Wawasan Kebangsaan' },
  ];

  try {
    console.log('🔄 Menambahkan kategori ke database...\n');
    
    for (const kat of kategoriList) {
      const existing = await prisma.kategoriSoal.findUnique({
        where: { nama: kat.nama }
      });

      if (!existing) {
        await prisma.kategoriSoal.create({ data: kat });
        console.log(`✅ Kategori "${kat.nama}" berhasil ditambahkan`);
      } else {
        console.log(`⏭️ Kategori "${kat.nama}" sudah ada, dilewati`);
      }
    }

    console.log('\n🎉 Selesai! Semua kategori sudah tersedia di database.');
    console.log('👉 Silakan refresh halaman "Bank Soal" atau "Tambah Soal" di website.');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

tambahKategori();