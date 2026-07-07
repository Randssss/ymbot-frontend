import { useState } from 'react';
import axios from 'axios';

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) return setError('Isi NIM dan password dulu ya!');
    setLoading(true);
    setError('');
    try {
      await axios.post('https://ymbot-backend-production.up.railway.app/api/login', { username, password });
      onLogin(username);
    } catch (err) {
      setError('Login gagal! Cek NIM dan password kamu.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4 font-sans">
      
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-100 rounded-full opacity-40 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-100 rounded-full opacity-40 blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        
        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl shadow-indigo-100/50 border border-gray-100 p-8">
          
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-3xl shadow-lg shadow-indigo-200 mb-4">🎓</div>
            <h1 className="text-2xl font-bold text-gray-900">YMBot</h1>
            <p className="text-sm text-gray-500 mt-1">Asisten Akademik Universitas Yatsi Madani</p>
          </div>

          {/* Form */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">NIM / Username</label>
              <input
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
                placeholder="Masukkan NIM kamu"
                value={username}
                onChange={e => setUsername(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Password</label>
              <div className="relative">
                <input
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all pr-12"
                  type={showPass ? 'text' : 'password'}
                  placeholder="Password LMS kamu"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleLogin()}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors text-sm p-1">
                  {showPass ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
                <span>⚠️</span> {error}
              </div>
            )}

            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-purple-600 text-white font-semibold rounded-xl text-sm transition-all shadow-md shadow-indigo-200 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed mt-2">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Sedang Login & Ambil Data...
                </span>
              ) : (
                '🚀 Masuk ke YMBot'
              )}
            </button>
          </div>

          {/* Info */}
          <div className="mt-6 p-4 bg-indigo-50 rounded-xl">
            <p className="text-xs text-indigo-600 text-center leading-relaxed">
              🔐 Login menggunakan akun LMS UYM kamu.<br/>
              Data hanya diproses di perangkat kamu sendiri.
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 mt-6">
          © 2026 Universitas Yatsi Madani · YMBot Academic Assistant
        </p>
      </div>
    </div>
  );
}