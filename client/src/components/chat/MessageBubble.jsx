import React, { useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore.js';
import { formatTime } from '../../utils/dateUtils.js';
import { Check, CheckCheck, Heart, SmilePlus } from 'lucide-react';

const REACTION_EMOJIS = ['❤️', '🥰', '🥺', '💖', '✨', '💑'];

export const MessageBubble = ({ message, onReact, onImageClick }) => {
  const { user } = useAuthStore();
  const [showReactions, setShowReactions] = useState(false);

  const isMe = message.sender_id === user?.id;
  const isPoke = message.message_type === 'poke';
  const isSystem = message.message_type === 'system';

  // Centered system notification
  if (isSystem) {
    return (
      <div className="flex justify-center my-3">
        <span className="px-3.5 py-1 rounded-full text-xs bg-plum-950/60 text-romantic-300 border border-plum-700/40 text-center max-w-sm">
          {message.content}
        </span>
      </div>
    );
  }

  return (
    <div className={`flex flex-col my-1.5 ${isMe ? 'items-end' : 'items-start'} group relative`}>
      <div className="relative max-w-[85%] sm:max-w-[70%]">
        {/* Message Bubble Container */}
        <div
          className={`p-3.5 rounded-2xl transition-all shadow-sm ${
            isPoke
              ? 'bg-gradient-to-r from-plum-900/60 to-charcoal-850 border border-romantic-500/40 text-romantic-100'
              : isMe
              ? 'bg-gradient-to-r from-romantic-600 to-rose-600 text-white rounded-tr-sm shadow-romantic-600/10'
              : 'bg-charcoal-850 dark:bg-charcoal-800 border border-charcoal-700/60 text-slate-100 rounded-tl-sm'
          }`}
        >
          {/* Attached Photo */}
          {message.media_url && (
            <div className="mb-2 rounded-xl overflow-hidden cursor-pointer">
              <img
                src={message.media_url}
                alt="Foto Pesan"
                onClick={() => onImageClick && onImageClick(message.media_url)}
                className="max-h-60 w-full object-cover rounded-xl hover:opacity-95 transition-opacity"
                loading="lazy"
              />
            </div>
          )}

          {/* Text Content */}
          {message.content && (
            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
              {message.content}
            </p>
          )}

          {/* Time & Read Receipts */}
          <div
            className={`flex items-center justify-end gap-1 text-[10px] mt-1.5 ${
              isMe ? 'text-white/75' : 'text-slate-400'
            }`}
          >
            <span>{formatTime(message.created_at)}</span>
            {isMe && (
              <span>
                {message.is_read ? (
                  <CheckCheck className="w-3.5 h-3.5 text-pink-200 inline" />
                ) : (
                  <Check className="w-3.5 h-3.5 text-white/60 inline" />
                )}
              </span>
            )}
          </div>
        </div>

        {/* Reaction Pill Badge */}
        {message.reaction && (
          <div
            className={`absolute -bottom-2.5 ${
              isMe ? 'right-2' : 'left-2'
            } px-2 py-0.5 rounded-full bg-charcoal-900 border border-charcoal-700 text-xs shadow-md flex items-center gap-1 cursor-pointer`}
          >
            <span>{message.reaction}</span>
          </div>
        )}

        {/* Quick Reaction Hover Button */}
        <button
          onClick={() => setShowReactions(!showReactions)}
          className={`opacity-0 group-hover:opacity-100 transition-opacity absolute top-1 ${
            isMe ? '-left-8' : '-right-8'
          } p-1 rounded-full bg-charcoal-800/80 text-slate-400 hover:text-romantic-400 hover:bg-charcoal-700`}
          title="Beri Reaksi"
        >
          <SmilePlus className="w-4 h-4" />
        </button>

        {/* Reaction Picker Dropdown */}
        {showReactions && (
          <div
            className={`absolute z-30 -top-10 ${
              isMe ? 'right-0' : 'left-0'
            } flex items-center gap-1.5 p-1.5 rounded-full bg-charcoal-900 border border-charcoal-700 shadow-xl animate-fade-in`}
          >
            {REACTION_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => {
                  onReact && onReact(message.id, emoji);
                  setShowReactions(false);
                }}
                className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-charcoal-800 text-sm transition-transform hover:scale-125"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
