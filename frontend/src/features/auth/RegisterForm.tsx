import { useState } from 'react';
import { motion } from 'motion/react';
import { authApi, setToken } from '../../shared/lib/apiClient';

export default function RegisterForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) { setError('Password tidak cocok'); return; }
    if (password.length < 8) { setError('Password minimal 8 karakter'); return; }
    setLoading(true);
    const result = await authApi.register(email, password, name);
    if (result.error) { setError(result.error); setLoading(false); return; }
    if (result.data) { setToken(result.data.accessToken); window.location.href = '/dashboard'; }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-3xl p-8 md:p-10 shadow-xl shadow-primary-100/40 border border-primary-100">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-bold mx-auto mb-4">NS</div>
          <h1 className="text-2xl font-bold text-gray-900">Buat Akun Baru</h1>
          <p className="text-gray-500 text-sm mt-2">Mulai pantau nutrisi makanan Anda</p>
        </div>

        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm text-center">{error}</motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nama Lengkap</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input-field" placeholder="Nama lengkap Anda" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field" placeholder="nama@email.com" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input-field" placeholder="Minimal 8 karakter" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Konfirmasi Password</label>
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="input-field" placeholder="Ulangi password" required />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                  <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75" />
                </svg>Memproses...
              </span>
            ) : 'Buat Akun'}
          </button>
        </form>

        <p className="text-center text-gray-500 text-sm mt-6">
          Sudah punya akun?{' '}<a href="/login" className="text-primary-600 hover:text-primary-700 font-medium transition-colors">Masuk</a>
        </p>
      </div>
    </motion.div>
  );
}
