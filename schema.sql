-- CreateTable
CREATE TABLE "Admin" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "namaLengkap" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Peserta" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nomorPeserta" TEXT NOT NULL,
    "namaLengkap" TEXT NOT NULL,
    "tempatLahir" TEXT,
    "tanggalLahir" DATETIME,
    "alamat" TEXT,
    "whatsapp" TEXT,
    "foto" TEXT,
    "statusAktif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "KategoriSoal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nama" TEXT NOT NULL,
    "deskripsi" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Soal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "kategoriId" TEXT NOT NULL,
    "pertanyaan" TEXT NOT NULL,
    "pilihanA" TEXT NOT NULL,
    "pilihanB" TEXT NOT NULL,
    "pilihanC" TEXT NOT NULL,
    "pilihanD" TEXT NOT NULL,
    "pilihanE" TEXT NOT NULL,
    "kunciJawaban" TEXT NOT NULL,
    "bobot" INTEGER NOT NULL DEFAULT 1,
    "gambar" TEXT,
    "pembahasan" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Soal_kategoriId_fkey" FOREIGN KEY ("kategoriId") REFERENCES "KategoriSoal" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Ujian" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nama" TEXT NOT NULL,
    "deskripsi" TEXT,
    "tanggalMulai" DATETIME NOT NULL,
    "tanggalSelesai" DATETIME NOT NULL,
    "durasiMenit" INTEGER NOT NULL,
    "acakSoal" BOOLEAN NOT NULL DEFAULT false,
    "acakJawaban" BOOLEAN NOT NULL DEFAULT false,
    "passingGrade" INTEGER NOT NULL DEFAULT 70,
    "tampilkanNilai" BOOLEAN NOT NULL DEFAULT true,
    "tampilkanPembahasan" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SoalUjian" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ujianId" TEXT NOT NULL,
    "soalId" TEXT NOT NULL,
    "urutan" INTEGER NOT NULL,
    "bobot" INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "SoalUjian_ujianId_fkey" FOREIGN KEY ("ujianId") REFERENCES "Ujian" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SoalUjian_soalId_fkey" FOREIGN KEY ("soalId") REFERENCES "Soal" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SesiUjian" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pesertaId" TEXT NOT NULL,
    "ujianId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "waktuMulai" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "waktuSelesai" DATETIME,
    "durasiDetik" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'aktif',
    "jawabanTersimpan" TEXT NOT NULL DEFAULT '{}',
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SesiUjian_pesertaId_fkey" FOREIGN KEY ("pesertaId") REFERENCES "Peserta" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SesiUjian_ujianId_fkey" FOREIGN KEY ("ujianId") REFERENCES "Ujian" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Jawaban" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sesiId" TEXT NOT NULL,
    "soalUjianId" TEXT NOT NULL,
    "jawaban" TEXT,
    "benar" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Hasil" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sesiId" TEXT NOT NULL,
    "pesertaId" TEXT NOT NULL,
    "ujianId" TEXT NOT NULL,
    "totalSoal" INTEGER NOT NULL,
    "jawabanBenar" INTEGER NOT NULL,
    "jawabanSalah" INTEGER NOT NULL,
    "tidakDijawab" INTEGER NOT NULL,
    "totalBobot" INTEGER NOT NULL,
    "bobotDidapat" INTEGER NOT NULL,
    "nilai" REAL NOT NULL,
    "statusTarget" TEXT NOT NULL,
    "peringkat" INTEGER,
    "selesaiPada" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Hasil_pesertaId_fkey" FOREIGN KEY ("pesertaId") REFERENCES "Peserta" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Hasil_ujianId_fkey" FOREIGN KEY ("ujianId") REFERENCES "Ujian" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Pengumuman" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "judul" TEXT NOT NULL,
    "isi" TEXT NOT NULL,
    "prioritas" TEXT NOT NULL DEFAULT 'normal',
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "LogAktivitas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "userType" TEXT,
    "aksi" TEXT NOT NULL,
    "detail" TEXT,
    "ip" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Pengaturan" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "value" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Admin_username_key" ON "Admin"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Peserta_nomorPeserta_key" ON "Peserta"("nomorPeserta");

-- CreateIndex
CREATE UNIQUE INDEX "KategoriSoal_nama_key" ON "KategoriSoal"("nama");

-- CreateIndex
CREATE UNIQUE INDEX "SoalUjian_ujianId_soalId_key" ON "SoalUjian"("ujianId", "soalId");

-- CreateIndex
CREATE UNIQUE INDEX "SesiUjian_token_key" ON "SesiUjian"("token");

-- CreateIndex
CREATE UNIQUE INDEX "SesiUjian_pesertaId_ujianId_status_key" ON "SesiUjian"("pesertaId", "ujianId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Jawaban_sesiId_soalUjianId_key" ON "Jawaban"("sesiId", "soalUjianId");

-- CreateIndex
CREATE UNIQUE INDEX "Hasil_sesiId_key" ON "Hasil"("sesiId");

