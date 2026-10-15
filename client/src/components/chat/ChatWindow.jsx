import React, { useRef, useEffect, useState } from 'react';
import { MessageBubble } from './MessageBubble.jsx';
import { useSocketStore } from '../../store/useSocketStore.js';
import { formatDateIndonesian } from '../../utils/dateUtils.js';
import { Heart, Sparkles, X } from 'lucide-react';

export const ChatWindow = ({ messages, onReact, partnerNickname }) => {
  const { partnerTyping, partnerTypingName } = useSocketStore();
  const messagesEndRef = useRef(null);
  const [activeImage, setActiveImage] = useState(null);

  const scrollToBottom = (behavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, partnerTyping]);

  // Group messages by date
  const groupedMessages = messages.reduce((acc, msg) => {
    const dateKey = msg.created_at ? msg.created_at.split('T')[0] : 'today';
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(msg);
    return acc;
  }, {});

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 chat-pattern-bg">
      {/* Intimate Empty State */}
      {messages.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center text-center p-6 my-auto">
          <div className="w-16 h-16 rounded-3xl bg-romantic-500/10 border border-romantic-500/20 flex items-center justify-center text-romantic-400 mb-4 animate-pulse-subtle">
            <Heart className="w-8 h-8 fill-romantic-500/30" />
          </div>
          <h3 className="text-base font-semibold text-slate-100 mb-1">
            Ruang Obrolan Pribadi Kita
          </h3>
          <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
            Hanya ada kamu dan {partnerNickname || 'pasanganmu'} di sini. Sapa dia dengan kata termanis hari ini ❤️
          </p>
        </div>
      ) : (
        Object.entries(groupedMessages).map(([dateKey, msgs]) => (
          <div key={dateKey} className="space-y-1">
            {/* Date Badge Separator */}
            <div className="flex justify-center my-4">
              <span className="px-3 py-1 rounded-full text-[11px] font-medium bg-charcoal-800/80 border border-charcoal-700/60 text-slate-400 shadow-sm">
                {formatDateIndonesian(dateKey)}
              </span>
            </div>

            {/* Message Items */}
            {msgs.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                onReact={onReact}
                onImageClick={(url) => setActiveImage(url)}
              />
            ))}
          </div>
        ))
      )}

      {/* Typing Indicator */}
      {partnerTyping && (
        <div className="flex items-center gap-2 p-2 px-3 rounded-2xl bg-charcoal-850 border border-charcoal-700/60 w-fit animate-pulse-subtle">
          <div className="flex gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-romantic-400 animate-bounce [animation-delay:-0.3s]" />
            <span className="w-1.5 h-1.5 rounded-full bg-romantic-400 animate-bounce [animation-delay:-0.15s]" />
            <span className="w-1.5 h-1.5 rounded-full bg-romantic-400 animate-bounce" />
          </div>
          <span className="text-xs text-romantic-300 font-medium">
            {partnerTypingName || 'Pasangan'} sedang mengetik...
          </span>
        </div>
      )}

      <div ref={messagesEndRef} />

      {/* Image Lightbox Modal */}
      {activeImage && (
        <div 
          onClick={() => setActiveImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/90 backdrop-blur-md animate-fade-in"
        >
          <div className="relative max-w-3xl max-h-[90vh]">
            <button
              onClick={() => setActiveImage(null)}
              className="absolute -top-10 right-0 p-1.5 rounded-full text-slate-300 hover:text-white bg-charcoal-800"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={activeImage}
              alt="Preview Penuh"
              className="rounded-2xl max-h-[85vh] max-w-full object-contain shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
};
