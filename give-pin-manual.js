const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log(' Mencari peserta tanpa PIN...\n');
  
  const pesertaTanpaPin = await prisma.peserta.findMany({
    where: {
      OR: [
        { pinPlain: '' },
        { pinPlain: null }
      ]
    }
  });
  
  if (pesertaTanpaPin.length === 0) {
    console.log('✅ Semua peserta sudah punya PIN!');
  } else {
    console.log(`📋 Ditemukan ${pesertaTanpaPin.length} peserta tanpa PIN\n`);
    
    for (const p of pesertaTanpaPin) {
      const pinBaru = Math.floor(100000 + Math.random() * 900000).toString();
      
      await prisma.peserta.update({
        where: { id: p.id },
        data: { pinPlain: pinBaru }
      });
      
      console.log(`✅ ${p.namaLengkap} (${p.nomorPeserta}) → PIN: ${pinBaru}`);
    }
    
    console.log('\n🎉 Selesai! Refresh browser (Ctrl+F5)');
  }
  
  await prisma.$disconnect();
}

main().catch(console.error);