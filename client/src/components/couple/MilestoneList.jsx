import React, { useState } from 'react';
import { formatDateIndonesian } from '../../utils/dateUtils.js';
import { Gift, Heart, CalendarPlus, Trash2, Calendar, Sparkles, X } from 'lucide-react';

export const MilestoneList = ({ milestones, onAddMilestone, onDeleteMilestone }) => {
  const [isOpenAdd, setIsOpenAdd] = useState(false);
  const [title, setTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [notes, setNotes] = useState('');

  const handleAdd = (e) => {
    e.preventDefault();
    if (!title.trim() || !eventDate) return;

    onAddMilestone({
      title: title.trim(),
      event_date: eventDate,
      notes: notes.trim() || undefined,
    });

    setTitle('');
    setEventDate('');
    setNotes('');
    setIsOpenAdd(false);
  };

  return (
    <div className="p-5 rounded-3xl glass-card border border-charcoal-700/60 bg-charcoal-900/40">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-charcoal-800">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-romantic-500/15 text-romantic-400">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-100 text-sm">Tanggal Spesial & Momen Kita</h3>
            <p className="text-[11px] text-slate-400">Ulang tahun, hari jadian, dan hari penting berdua</p>
          </div>
        </div>

        <button
          onClick={() => setIsOpenAdd(true)}
          className="px-2.5 py-1.5 rounded-xl text-xs font-medium bg-charcoal-800 hover:bg-charcoal-750 text-slate-200 border border-charcoal-700 transition-colors flex items-center gap-1"
        >
          <CalendarPlus className="w-3.5 h-3.5 text-romantic-400" />
          Tambah
        </button>
      </div>

      {/* List */}
      <div className="space-y-2.5">
        {milestones.length === 0 ? (
          <p className="text-xs text-slate-500 py-3 text-center">
            Belum ada tanggal spesial yang ditambahkan.
          </p>
        ) : (
          milestones.map((item) => (
            <div
              key={item.id}
              className="p-3 rounded-2xl bg-charcoal-850/60 border border-charcoal-700/40 flex items-center justify-between gap-3 hover:border-romantic-500/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-plum-900/50 border border-plum-700/50 flex items-center justify-center text-romantic-400">
                  {item.title.toLowerCase().includes('ulang tahun') ? (
                    <Gift className="w-4 h-4" />
                  ) : (
                    <Heart className="w-4 h-4 fill-romantic-500/30" />
                  )}
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-200">{item.title}</h4>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400">
                    <span>{formatDateIndonesian(item.event_date)}</span>
                    {item.notes && <span className="text-slate-500">• {item.notes}</span>}
                  </div>
                </div>
              </div>

              {onDeleteMilestone && (
                <button
                  onClick={() => onDeleteMilestone(item.id)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 transition-colors"
                  title="Hapus Tanggal Spesial"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Modal Add Milestone */}
      {isOpenAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/75 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm rounded-3xl glass-card border border-charcoal-700/80 bg-charcoal-900 p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-charcoal-800 mb-3">
              <h4 className="font-semibold text-slate-100 text-sm">Tambah Tanggal Spesial</h4>
              <button
                onClick={() => setIsOpenAdd(false)}
                className="p-1 rounded-full text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAdd} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Nama Hari / Momen *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Contoh: Kencan Bioskop Pertama"
                  className="w-full px-3 py-2 rounded-xl bg-charcoal-800 border border-charcoal-700 text-slate-100 text-xs focus:outline-none focus:border-romantic-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Tanggal *
                </label>
                <input
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-charcoal-800 border border-charcoal-700 text-slate-100 text-xs focus:outline-none focus:border-romantic-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Catatan Tambahan
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Catatan kecil pengingat..."
                  className="w-full px-3 py-2 rounded-xl bg-charcoal-800 border border-charcoal-700 text-slate-100 text-xs focus:outline-none focus:border-romantic-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-romantic-600 to-plum-600 hover:from-romantic-500 hover:to-plum-500 text-white font-medium text-xs shadow-md shadow-romantic-600/30 transition-all active:scale-98"
              >
                Simpan Tanggal Ini ❤️
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
