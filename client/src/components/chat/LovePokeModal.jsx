import React, { useState } from 'react';
import { useSocketStore } from '../../store/useSocketStore.js';
import { useAuthStore } from '../../store/useAuthStore.js';
import { Heart, X, Send, Sparkles } from 'lucide-react';
import { soundEffects } from '../../utils/soundUtils.js';

const POKE_OPTIONS = [
  { id: 'hug', title: 'Peluk Jauh', emoji: '🤗', desc: 'Pelukan erat meski terhalang jarak' },
  { id: 'kiss', title: 'Kecup Manis', emoji: '💋', desc: 'Kecupan hangat untuk harimu' },
  { id: 'miss', title: 'Kangen Banget', emoji: '🥺', desc: 'Lagi mikirin kamu terus' },
  { id: 'tickle', title: 'Colek Sayang', emoji: '👉👈', desc: 'Colekan manja bikin senyum' },
  { id: 'heartbeat', title: 'Detak Jantung', emoji: '💓', desc: 'Irama jantungku untukmu' },
];

export const LovePokeModal = ({ isOpen, onClose }) => {
  const { user, partner } = useAuthStore();
  const { emitLovePoke } = useSocketStore();
  const [selectedPoke, setSelectedPoke] = useState(POKE_OPTIONS[0]);
  const [customNote, setCustomNote] = useState('');
  const [isSending, setIsSending] = useState(false);

  if (!isOpen) return null;

  const handleSend = () => {
    setIsSending(true);
    soundEffects.playSparkle();

    emitLovePoke(
      selectedPoke.id,
      user?.nickname || 'Asit',
      customNote.trim() || undefined
    );

    setTimeout(() => {
      setIsSending(false);
      setCustomNote('');
      onClose();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md rounded-3xl glass-card border border-charcoal-700/80 p-6 bg-charcoal-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-charcoal-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-romantic-500/20 text-romantic-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-100 text-base">Colekan Manis</h3>
              <p className="text-xs text-slate-400">Kirim perhatian instan ke {partner?.nickname || 'Nisya'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-charcoal-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Poke Options Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 my-4">
          {POKE_OPTIONS.map((poke) => {
            const isSelected = selectedPoke.id === poke.id;
            return (
              <button
                key={poke.id}
                type="button"
                onClick={() => setSelectedPoke(poke)}
                className={`p-3 rounded-2xl text-left transition-all border flex items-center gap-3 ${
                  isSelected
                    ? 'bg-romantic-500/20 border-romantic-500/50 text-slate-100 ring-1 ring-romantic-500/30'
                    : 'bg-charcoal-800/50 border-charcoal-700/50 text-slate-300 hover:bg-charcoal-800'
                }`}
              >
                <span className="text-2xl">{poke.emoji}</span>
                <div className="overflow-hidden">
                  <div className="text-xs font-semibold leading-tight">{poke.title}</div>
                  <div className="text-[10px] text-slate-400 truncate">{poke.desc}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Custom Sweet Note */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            Pesan Manis Tambahan (Opsional)
          </label>
          <input
            type="text"
            value={customNote}
            onChange={(e) => setCustomNote(e.target.value)}
            placeholder="Contoh: Jangan lupa senyum hari ini yaa ❤️"
            maxLength={100}
            className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-800/70 border border-charcoal-700/60 text-slate-100 text-xs placeholder:text-slate-500 focus:outline-none focus:border-romantic-500 transition-colors"
          />
        </div>

        {/* Send Button */}
        <button
          onClick={handleSend}
          disabled={isSending}
          className="w-full py-3 rounded-2xl bg-gradient-to-r from-romantic-600 to-plum-600 hover:from-romantic-500 hover:to-plum-500 text-white font-medium text-xs flex items-center justify-center gap-2 shadow-lg shadow-romantic-600/30 transition-all active:scale-98 disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
          Kirim {selectedPoke.title} {selectedPoke.emoji} Sekarang
        </button>
      </div>
    </div>
  );
};
