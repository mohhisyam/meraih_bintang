import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';

const SECRET = process.env.JWT_SECRET || 'default-secret-change-me';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(payload: { id: string; role: 'admin' | 'peserta' }): string {
  return jwt.sign(payload, SECRET, { expiresIn: '8h' });
}

export function verifyToken(token: string): { id: string; role: 'admin' | 'peserta' } | null {
  try {
    return jwt.verify(token, SECRET) as any;
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<{ id: string; role: 'admin' | 'peserta' } | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('mb_token')?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') {
    throw new Error('Unauthorized');
  }
  return user;
}

export async function requirePeserta() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'peserta') {
    throw new Error('Unauthorized');
  }
  return user;
}

export function generateNomorPeserta(index: number): string {
  const year = new Date().getFullYear();
  return `MBP-${year}-${String(index).padStart(4, '0')}`;
}

export function generatePin(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}