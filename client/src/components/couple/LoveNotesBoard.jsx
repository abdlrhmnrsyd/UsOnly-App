import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/useAuthStore.js';
import { StickyNote, Plus, Trash2, Heart, Sparkles, X, Send } from 'lucide-react';
import { formatTime } from '../../utils/dateUtils.js';
import { toast } from 'sonner';

const NOTE_COLORS = [
  { bg: 'bg-gradient-to-br from-rose-950/60 to-charcoal-900', border: 'border-rose-500/30', pin: 'bg-rose-500', text: 'text-rose-200' },
  { bg: 'bg-gradient-to-br from-plum-950/60 to-charcoal-900', border: 'border-plum-500/30', pin: 'bg-purple-500', text: 'text-purple-200' },
  { bg: 'bg-gradient-to-br from-amber-950/40 to-charcoal-900', border: 'border-amber-500/30', pin: 'bg-amber-500', text: 'text-amber-200' },
  { bg: 'bg-gradient-to-br from-pink-950/50 to-charcoal-900', border: 'border-pink-500/30', pin: 'bg-pink-500', text: 'text-pink-200' },
];

export const LoveNotesBoard = () => {
  const { user, partner, space } = useAuthStore();
  const storageKey = `love_notes_${space?.id || 'default'}`;

  const [notes, setNotes] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // fallback
    }
    return [
      {
        id: '1',
        sender: 'Asit',
        content: 'Semangat kerjanya ya cintaku! Jangan lupa makan siang dan minum air putih ❤️',
        date: new Date().toISOString(),
        colorIdx: 0,
      },
      {
        id: '2',
        sender: 'Nisya',
        content: 'Terima kasih udah selalu ada buat aku dan bikin hari-hariku bahagia 🥰',
        date: new Date(Date.now() - 3600000 * 2).toISOString(),
        colorIdx: 1,
      }
    ];
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [selectedColorIdx, setSelectedColorIdx] = useState(0);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(notes));
    } catch (e) {
      console.warn('Failed saving love notes', e);
    }
  }, [notes, storageKey]);

  const handleAddNote = (e) => {
    e.preventDefault();
    if (!newNoteContent.trim()) return;

    const newNote = {
      id: Date.now().toString(),
      sender: user?.nickname || 'Kamu',
      content: newNoteContent.trim(),
      date: new Date().toISOString(),
      colorIdx: selectedColorIdx,
    };

    setNotes((prev) => [newNote, ...prev]);
    setNewNoteContent('');
    setIsModalOpen(false);
    toast.success('Catatan manis berhasil ditempel di papan ❤️');
  };

  const handleDeleteNote = (id) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    toast.success('Catatan dihapus.');
  };

  return (
    <div className="p-5 rounded-3xl glass-card border border-charcoal-700/60 bg-charcoal-900/50 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-charcoal-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-2xl bg-amber-500/15 text-amber-400 border border-amber-500/20">
            <StickyNote className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-slate-100 text-sm flex items-center gap-1.5">
              Papan Catatan Cinta Kita
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 font-medium">
                {notes.length} Catatan
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Pesan singkat penuh kehangatan untuk Asit &amp; Nisya
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 text-xs font-medium transition-all flex items-center gap-1 active:scale-95 shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Tulis Catatan</span>
        </button>
      </div>

      {/* Notes Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {notes.map((note) => {
          const color = NOTE_COLORS[note.colorIdx % NOTE_COLORS.length];
          const isMyNote = note.sender === user?.nickname;

          return (
            <div
              key={note.id}
              className={`relative p-4 rounded-2xl border ${color.border} ${color.bg} shadow-md flex flex-col justify-between group hover:scale-[1.01] transition-transform`}
            >
              {/* Pin indicator */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-semibold text-slate-300 flex items-center gap-1">
                  <span className={`w-2 h-2 rounded-full ${color.pin} shadow-sm`} />
                  Dari {note.sender}
                </span>

                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-slate-400">
                    {formatTime(note.date)}
                  </span>
                  <button
                    onClick={() => handleDeleteNote(note.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-400 transition-opacity"
                    title="Hapus Catatan"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Note Content */}
              <p className="text-xs text-slate-200 leading-relaxed font-sans italic my-1 whitespace-pre-wrap">
                "{note.content}"
              </p>

              <div className="mt-2 text-right">
                <Heart className="w-3 h-3 text-romantic-400 fill-romantic-400/40 inline ml-auto" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Note Modal */}
      {isModalOpen && (
        <div 
          onClick={() => setIsModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/80 backdrop-blur-md animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md p-5 rounded-3xl glass-card border border-charcoal-700/80 bg-charcoal-900 shadow-2xl"
          >
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-charcoal-800">
              <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <StickyNote className="w-4 h-4 text-amber-400" />
                Tulis Catatan Manis untuk {partner?.nickname || 'Pasangan'}
              </h4>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddNote} className="space-y-4">
              <textarea
                value={newNoteContent}
                onChange={(e) => setNewNoteContent(e.target.value)}
                placeholder="Tulis pesan penyemangat, kata rindu, atau janji kencan nanti..."
                rows={4}
                className="w-full p-3.5 rounded-2xl bg-charcoal-800/80 border border-charcoal-700 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 leading-relaxed resize-none"
                autoFocus
              />

              {/* Color selector */}
              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-2">
                  Pilih Warna Kertas Catatan:
                </label>
                <div className="flex items-center gap-2">
                  {NOTE_COLORS.map((col, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedColorIdx(idx)}
                      className={`w-7 h-7 rounded-full ${col.pin} transition-all ${
                        selectedColorIdx === idx ? 'ring-2 ring-white scale-110' : 'opacity-70 hover:opacity-100'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-medium text-slate-400 hover:bg-charcoal-800 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={!newNoteContent.trim()}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-white text-xs font-medium shadow-md shadow-amber-500/20 transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  Tempel Catatan ❤️
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
