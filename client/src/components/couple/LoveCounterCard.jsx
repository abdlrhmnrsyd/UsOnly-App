import React, { useState, useEffect } from 'react';
import { calculateLoveDuration, formatDateIndonesian } from '../../utils/dateUtils.js';
import { Heart, Sparkles, CalendarHeart, Award, Flame, Quote } from 'lucide-react';

const ROMANTIC_QUOTES = [
  'Setiap detik bersamamu adalah detik terbaik dalam hidupku.',
  'Mencintaimu bukan hanya sebuah pilihan, tapi anugerah terindah.',
  'Dua hati yang saling memilih untuk tumbuh bersama selamanya.',
  'Di antara miliaran manusia di bumi, hatiku hanya tertambat padamu.',
  'Terima kasih sudah mencintai dan menerimaku apa adanya.'
];

export const LoveCounterCard = ({ anniversaryDate, spaceName }) => {
  const [duration, setDuration] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [quoteIdx, setQuoteIdx] = useState(0);

  useEffect(() => {
    const update = () => {
      setDuration(calculateLoveDuration(anniversaryDate || '2023-08-14'));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [anniversaryDate]);

  // Rotate quote every 10 seconds
  useEffect(() => {
    const qInterval = setInterval(() => {
      setQuoteIdx((prev) => (prev + 1) % ROMANTIC_QUOTES.length);
    }, 10000);
    return () => clearInterval(qInterval);
  }, []);

  // Calculate next milestone (e.g., next 500-day step)
  const currentDays = duration.days;
  const nextMilestoneDays = Math.ceil((currentDays + 1) / 500) * 500;
  const daysLeft = Math.max(0, nextMilestoneDays - currentDays);
  const milestoneProgress = Math.min(100, Math.round(((currentDays % 500) / 500) * 100));

  return (
    <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 glass-card-glow border border-romantic-500/30 bg-gradient-to-br from-charcoal-900/95 via-plum-950/60 to-charcoal-900/95 shadow-2xl">
      {/* Background soft romantic glow */}
      <div className="absolute top-0 right-0 -mr-12 -mt-12 w-48 h-48 bg-romantic-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-12 -mb-12 w-48 h-48 bg-plum-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center text-center">
        {/* Pulsing Heart with Counter Icon */}
        <div className="relative mb-3">
          <div className="w-14 h-14 rounded-3xl bg-gradient-to-tr from-romantic-600 via-rose-500 to-plum-600 flex items-center justify-center text-white shadow-xl shadow-romantic-600/30 animate-heartbeat">
            <Heart className="w-7 h-7 fill-white" />
          </div>
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-4 w-4 bg-romantic-500" />
          </span>
        </div>

        <span className="text-[11px] font-semibold tracking-widest uppercase text-romantic-300 mb-1 flex items-center gap-1.5 px-3 py-1 rounded-full bg-romantic-500/10 border border-romantic-500/20">
          <Sparkles className="w-3.5 h-3.5 text-romantic-400" />
          Kisah Cinta Asit &amp; Nisya
        </span>

        <h2 className="text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-rose-100 to-slate-200 tracking-tight mb-1">
          Sudah Bersama Selama
        </h2>

        <p className="text-xs text-slate-400 mb-6 flex items-center gap-1.5">
          <CalendarHeart className="w-3.5 h-3.5 text-romantic-400" />
          Dimulai sejak {formatDateIndonesian(anniversaryDate || '2023-08-14')}
        </p>

        {/* Counter Grid with Metallic Glow */}
        <div className="grid grid-cols-4 gap-2.5 sm:gap-4 w-full max-w-lg mb-6">
          {/* Days */}
          <div className="p-3.5 sm:p-5 rounded-2xl bg-charcoal-850/90 border border-charcoal-700/80 shadow-inner flex flex-col items-center group hover:border-romantic-500/40 transition-colors">
            <span className="text-2xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-200 font-mono tracking-tight">
              {duration.days}
            </span>
            <span className="text-[10px] sm:text-xs text-slate-400 mt-1 uppercase tracking-wider font-semibold">
              Hari
            </span>
          </div>

          {/* Hours */}
          <div className="p-3.5 sm:p-5 rounded-2xl bg-charcoal-850/90 border border-charcoal-700/80 shadow-inner flex flex-col items-center group hover:border-romantic-500/40 transition-colors">
            <span className="text-2xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-200 font-mono tracking-tight">
              {String(duration.hours).padStart(2, '0')}
            </span>
            <span className="text-[10px] sm:text-xs text-slate-400 mt-1 uppercase tracking-wider font-semibold">
              Jam
            </span>
          </div>

          {/* Minutes */}
          <div className="p-3.5 sm:p-5 rounded-2xl bg-charcoal-850/90 border border-charcoal-700/80 shadow-inner flex flex-col items-center group hover:border-romantic-500/40 transition-colors">
            <span className="text-2xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-200 font-mono tracking-tight">
              {String(duration.minutes).padStart(2, '0')}
            </span>
            <span className="text-[10px] sm:text-xs text-slate-400 mt-1 uppercase tracking-wider font-semibold">
              Menit
            </span>
          </div>

          {/* Seconds */}
          <div className="p-3.5 sm:p-5 rounded-2xl bg-gradient-to-b from-romantic-500/15 to-rose-500/20 border border-romantic-500/40 shadow-inner flex flex-col items-center group">
            <span className="text-2xl sm:text-4xl font-extrabold text-romantic-400 font-mono tracking-tight">
              {String(duration.seconds).padStart(2, '0')}
            </span>
            <span className="text-[10px] sm:text-xs text-romantic-300 mt-1 uppercase tracking-wider font-semibold">
              Detik
            </span>
          </div>
        </div>

        {/* Milestone Progress Bar */}
        <div className="w-full max-w-lg p-3.5 rounded-2xl bg-charcoal-850/60 border border-charcoal-700/60 mb-5 text-left">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-slate-300 font-medium flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-amber-400" />
              Menuju Milestone {nextMilestoneDays} Hari:
            </span>
            <span className="text-romantic-300 font-bold">
              Tinggal {daysLeft} Hari Lagi
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-charcoal-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-plum-500 via-romantic-500 to-amber-400 transition-all duration-1000 shadow-sm"
              style={{ width: `${milestoneProgress}%` }}
            />
          </div>
        </div>

        {/* Romantic Rotating Quote */}
        <div className="flex items-center gap-2 max-w-md text-xs text-slate-400 italic">
          <Quote className="w-3.5 h-3.5 text-romantic-400 shrink-0" />
          <span className="transition-opacity duration-500">
            "{ROMANTIC_QUOTES[quoteIdx]}"
          </span>
        </div>
      </div>
    </div>
  );
};
