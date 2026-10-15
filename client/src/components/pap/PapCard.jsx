import React, { useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore.js';
import { formatTime, formatDateIndonesian } from '../../utils/dateUtils.js';
import { 
  Battery, 
  BatteryMedium, 
  BatteryLow, 
  MapPin, 
  Heart, 
  Trash2, 
  MessageCircle, 
  Clock, 
  User,
  Sparkles
} from 'lucide-react';

export const PapCard = ({ pap, onToggleFavorite, onDelete, onImageClick, onSendToChat }) => {
  const { user } = useAuthStore();
  const photo = pap.photos?.[0] || 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500&h=500&fit=crop';
  
  const isMe = pap.created_by === user?.id;
  const battery = pap.battery_level != null ? pap.battery_level : 85;

  // Battery color indicator
  const getBatteryColor = (level) => {
    if (level <= 20) return 'text-rose-400 bg-rose-500/15 border-rose-500/30';
    if (level <= 50) return 'text-amber-400 bg-amber-500/15 border-amber-500/30';
    return 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30';
  };

  return (
    <div className="group relative rounded-3xl glass-card border border-charcoal-700/70 overflow-hidden bg-charcoal-900/70 hover:border-romantic-500/40 hover:shadow-2xl hover:shadow-romantic-500/10 transition-all duration-300 flex flex-col">
      {/* Top Header: Sender Avatar, Name, Location & Battery Badges */}
      <div className="p-3.5 sm:p-4 border-b border-charcoal-800/80 flex items-center justify-between bg-charcoal-950/40">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <img
              src={pap.sender_avatar || (isMe ? user?.avatar_url : 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop')}
              alt={pap.sender_name || 'Pasangan'}
              className="w-10 h-10 rounded-full object-cover ring-2 ring-romantic-500/50"
            />
            {isMe && (
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-romantic-500 rounded-full border border-charcoal-950" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <h4 className="text-xs sm:text-sm font-bold text-slate-100">
                {pap.sender_name || (isMe ? 'Kamu' : 'Pasangan')}
              </h4>
              <span className="text-[10px] text-slate-400">
                • {formatTime(pap.created_at || pap.memory_date)}
              </span>
            </div>

            {/* Location Pill */}
            {pap.location_name && (
              <div className="flex items-center gap-1 text-[11px] text-slate-300 truncate max-w-[170px] sm:max-w-[210px] mt-0.5">
                <MapPin className="w-3 h-3 text-rose-400 shrink-0" />
                <span className="truncate">{pap.location_name}</span>
              </div>
            )}
          </div>
        </div>

        {/* Battery Pill */}
        <div className={`px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold border flex items-center gap-1 ${getBatteryColor(battery)} shadow-sm shrink-0`}>
          <Battery className="w-3.5 h-3.5" />
          <span>{battery}%</span>
        </div>
      </div>

      {/* Photo Frame */}
      <div 
        onClick={() => onImageClick && onImageClick(photo)}
        className="relative aspect-square w-full overflow-hidden bg-charcoal-950 cursor-pointer"
      >
        <img
          src={photo}
          alt={pap.title || 'PAP Foto'}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Floating Heart / Favorite button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite && onToggleFavorite(pap.id);
          }}
          className="absolute top-3 right-3 p-2 rounded-full bg-charcoal-950/70 text-slate-300 hover:text-romantic-400 backdrop-blur-sm transition-transform active:scale-90 shadow-md"
        >
          <Heart
            className={`w-4 h-4 ${
              pap.is_favorite ? 'fill-rose-500 text-rose-500' : ''
            }`}
          />
        </button>

        {/* Gradient overlay for date on bottom-left */}
        <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-charcoal-950/90 via-charcoal-950/40 to-transparent flex items-end justify-between">
          <span className="text-[10px] text-slate-300 font-medium px-2 py-0.5 rounded-md bg-charcoal-950/60 backdrop-blur-sm">
            📅 {formatDateIndonesian(pap.memory_date || pap.created_at)}
          </span>
        </div>
      </div>

      {/* Caption & Actions Footer */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {pap.story ? (
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans mb-3">
              "{pap.story}"
            </p>
          ) : (
            <p className="text-xs text-slate-400 italic mb-3">
              Kirim PAP tanpa pesan teks ❤️
            </p>
          )}
        </div>

        {/* Footer Toolbar */}
        <div className="pt-2.5 border-t border-charcoal-800/80 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            {onSendToChat && (
              <button
                onClick={() => onSendToChat(pap)}
                className="text-[11px] text-romantic-400 hover:text-romantic-300 font-medium flex items-center gap-1 active:scale-95"
                title="Bahas PAP ini di Chat"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Bahas di Chat</span>
              </button>
            )}
          </div>

          {onDelete && (
            <button
              onClick={() => onDelete(pap.id)}
              className="p-1 rounded-lg text-slate-500 hover:text-rose-400 transition-colors"
              title="Hapus PAP"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
