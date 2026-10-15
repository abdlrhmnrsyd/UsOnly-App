import React, { useState } from 'react';
import { formatDateIndonesian } from '../../utils/dateUtils.js';
import { X, Heart, MapPin, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

export const MemoryDetailModal = ({ memory, onClose, onToggleFavorite }) => {
  const [photoIdx, setPhotoIdx] = useState(0);

  if (!memory) return null;
  const photos = memory.photos || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl rounded-3xl glass-card border border-charcoal-700/80 bg-charcoal-900 shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-charcoal-800 text-slate-400 hover:text-white transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Photo Gallery Viewer */}
        {photos.length > 0 && (
          <div className="relative rounded-2xl overflow-hidden aspect-video bg-charcoal-950 mb-4">
            <img
              src={photos[photoIdx]}
              alt={memory.title}
              className="w-full h-full object-cover"
            />
            {photos.length > 1 && (
              <>
                <button
                  onClick={() => setPhotoIdx((prev) => (prev - 1 + photos.length) % photos.length)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-charcoal-950/70 text-white hover:bg-charcoal-900"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setPhotoIdx((prev) => (prev + 1) % photos.length)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-charcoal-950/70 text-white hover:bg-charcoal-900"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}
          </div>
        )}

        {/* Title & Favorite */}
        <div className="flex items-start justify-between gap-4 mb-2">
          <h2 className="text-xl font-bold text-slate-100 leading-snug">
            {memory.title}
          </h2>
          <button
            onClick={() => onToggleFavorite && onToggleFavorite(memory.id)}
            className="p-2 rounded-full bg-charcoal-800 text-slate-300 hover:text-romantic-400"
          >
            <Heart className={`w-5 h-5 ${memory.is_favorite ? 'fill-romantic-500 text-romantic-500' : ''}`} />
          </button>
        </div>

        {/* Meta details */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mb-4 pb-3 border-b border-charcoal-800">
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-romantic-400" />
            {formatDateIndonesian(memory.memory_date)}
          </span>
          {memory.location_name && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-romantic-400" />
              {memory.location_name}
            </span>
          )}
        </div>

        {/* Story */}
        {memory.story && (
          <div className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap font-serif">
            {memory.story}
          </div>
        )}
      </div>
    </div>
  );
};
