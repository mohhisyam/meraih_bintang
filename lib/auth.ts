import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
const SECRET = process.env.JWT_SECRET || 'default-secret';
export async function hashPassword(p: string) { return bcrypt.hash(p, 12); }
export async function verifyPassword(p: string, h: string) { return bcrypt.compare(p, h); }
export function signToken(payload: any) { return jwt.sign(payload, SECRET, { expiresIn: '8h' }); }
export function verifyToken(token: string) { try { return jwt.verify(token, SECRET) as any; } catch { return null; } }
export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('mb_token')?.value;
  if (!token) return null;
  return verifyToken(token);
}
export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') throw new Error('Unauthorized');
  return user;
}
export async function requirePeserta() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'peserta') throw new Error('Unauthorized');
  return user;
}
export function generateNomorPeserta(index: number) { return `MBP-${new Date().getFullYear()}-${String(index).padStart(4, '0')}`; }
export function generatePin() { return Math.floor(100000 + Math.random() * 900000).toString(); }

// Generate token untuk sesi ujian
export function generateToken(): string {
  return 'TKN-' + Date.now() + '-' + Math.random().toString(36).substring(2, 10).toUpperCase();
}
