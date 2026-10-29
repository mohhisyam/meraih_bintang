'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPeserta() {
  const [nomor, setNomor] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch('/api/auth/peserta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nomorPeserta: nomor }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        router.push('/peserta/dashboard');
      } else {
        setError(data.error || 'Nomor peserta tidak ditemukan');
      }
    } catch (err) {
      setError('Terjadi kesalahan jaringan');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen gradient-navy flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md">
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto gradient-gold rounded-full flex items-center justify-center text-2xl font-bold text-navy mb-3">MB</div>
          <h1 className="text-2xl font-bold text-navy">Login Peserta</h1>
          <p className="text-sm text-slate-500">Try Out Perangkat Desa Payaman</p>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nomor Peserta</label>
            <input 
              type="text" 
              value={nomor} 
              onChange={e => setNomor(e.target.value)} 
              placeholder="Contoh: MBP-2026-0001" 
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-gold outline-none" 
              required 
              autoComplete="off"
            />
          </div>
          
          {error && (
            <p className="text-red-500 text-sm bg-red-50 p-2 rounded">{error}</p>
          )}
          
          <button 
            type="submit" 
            disabled={loading} 
            className="w-full py-3 gradient-gold text-navy font-bold rounded-lg hover:opacity-90 disabled:opacity-50"
          >
            {loading ? 'Memproses...' : 'Masuk'}
          </button>
        </form>
      </div>
    </div>
  );
}
