import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore.js';
import { 
  Home,
  MessageCircleHeart, 
  Camera, 
  MapPin, 
  UserCheck, 
  LogOut, 
  Heart, 
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { formatDateIndonesian } from '../../utils/dateUtils.js';

export const Sidebar = ({ onOpenLovePoke }) => {
  const { user, partner, space, logout } = useAuthStore();

  const navItems = [
    { to: '/', label: 'Beranda Cinta', icon: Home, desc: 'Ikhtisar & Kabar Pasangan' },
    { to: '/chat', label: 'Ruang Obrolan', icon: MessageCircleHeart, desc: 'Pesan & Colekan Manis' },
    { to: '/pap', label: 'PAP Kita 📸', icon: Camera, desc: 'Foto, Lokasi & Baterai HP' },
    { to: '/location', label: 'Lokasi & Kabar', icon: MapPin, desc: 'Peta Berbagi Saling Rela' },
    { to: '/profile', label: 'Pengaturan & Profil', icon: UserCheck, desc: 'Profil & Ruang Cinta' },
  ];

  return (
    <aside className="hidden md:flex flex-col w-72 lg:w-80 h-screen sticky top-0 border-r border-charcoal-700/60 glass-panel p-5 overflow-y-auto">
      {/* Brand Header */}
      <div className="flex items-center gap-3 pb-6 border-b border-charcoal-700/50">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-romantic-600 via-rose-500 to-plum-600 flex items-center justify-center text-white shadow-lg shadow-romantic-600/25">
          <Heart className="w-6 h-6 fill-white animate-heartbeat" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-100 tracking-tight flex items-center gap-1.5">
            Our Space
            <span className="text-xs px-2 py-0.5 rounded-full bg-plum-900/70 text-romantic-300 border border-plum-700/50 font-normal">
              Private
            </span>
          </h2>
          <p className="text-xs text-charcoal-500 dark:text-slate-400">
            {space?.name || 'Ruang Cinta Kita'}
          </p>
        </div>
      </div>

      {/* Couple Mini Profile Card */}
      <div className="my-5 p-4 rounded-2xl glass-card border border-charcoal-700/50 bg-charcoal-900/40">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-medium uppercase tracking-wider text-charcoal-500 dark:text-slate-400 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-romantic-400" />
            Dua Hati Satu Ruang
          </span>
          <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            Privat Berdua
          </span>
        </div>

        <div className="flex items-center justify-around py-2">
          {/* User A (Me) */}
          <div className="flex flex-col items-center">
            <div className="relative">
              <img
                src={user?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop'}
                alt={user?.nickname}
                className="w-12 h-12 rounded-full object-cover ring-2 ring-romantic-500/40 shadow"
              />
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-charcoal-900 rounded-full" />
            </div>
            <span className="text-xs font-semibold text-slate-200 mt-1.5">{user?.nickname || 'Asit'}</span>
            <span className="text-[10px] text-slate-400">Kamu</span>
          </div>

          <div className="flex flex-col items-center justify-center px-2">
            <Heart className="w-5 h-5 text-romantic-500 fill-romantic-500/30 animate-pulse-subtle" />
            <span className="text-[10px] text-romantic-300 mt-1 font-mono">
              {space?.anniversary_date ? formatDateIndonesian(space.anniversary_date).slice(-4) : '2023'}
            </span>
          </div>

          {/* User B (Partner) */}
          <div className="flex flex-col items-center">
            <div className="relative">
              <img
                src={partner?.avatar_url || 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop'}
                alt={partner?.nickname}
                className="w-12 h-12 rounded-full object-cover ring-2 ring-plum-500/40 shadow"
              />
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-charcoal-900 rounded-full" />
            </div>
            <span className="text-xs font-semibold text-slate-200 mt-1.5">{partner?.nickname || 'Nisya'}</span>
            <span className="text-[10px] text-slate-400">Pasangan</span>
          </div>
        </div>

        {/* Quick Love Poke action button */}
        {onOpenLovePoke && (
          <button
            onClick={onOpenLovePoke}
            className="w-full mt-3 py-2 px-3 rounded-xl text-xs font-medium bg-gradient-to-r from-romantic-600/20 to-plum-600/20 hover:from-romantic-600/30 hover:to-plum-600/30 text-romantic-300 border border-romantic-500/30 transition-all flex items-center justify-center gap-1.5 active:scale-98 shadow-sm"
          >
            <Heart className="w-3.5 h-3.5 fill-romantic-400 text-romantic-400" />
            Kirim Colekan Manis ke {partner?.nickname || 'Nisya'}
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3.5 px-3.5 py-3 rounded-2xl transition-all group ${
                  isActive
                    ? 'bg-romantic-500/15 text-romantic-200 font-medium border border-romantic-500/30 shadow-sm'
                    : 'text-slate-300 hover:text-slate-100 hover:bg-charcoal-800/60 border border-transparent'
                }`
              }
            >
              <div className="p-2 rounded-xl bg-charcoal-800/80 group-hover:bg-charcoal-700/80 transition-colors">
                <Icon className="w-4 h-4 text-romantic-400" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium tracking-tight leading-tight">{item.label}</span>
                <span className="text-[11px] text-slate-400 leading-tight">{item.desc}</span>
              </div>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer / Logout */}
      <div className="pt-4 mt-auto border-t border-charcoal-700/50">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium text-slate-400 hover:text-rose-300 hover:bg-rose-500/10 transition-all"
        >
          <LogOut className="w-4 h-4" />
          Keluar dari Ruang
        </button>
      </div>
    </aside>
  );
};
