import { NextRequest, NextResponse } from 'next/server'; import prisma from '@/lib/prisma'; import { requirePeserta } from '@/lib/auth'; import crypto from 'crypto';
export async function POST(req: NextRequest) { try { const u = await requirePeserta(); const {ujianId} = await req.json(); const ujian = await prisma.ujian.findUnique({where:{id:ujianId},include:{soalUjian:{include:{soal:true},orderBy:{urutan:'asc'}}}});
  if(!ujian) throw new Error('Ujian tidak ditemukan');
  let sesi = await prisma.sesiUjian.findFirst({where:{pesertaId:u.id,ujianId,status:'aktif'}});
  if(!sesi) { sesi = await prisma.sesiUjian.create({data:{pesertaId:u.id,ujianId,token:crypto.randomBytes(16).toString('hex'),durasiDetik:ujian.durasiMenit*60}}); }
  const soal = ujian.soalUjian.map(s=>({soalUjianId:s.id,pertanyaan:s.soal.pertanyaan,pilihanA:s.soal.pilihanA,pilihanB:s.soal.pilihanB,pilihanC:s.soal.pilihanC,pilihanD:s.soal.pilihanD,pilihanE:s.soal.pilihanE,bobot:s.bobot}));
  return NextResponse.json({sesiId:sesi.id,soal,sisaWaktu:ujian.durasiMenit*60}); } catch(e:any){return NextResponse.json({error:e.message},{status:400});} }