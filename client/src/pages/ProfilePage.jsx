import React, { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore.js';
import { useThemeStore } from '../store/useThemeStore.js';
import { spaceApi, authApi } from '../api/endpoints.js';
import { ProfileSettings } from '../components/profile/ProfileSettings.jsx';
import { SpacePairingSection } from '../components/profile/SpacePairingSection.jsx';
import { RelationshipCertificate } from '../components/profile/RelationshipCertificate.jsx';
import { 
  UserCheck, 
  Moon, 
  Sun, 
  LogOut, 
  Heart, 
  Sparkles, 
  ShieldAlert, 
  ArrowLeftRight,
  ShieldCheck,
  DoorOpen
} from 'lucide-react';
import { toast } from 'sonner';

export const ProfilePage = () => {
  const { user, partner, space, logout, quickLogin, setSpace } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const [isLeaving, setIsLeaving] = useState(false);

  const handleQuickSwitch = async (role) => {
    try {
      const res = await quickLogin(role);
      toast.success(res.message || `Beralih ke akun ${role === 'asit' ? 'Asit' : 'Nisya'} ❤️`);
    } catch (err) {
      toast.error('Gagal berganti akun demo.');
    }
  };

  const handleLeaveSpace = async () => {
    if (!window.confirm('PERINGATAN: Apakah kamu yakin ingin meninggalkan ruang pasangan ini? Ruang akan kembali menunggu pasangan dan pairing harus diulang kembali.')) {
      return;
    }

    try {
      setIsLeaving(true);
      const res = await spaceApi.leaveSpace();
      if (res.success) {
        setSpace(null, null);
        toast.success(res.message || 'Kamu telah keluar dari ruang pasangan.');
      }
    } catch (err) {
      toast.error(err.message || 'Gagal meninggalkan ruang.');
    } finally {
      setIsLeaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-charcoal-800">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-gradient-to-tr from-romantic-600 to-plum-600 text-white shadow-lg shadow-romantic-600/20">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
              Pengaturan &amp; Profil
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-plum-900/60 text-romantic-300 border border-plum-700/50 font-normal">
                {user?.nickname || 'Asit'}
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Kelola profil intim dan koneksi ruang cinta kita
            </p>
          </div>
        </div>

        {/* Theme Toggle & Logout */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="px-3.5 py-2 rounded-xl text-xs font-medium bg-charcoal-850 hover:bg-charcoal-800 text-slate-300 border border-charcoal-700/80 transition-colors flex items-center gap-1.5"
            title="Ganti Tema"
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-300" />
                Mode Gelap
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-plum-400" />
                Mode Plum
              </>
            )}
          </button>

          <button
            onClick={logout}
            className="px-3.5 py-2 rounded-xl text-xs font-medium bg-charcoal-850 hover:bg-rose-500/10 text-slate-400 hover:text-rose-300 border border-charcoal-700/80 hover:border-rose-500/30 transition-all flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            Keluar
          </button>
        </div>
      </div>

      {/* Quick Account Switcher Card (Convenient testing for pairwise evaluation) */}
      <div className="p-4 rounded-3xl glass-card border border-charcoal-700/60 bg-gradient-to-r from-plum-950/40 via-charcoal-900 to-plum-950/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-romantic-500/15 text-romantic-400">
              <ArrowLeftRight className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-slate-200">
                Peralihan Cepat Antara Asit &amp; Nisya
              </h4>
              <p className="text-[11px] text-slate-400">
                Uji coba interaksi kedua belah pihak secara langsung dalam satu klik
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleQuickSwitch('asit')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 border ${
                user?.nickname?.toLowerCase() === 'asit'
                  ? 'bg-romantic-600 text-white border-romantic-500 shadow-sm'
                  : 'bg-charcoal-800 text-slate-300 border-charcoal-700 hover:bg-charcoal-750'
              }`}
            >
              <span>Sebagai Asit</span>
              {user?.nickname?.toLowerCase() === 'asit' && <span className="text-[10px] bg-white/20 px-1 rounded-full">Aktif</span>}
            </button>

            <button
              onClick={() => handleQuickSwitch('nisya')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 border ${
                user?.nickname?.toLowerCase() === 'nisya'
                  ? 'bg-plum-600 text-white border-plum-500 shadow-sm'
                  : 'bg-charcoal-800 text-slate-300 border-charcoal-700 hover:bg-charcoal-750'
              }`}
            >
              <span>Sebagai Nisya</span>
              {user?.nickname?.toLowerCase() === 'nisya' && <span className="text-[10px] bg-white/20 px-1 rounded-full">Aktif</span>}
            </button>
          </div>
        </div>
      </div>

      {/* 1. Couple VIP Certificate of Love */}
      {space && <RelationshipCertificate />}

      {/* 2. Couple Pairing Section (Strict 2-person limit & invite codes) */}
      <SpacePairingSection />

      {/* 2. Profile Details & Space Settings Form */}
      <ProfileSettings />

      {/* 3. Leave Space / Unpairing Danger Zone */}
      {space && (
        <div className="p-5 rounded-3xl glass-card border border-rose-500/30 bg-rose-950/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-2xl bg-rose-500/15 text-rose-400 border border-rose-500/30">
                <DoorOpen className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-rose-200">
                  Tinggalkan Ruang Pasangan
                </h4>
                <p className="text-xs text-rose-300/80 mt-0.5 leading-relaxed">
                  Jika kamu dan pasangan memutuskan untuk memisahkan ruang, kamu dapat meninggalkan ruang ini. Status pairing akan dinonaktifkan.
                </p>
              </div>
            </div>

            <button
              onClick={handleLeaveSpace}
              disabled={isLeaving}
              className="px-4 py-2.5 rounded-xl text-xs font-medium bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/30 transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50 shrink-0 self-start sm:self-auto"
            >
              <DoorOpen className="w-4 h-4" />
              {isLeaving ? 'Memproses...' : 'Tinggalkan Ruang'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
