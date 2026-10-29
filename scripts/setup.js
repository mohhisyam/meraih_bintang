const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const readline = require('readline');
const prisma = new PrismaClient();
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const question = (q) => new Promise(resolve => rl.question(q, resolve));
async function main() {
  console.log('\n=== SETUP ADMIN ===');
  const existing = await prisma.admin.findFirst();
  if (existing) { console.log('Admin sudah ada.'); rl.close(); return; }
  const setupPin = process.env.ADMIN_SETUP_PIN || 'MeraihBintang2026!';
  const inputPin = await question(`PIN Setup (default ${setupPin}): `);
  if ((inputPin.trim() || setupPin) !== setupPin) { console.log('Salah.'); rl.close(); return; }
  const u = await question('Username: ');
  const n = await question('Nama: ');
  const p = await question('Password (min 8): ');
  if (p.length < 8) { console.log('Kurang panjang.'); rl.close(); return; }
  await prisma.admin.create({ data: { username: u.trim(), namaLengkap: n.trim(), passwordHash: await bcrypt.hash(p, 12) } });
  const cats = ['Pancasila','Pemdes','Perundang-undangan','Bahasa Indonesia','Pengetahuan Umum','TKD'];
  for (const c of cats) await prisma.kategoriSoal.upsert({ where: { nama: c }, update: {}, create: { nama: c } });
  console.log('✅ Sukses! Login di http://localhost:3000/admin/login');
  rl.close();
}
main().catch(e => console.error(e)).finally(() => prisma.$disconnect());