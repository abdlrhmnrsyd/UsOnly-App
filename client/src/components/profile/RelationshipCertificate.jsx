import React from 'react';
import { useAuthStore } from '../../store/useAuthStore.js';
import { formatDateIndonesian } from '../../utils/dateUtils.js';
import { Award, Heart, Sparkles, ShieldCheck, CheckCircle2, Bookmark } from 'lucide-react';

export const RelationshipCertificate = () => {
  const { user, partner, space } = useAuthStore();

  const asitName = 'Abdul Rahman Rasyid (Asit)';
  const nisyaName = 'Anisya (Nisya)';
  const startDate = space?.anniversary_date || '2023-08-14';

  return (
    <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 border-2 border-amber-500/40 bg-gradient-to-b from-charcoal-900 via-plum-950/40 to-charcoal-900 shadow-2xl">
      {/* Decorative Golden Corner Accents */}
      <div className="absolute top-2 left-2 w-6 h-6 border-t-2 border-l-2 border-amber-400/70" />
      <div className="absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 border-amber-400/70" />
      <div className="absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2 border-amber-400/70" />
      <div className="absolute bottom-2 right-2 w-6 h-6 border-b-2 border-r-2 border-amber-400/70" />

      {/* Ambient background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center text-center">
        {/* Top Crest / Seal */}
        <div className="flex items-center gap-2 mb-2">
          <Award className="w-5 h-5 text-amber-400" />
          <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-amber-400/90">
            Sertifikat Pasangan Resmi • Ruang Kita
          </span>
          <Award className="w-5 h-5 text-amber-400" />
        </div>

        <h3 className="text-xl sm:text-2xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-rose-100 to-amber-200 tracking-wide mb-1">
          Ikatan Kasih Asit &amp; Nisya
        </h3>

        <p className="text-xs text-slate-400 max-w-md mb-6 leading-relaxed">
          Sertifikat digital ini mengukuhkan bahwa dua hati telah berjanji untuk saling setia, menjaga, dan berbagi cerita di dalam ruang cinta privat ini selamanya.
        </p>

        {/* Couple Names Diploma Block */}
        <div className="w-full max-w-lg p-5 rounded-2xl bg-charcoal-950/70 border border-amber-500/30 mb-6 backdrop-blur-md">
          <div className="flex flex-col sm:flex-row items-center justify-around gap-4">
            {/* Asit */}
            <div className="flex flex-col items-center">
              <span className="text-[11px] text-amber-400/80 font-medium uppercase tracking-wider">
                Pasangan Pria
              </span>
              <h4 className="text-sm sm:text-base font-bold text-slate-100 mt-1">
                {asitName}
              </h4>
              <span className="text-[10px] text-emerald-400 flex items-center gap-1 mt-1">
                <CheckCircle2 className="w-3 h-3" />
                Terverifikasi
              </span>
            </div>

            {/* Intertwined Heart Badge */}
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-romantic-600 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-romantic-500/30">
              <Heart className="w-5 h-5 fill-white" />
            </div>

            {/* Nisya */}
            <div className="flex flex-col items-center">
              <span className="text-[11px] text-amber-400/80 font-medium uppercase tracking-wider">
                Pasangan Wanita
              </span>
              <h4 className="text-sm sm:text-base font-bold text-slate-100 mt-1">
                {nisyaName}
              </h4>
              <span className="text-[10px] text-emerald-400 flex items-center gap-1 mt-1">
                <CheckCircle2 className="w-3 h-3" />
                Terverifikasi
              </span>
            </div>
          </div>
        </div>

        {/* Certificate Metadata Details */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full max-w-lg text-left mb-4">
          <div className="p-3 rounded-xl bg-charcoal-850/80 border border-charcoal-700/60">
            <span className="text-[10px] text-slate-400 block uppercase">Tanggal Bersama</span>
            <span className="text-xs font-semibold text-slate-200">
              {formatDateIndonesian(startDate)}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-charcoal-850/80 border border-charcoal-700/60">
            <span className="text-[10px] text-slate-400 block uppercase">Status Ruang</span>
            <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Eksklusif Berdua
            </span>
          </div>

          <div className="p-3 rounded-xl bg-charcoal-850/80 border border-charcoal-700/60 col-span-2 sm:col-span-1">
            <span className="text-[10px] text-slate-400 block uppercase">ID Ruang Cinta</span>
            <span className="text-xs font-mono text-romantic-300 truncate block">
              {space?.id ? space.id.slice(0, 12) + '...' : '6e0c0d52...'}
            </span>
          </div>
        </div>

        {/* Golden Digital Stamp */}
        <div className="flex items-center gap-2 text-[11px] text-amber-300/80 mt-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Dilindungi oleh Enkripsi Cinta &amp; Komitmen Berdua</span>
        </div>
      </div>
    </div>
  );
};
