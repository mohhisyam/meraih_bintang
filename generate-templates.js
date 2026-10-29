const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

console.log('📄 Membuat template Excel...\n');

// ==========================================
// 1. TEMPLATE PESERTA
// ==========================================
const pesertaData = [
  { 
    nama: 'Budi Santoso', 
    tempat_lahir: 'Jakarta', 
    tanggal_lahir: '1990-01-01', 
    alamat: 'Jl. Merdeka No. 1, RT 01/RW 02', 
    whatsapp: '081234567890' 
  },
  { 
    nama: 'Siti Aminah', 
    tempat_lahir: 'Bandung', 
    tanggal_lahir: '1992-05-15', 
    alamat: 'Jl. Sudirman No. 2', 
    whatsapp: '089876543210' 
  }
];

const pesertaWs = XLSX.utils.json_to_sheet(pesertaData);
const pesertaWb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(pesertaWb, pesertaWs, "Data Peserta");
XLSX.writeFile(pesertaWb, path.join(__dirname, 'template-peserta.xlsx'));
console.log('✅ template-peserta.xlsx berhasil dibuat');

// ==========================================
// 2. TEMPLATE SOAL
// ==========================================
const soalData = [
  { 
    kategori: 'Pancasila dan UUD 1945', 
    pertanyaan: 'Apa dasar negara Republik Indonesia?', 
    A: 'Pancasila', 
    B: 'UUD 1945', 
    C: 'Bhineka Tunggal Ika', 
    D: 'Garuda Pancasila', 
    E: 'Merah Putih', 
    kunci: 'A', 
    bobot: 1 
  },
  { 
    kategori: 'Bahasa Indonesia', 
    pertanyaan: 'Manakah di bawah ini yang merupakan kalimat efektif?', 
    A: 'Para siswa-siswa sedang belajar di kelas.', 
    B: 'Siswa sedang belajar di kelas.', 
    C: 'Para siswa sedang belajar-belajar di kelas.', 
    D: 'Siswa-siswa para sedang belajar.', 
    E: 'Belajar siswa di kelas sedang.', 
    kunci: 'B', 
    bobot: 1 
  },
  { 
    kategori: 'Pemerintahan Desa', 
    pertanyaan: 'Berapa lama masa jabatan Kepala Desa?', 
    A: '3 Tahun', 
    B: '4 Tahun', 
    C: '5 Tahun', 
    D: '6 Tahun', 
    E: '7 Tahun', 
    kunci: 'D', 
    bobot: 2 
  }
];

const soalWs = XLSX.utils.json_to_sheet(soalData);
const soalWb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(soalWb, soalWs, "Bank Soal");
XLSX.writeFile(soalWb, path.join(__dirname, 'template-soal.xlsx'));
console.log('✅ template-soal.xlsx berhasil dibuat');

console.log('\n🎉 Selesai! Silakan buka file Excel tersebut di folder proyek Anda.');