import React, { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore.js';
import { Heart, Lock, Mail, Eye, EyeOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export const AuthPage = () => {
  const { login, register, quickLogin } = useAuthStore();
  const [isRegister, setIsRegister] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [nickname, setNickname] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast.error('Masukkan email dan kata sandi.');
      return;
    }

    try {
      setIsLoading(true);
      const res = await login({ email: email.trim(), password });
      toast.success(res.message || 'Selamat datang kembali ❤️');
    } catch (err) {
      toast.error(err.message || 'Gagal masuk. Periksa email dan kata sandi.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password || !fullName.trim() || !nickname.trim()) {
      toast.error('Mohon lengkapi semua data pendaftaran.');
      return;
    }

    try {
      setIsLoading(true);
      const res = await register({
        email: email.trim(),
        password,
        fullName: fullName.trim(),
        nickname: nickname.trim(),
      });
      toast.success(res.message || 'Pendaftaran berhasil!');
    } catch (err) {
      toast.error(err.message || 'Gagal mendaftar akun baru.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemo = async (role) => {
    try {
      setIsLoading(true);
      const res = await quickLogin(role);
      toast.success(res.message || `Masuk sebagai ${role === 'asit' ? 'Asit' : 'Nisya'} ❤️`);
    } catch (err) {
      toast.error(err.message || 'Gagal masuk akun demo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-charcoal-950 relative overflow-hidden select-none">
      {/* Soft ambient rose glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-romantic-500/15 rounded-full blur-[110px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-romantic-600 to-rose-500 text-white shadow-lg shadow-romantic-600/20 mb-3 animate-heartbeat">
            <Heart className="w-7 h-7 fill-white" />
          </div>

          <h1 className="text-2xl font-bold text-white tracking-tight">
            Our Space
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {isRegister
              ? 'Daftar akun untuk membuat ruang berdua'
              : 'Ruang privat eksklusif untuk kita berdua'}
          </p>
        </div>

        {/* Card */}
        <div className="rounded-3xl border border-charcoal-700/60 bg-charcoal-900/80 backdrop-blur-xl p-6 sm:p-7 shadow-2xl">
          {!isRegister ? (
            /* ================= LOGIN ================= */
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@email.com"
                    autoComplete="email"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-charcoal-800/80 border border-charcoal-700 text-slate-100 text-sm focus:outline-none focus:border-romantic-500 focus:ring-1 focus:ring-romantic-500 transition-all placeholder:text-slate-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Kata Sandi
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-charcoal-800/80 border border-charcoal-700 text-slate-100 text-sm focus:outline-none focus:border-romantic-500 focus:ring-1 focus:ring-romantic-500 transition-all placeholder:text-slate-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-romantic-600 to-rose-600 hover:from-romantic-500 hover:to-rose-500 text-white font-medium text-sm shadow-lg shadow-romantic-600/25 transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <span>Masuk</span>
                )}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setIsRegister(true)}
                  className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
                >
                  Belum punya akun? <span className="text-romantic-400 font-medium">Daftar</span>
                </button>
              </div>
            </form>
          ) : (
            /* ================= REGISTER ================= */
            <form onSubmit={handleRegister} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Nama Lengkap
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Abdul Rahman"
                    className="w-full px-3 py-2 rounded-xl bg-charcoal-800/80 border border-charcoal-700 text-slate-100 text-xs focus:outline-none focus:border-romantic-500 transition-all placeholder:text-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Panggilan
                  </label>
                  <input
                    type="text"
                    required
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="Asit"
                    className="w-full px-3 py-2 rounded-xl bg-charcoal-800/80 border border-charcoal-700 text-slate-100 text-xs focus:outline-none focus:border-romantic-500 transition-all placeholder:text-slate-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Email
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@email.com"
                    autoComplete="email"
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-charcoal-800/80 border border-charcoal-700 text-slate-100 text-xs focus:outline-none focus:border-romantic-500 transition-all placeholder:text-slate-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Kata Sandi
                </label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    autoComplete="new-password"
                    className="w-full pl-9 pr-9 py-2 rounded-xl bg-charcoal-800/80 border border-charcoal-700 text-slate-100 text-xs focus:outline-none focus:border-romantic-500 transition-all placeholder:text-slate-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-romantic-600 to-rose-600 hover:from-romantic-500 hover:to-rose-500 text-white font-medium text-xs shadow-lg shadow-romantic-600/25 transition-all flex items-center justify-center gap-1.5 active:scale-[0.98] disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <span>Daftar Akun</span>
                )}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setIsRegister(false)}
                  className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
                >
                  Sudah punya akun? <span className="text-romantic-400 font-medium">Masuk</span>
                </button>
              </div>
            </form>
          )}

          {/* Minimalist Demo Switcher */}
          <div className="mt-6 pt-4 border-t border-charcoal-800/70 flex items-center justify-between text-xs text-slate-400">
            <span>Akun demo:</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemo('asit')}
                disabled={isLoading}
                className="px-2.5 py-1 rounded-lg bg-charcoal-800 hover:bg-charcoal-700 hover:text-slate-200 text-slate-300 transition-colors"
              >
                Asit
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo('nisya')}
                disabled={isLoading}
                className="px-2.5 py-1 rounded-lg bg-charcoal-800 hover:bg-charcoal-700 hover:text-slate-200 text-slate-300 transition-colors"
              >
                Nisya
              </button>
            </div>
          </div>
        </div>

        {/* Minimal Footer */}
        <p className="text-center text-[11px] text-slate-400 mt-6 tracking-wide">
          Eksklusif berdua • Enkripsi privat
        </p>
      </div>
    </div>
  );
};
