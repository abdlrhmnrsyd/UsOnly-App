import React, { useState } from 'react';
import { X, Check } from 'lucide-react';

const QUICK_STATUSES = [
  'Lagi santai di rumah 🏠',
  'Di kantor / kampus lagi kerja 💻',
  'Sedang di jalan, pelan-pelan 🚗',
  'Lagi makan / kulineran enak 🍜',
  'Sudah sampai tempat tujuan dengan selamat ✨',
  'Lagi mikirin kamu terus ❤️',
];

export const StatusNoteModal = ({ isOpen, onClose, currentNote, onSave }) => {
  const [note, setNote] = useState(currentNote || '');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(note.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/75 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md rounded-3xl glass-card border border-charcoal-700/80 bg-charcoal-900 shadow-2xl p-6">
        <div className="flex items-center justify-between pb-3 border-b border-charcoal-800">
          <h3 className="font-semibold text-slate-100 text-base">Perbarui Kabar Status</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-charcoal-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Pilih Kabar Cepat
            </label>
            <div className="flex flex-wrap gap-2">
              {QUICK_STATUSES.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setNote(item)}
                  className={`px-3 py-1.5 rounded-xl text-xs transition-colors border text-left ${
                    note === item
                      ? 'bg-romantic-500/20 text-romantic-200 border-romantic-500/50'
                      : 'bg-charcoal-800 text-slate-300 border-charcoal-700 hover:bg-charcoal-750'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Atau Tulis Kabar Sendiri
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Contoh: Lagi nunggu pesanan makanan..."
              maxLength={80}
              className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-800 border border-charcoal-700 text-slate-100 text-sm focus:outline-none focus:border-romantic-500"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-2xl bg-gradient-to-r from-romantic-600 to-plum-600 hover:from-romantic-500 hover:to-plum-500 text-white font-medium text-xs flex items-center justify-center gap-1.5 shadow-md shadow-romantic-600/30 transition-all active:scale-98"
          >
            <Check className="w-4 h-4" />
            Simpan Kabar Status
          </button>
        </form>
      </div>
    </div>
  );
};
