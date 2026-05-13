import { useState } from 'react';
import { motion } from 'motion/react';
import { authApi, setToken } from '../../shared/lib/apiClient';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await authApi.login(email, password);
    if (result.error) { setError(result.error); setLoading(false); return; }
    if (result.data) { setToken(result.data.accessToken); window.location.href = '/dashboard'; }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-3xl p-8 md:p-10 shadow-xl shadow-primary-100/40 border border-primary-100">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-bold mx-auto mb-4">NS</div>
          <h1 className="text-2xl font-bold text-gray-900">Selamat Datang Kembali</h1>
          <p className="text-gray-500 text-sm mt-2">Masuk ke akun NutriSight Anda</p>
        </div>

        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm text-center">{error}</motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field" placeholder="nama@email.com" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input-field" placeholder="Minimal 8 karakter" required />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                  <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75" />
                </svg>Memproses...
              </span>
            ) : 'Masuk'}
          </button>
        </form>

        <p className="text-center text-gray-500 text-sm mt-6">
          Belum punya akun?{' '}<a href="/register" className="text-primary-600 hover:text-primary-700 font-medium transition-colors">Daftar Gratis</a>
        </p>
      </div>
    </motion.div>
  );
}
