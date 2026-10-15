import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { useSocketStore } from '../../store/useSocketStore.js';
import { Heart, X, Sparkles } from 'lucide-react';

export const LovePokeOverlay = () => {
  const { activePoke, clearActivePoke } = useSocketStore();

  useEffect(() => {
    if (activePoke) {
      // Trigger romantic confetti blast
      try {
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#f43f66', '#fb718c', '#9e59d4', '#fda4b5', '#ffffff'],
        });
      } catch (e) {
        // ignore
      }
    }
  }, [activePoke]);

  if (!activePoke) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-sm rounded-3xl glass-card border border-romantic-500/40 p-6 shadow-2xl text-center overflow-hidden bg-charcoal-900/90 animate-slide-up">
        {/* Soft background glow */}
        <div className="absolute -top-12 -left-12 w-32 h-32 bg-romantic-500/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-plum-500/20 rounded-full blur-2xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={clearActivePoke}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-charcoal-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Poke Emoji / Icon */}
        <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-tr from-romantic-600/30 to-plum-600/30 border border-romantic-500/40 flex items-center justify-center text-4xl mb-4 shadow-lg shadow-romantic-500/20 animate-heartbeat">
          {activePoke.icon || '❤️'}
        </div>

        <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-romantic-400 uppercase tracking-widest mb-1">
          <Sparkles className="w-3.5 h-3.5" />
          Colekan Manis Masuk
        </div>

        <h3 className="text-xl font-bold text-slate-100 mb-2">
          {activePoke.pokeTitle}
        </h3>

        <p className="text-sm text-slate-300 mb-4">
          Dari <span className="font-semibold text-romantic-300">{activePoke.senderNickname}</span> untukmu tersayang.
        </p>

        {activePoke.customNote && (
          <div className="p-3 rounded-2xl bg-charcoal-800/80 border border-charcoal-700/60 text-xs italic text-slate-300 mb-5">
            "{activePoke.customNote}"
          </div>
        )}

        <button
          onClick={clearActivePoke}
          className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-romantic-600 to-plum-600 hover:from-romantic-500 hover:to-plum-500 text-white font-medium text-sm shadow-lg shadow-romantic-600/30 transition-all active:scale-98 flex items-center justify-center gap-2"
        >
          <Heart className="w-4 h-4 fill-white" />
          Terima dengan Penuh Cinta ❤️
        </button>
      </div>
    </div>
  );
};
