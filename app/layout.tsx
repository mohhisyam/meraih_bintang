import './globals.css'; import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Try Out Meraih Bintang', description: 'Persiapkan Diri, Raih Prestasi.' };
export default function RootLayout({ children }: { children: React.ReactNode }) { return <html lang="id"><body className="bg-slate-50 min-h-screen">{children}</body></html>; }