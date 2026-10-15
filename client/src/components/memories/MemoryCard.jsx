import React, { useState } from 'react';
import { formatDateIndonesian } from '../../utils/dateUtils.js';
import { Heart, MapPin, Calendar, Trash2, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';

const CATEGORY_MAP = {
  first_date: { label: 'Kencan Pertama', color: 'bg-rose-500/20 text-rose-300 border-rose-500/30' },
  trip: { label: 'Liburan Berdua', color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' },
  sweet_moment: { label: 'Momen Manis', color: 'bg-romantic-500/20 text-romantic-300 border-romantic-500/30' },
  anniversary: { label: 'Hari Jadian', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  culinary: { label: 'Kulineran', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
  milestone: { label: 'Pencapaian', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
};

export const MemoryCard = ({ memory, onToggleFavorite, onDelete, onClick, viewMode = 'grid' }) => {
  const [photoIdx, setPhotoIdx] = useState(0);
  const photos = memory.photos || [];
  const cat = CATEGORY_MAP[memory.category] || CATEGORY_MAP.sweet_moment;

  const nextPhoto = (e) => {
    e.stopPropagation();
    setPhotoIdx((prev) => (prev + 1) % photos.length);
  };

  const prevPhoto = (e) => {
    e.stopPropagation();
    setPhotoIdx((prev) => (prev - 1 + photos.length) % photos.length);
  };

  const isPolaroid = viewMode === 'polaroid';

  if (isPolaroid) {
    return (
      <div
        onClick={() => onClick && onClick(memory)}
        className="polaroid-card relative p-3 sm:p-4 rounded-2xl cursor-pointer flex flex-col group transition-all"
      >
        {/* Washi Tape Accent */}
        <div className="washi-tape" />

        {/* Polaroid Photo Frame */}
        <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-slate-900 shadow-inner mb-3">
          {photos.length > 0 ? (
            <img
              src={photos[photoIdx]}
              alt={memory.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
              Momen Tanpa Foto
            </div>
          )}

          {/* Multiple Photo Dots & Arrows */}
          {photos.length > 1 && (
            <>
              <button
                onClick={prevPhoto}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-1 rounded-full bg-black/60 text-white hover:bg-black transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={nextPhoto}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full bg-black/60 text-white hover:bg-black transition-colors"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </>
          )}

          {/* Favorite heart badge */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite && onToggleFavorite(memory.id);
            }}
            className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 text-white hover:text-romantic-400 backdrop-blur-sm transition-transform active:scale-90"
          >
            <Heart
              className={`w-3.5 h-3.5 ${
                memory.is_favorite ? 'fill-rose-500 text-rose-500' : ''
              }`}
            />
          </button>
        </div>

        {/* Polaroid Handwritten Caption Area */}
        <div className="px-1 flex flex-col justify-between flex-1">
          <div>
            <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
              <span className="font-semibold text-rose-600 uppercase tracking-wider">
                {cat.label}
              </span>
              <span>{formatDateIndonesian(memory.memory_date)}</span>
            </div>

            <h3 className="font-bold text-slate-800 text-sm leading-snug line-clamp-1 mb-1 font-serif">
              {memory.title}
            </h3>

            {memory.story && (
              <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed italic">
                "{memory.story}"
              </p>
            )}
          </div>

          <div className="pt-2 mt-2 border-t border-slate-200/80 flex items-center justify-between text-[11px] text-slate-400">
            <span className="truncate flex items-center gap-1 text-slate-500">
              {memory.location_name && (
                <>
                  <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                  <span className="truncate">{memory.location_name}</span>
                </>
              )}
            </span>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete && onDelete(memory.id);
              }}
              className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 transition-opacity"
              title="Hapus"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Modern Luxury Grid View
  return (
    <div
      onClick={() => onClick && onClick(memory)}
      className="group relative rounded-3xl glass-card border border-charcoal-700/60 overflow-hidden bg-charcoal-900/60 hover:border-romantic-500/40 hover:shadow-xl hover:shadow-romantic-500/10 transition-all duration-300 cursor-pointer flex flex-col"
    >
      {/* Photo Section */}
      {photos.length > 0 && (
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-charcoal-950">
          <img
            src={photos[photoIdx]}
            alt={memory.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />

          {/* Multiple Photo Dots & Arrows */}
          {photos.length > 1 && (
            <>
              <button
                onClick={prevPhoto}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-charcoal-950/60 text-white hover:bg-charcoal-900 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={nextPhoto}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-charcoal-950/60 text-white hover:bg-charcoal-900 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                {photos.map((_, i) => (
                  <span
                    key={i}
                    className={`w-1.5 h-1.5 rounded-full transition-all ${
                      i === photoIdx ? 'bg-romantic-400 w-3' : 'bg-white/40'
                    }`}
                  />
                ))}
              </div>
            </>
          )}

          {/* Favorite heart badge on photo */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite && onToggleFavorite(memory.id);
            }}
            className="absolute top-3 right-3 p-2 rounded-full bg-charcoal-950/70 text-slate-300 hover:text-romantic-400 backdrop-blur-sm transition-transform active:scale-90"
          >
            <Heart
              className={`w-4 h-4 ${
                memory.is_favorite ? 'fill-romantic-500 text-romantic-500' : ''
              }`}
            />
          </button>
        </div>
      )}

      {/* Card Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Category Tag & Date */}
          <div className="flex items-center justify-between gap-2 mb-2">
            <span
              className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full border ${cat.color}`}
            >
              {cat.label}
            </span>
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-slate-500" />
              {formatDateIndonesian(memory.memory_date)}
            </span>
          </div>

          <h3 className="font-semibold text-slate-100 text-base leading-snug line-clamp-1 mb-1.5 group-hover:text-romantic-200 transition-colors">
            {memory.title}
          </h3>

          {memory.story && (
            <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-3">
              {memory.story}
            </p>
          )}
        </div>

        {/* Footer info: Location & Actions */}
        <div className="pt-2 border-t border-charcoal-800/80 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1 truncate text-slate-400 text-[11px]">
            {memory.location_name && (
              <>
                <MapPin className="w-3 h-3 text-romantic-400 shrink-0" />
                <span className="truncate">{memory.location_name}</span>
              </>
            )}
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete && onDelete(memory.id);
            }}
            className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-slate-500 hover:text-rose-400 transition-opacity"
            title="Hapus Kenangan"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
