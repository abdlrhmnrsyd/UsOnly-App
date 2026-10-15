import React, { useState } from 'react';
import { Heart, Zap, Sparkles, Send, Smile } from 'lucide-react';
import { soundEffects } from '../../utils/soundUtils.js';
import { toast } from 'sonner';

export const LoveBatteryWidget = ({ partnerName, onOpenLovePoke }) => {
  const [hearts, setHearts] = useState([]);
  const [tapCount, setTapCount] = useState(0);

  const handleSendHeartPulse = (e) => {
    // Spawn floating heart
    const rect = e.currentTarget.getBoundingClientRect();
    const newHeart = {
      id: Date.now() + Math.random(),
      x: (Math.random() - 0.5) * 60,
      icon: ['❤️', '💖', '💋', '✨', '🥰'][Math.floor(Math.random() * 5)]
    };

    setHearts((prev) => [...prev.slice(-10), newHeart]);
    setTapCount((prev) => prev + 1);

    // Play subtle audio chime
    soundEffects.playHeartbeat();

    // Remove floating heart after animation
    setTimeout(() => {
      setHearts((prev) => prev.filter((h) => h.id !== newHeart.id));
    }, 1400);

    if (tapCount % 5 === 4) {
      toast.success(`100% Cinta dikirimkan ke ${partnerName || 'Nisya'}! ❤️`);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-3xl p-5 glass-card-glow border border-romantic-500/30 bg-gradient-to-r from-plum-950/70 via-charcoal-900 to-romantic-950/40 shadow-xl">
      {/* Decorative ambient corner glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-romantic-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left Info: Battery Gauge */}
        <div className="flex items-center gap-3.5">
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-romantic-600 via-rose-500 to-plum-600 flex items-center justify-center text-white shadow-lg shadow-romantic-500/30 animate-pulse-subtle">
              <Zap className="w-6 h-6 fill-amber-300 text-amber-200" />
            </div>
            {/* Heart badge */}
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center text-[10px] font-bold shadow-sm">
              <Heart className="w-3 h-3 fill-white" />
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                Baterai Cinta Berdua
                <span className="text-[11px] font-semibold text-romantic-400 bg-romantic-500/15 px-2 py-0.5 rounded-full border border-romantic-500/30">
                  100% Penuh ❤️
                </span>
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Energi kasih sayang untuk {partnerName || 'Nisya'} selalu melimpah ruah
            </p>
          </div>
        </div>

        {/* Right Action: Quick Love Pulse button with floating particles */}
        <div className="relative flex items-center gap-2 self-end sm:self-auto">
          {/* Floating particle container */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            {hearts.map((h) => (
              <span
                key={h.id}
                className="absolute text-xl animate-float-heart select-none"
                style={{ transform: `translateX(${h.x}px)` }}
              >
                {h.icon}
              </span>
            ))}
          </div>

          <button
            onClick={handleSendHeartPulse}
            className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-romantic-600 to-rose-600 hover:from-romantic-500 hover:to-rose-500 text-white text-xs font-semibold shadow-lg shadow-romantic-600/30 transition-all flex items-center gap-1.5 active:scale-95 group"
          >
            <Heart className="w-4 h-4 fill-white group-hover:scale-125 transition-transform" />
            <span>Kirim Getar Cinta</span>
          </button>

          {onOpenLovePoke && (
            <button
              onClick={onOpenLovePoke}
              className="px-3.5 py-2.5 rounded-2xl bg-charcoal-800 hover:bg-charcoal-750 text-romantic-300 border border-charcoal-700/80 text-xs font-medium transition-colors flex items-center gap-1"
              title="Pilihan Colekan Sayang"
            >
              <Sparkles className="w-3.5 h-3.5 text-romantic-400" />
              <span>Colekan</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
