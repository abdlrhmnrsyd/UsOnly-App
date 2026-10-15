import React from 'react';
import { useAuthStore } from '../../store/useAuthStore.js';
import { useThemeStore } from '../../store/useThemeStore.js';
import { useSocketStore } from '../../store/useSocketStore.js';
import { Heart, Moon, Sun, Sparkles, Wifi, WifiOff } from 'lucide-react';

export const Header = ({ onOpenLovePoke }) => {
  const { user, partner, space } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const { isConnected, partnerOnline } = useSocketStore();

  return (
    <header className="sticky top-0 z-30 w-full glass-panel border-b border-charcoal-700/60 px-4 py-3">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* App Title & Couple Status */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-romantic-600 to-plum-600 flex items-center justify-center shadow-lg shadow-romantic-600/20 text-white">
            <Heart className="w-5 h-5 fill-white animate-heartbeat" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-semibold text-base text-slate-100 tracking-tight">
                {space?.name || 'Our Space'}
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-plum-900/60 text-romantic-300 border border-plum-700/50">
                <Sparkles className="w-3 h-3 text-romantic-400" />
                Ruang Berdua
              </span>
            </div>

            {/* Couple names & partner online indicator */}
            <div className="flex items-center gap-2 text-xs text-charcoal-500 dark:text-slate-400">
              <span>{user?.nickname || 'Kamu'}</span>
              <Heart className="w-2.5 h-2.5 text-romantic-500 fill-romantic-500 inline" />
              <span>{partner?.nickname || 'Pasangan'}</span>

              <span className="inline-flex items-center gap-1 ml-1.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    partnerOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'
                  }`}
                />
                <span className="text-[11px]">
                  {partnerOnline ? 'Online' : 'Offline'}
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Quick Love Poke Button */}
          {onOpenLovePoke && (
            <button
              onClick={onOpenLovePoke}
              className="px-3 py-1.5 rounded-xl text-xs font-medium bg-romantic-500/15 hover:bg-romantic-500/25 text-romantic-300 border border-romantic-500/30 transition-all flex items-center gap-1.5 active:scale-95 shadow-sm"
              title="Kirim Colekan Cinta"
            >
              <Heart className="w-3.5 h-3.5 text-romantic-400 fill-romantic-400" />
              <span className="hidden xs:inline">Colek Sayang</span>
            </button>
          )}

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-charcoal-800 transition-all border border-transparent hover:border-charcoal-700 active:scale-95"
            title={theme === 'dark' ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-300" />
            ) : (
              <Moon className="w-4 h-4 text-plum-400" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
