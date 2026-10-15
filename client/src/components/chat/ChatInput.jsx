import React, { useState, useRef, useEffect } from 'react';
import { useSocketStore } from '../../store/useSocketStore.js';
import { useAuthStore } from '../../store/useAuthStore.js';
import { uploadApi } from '../../api/endpoints.js';
import { Send, ImagePlus, Heart, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export const ChatInput = ({ onSendMessage, onOpenPoke }) => {
  const { user } = useAuthStore();
  const { emitTypingStart, emitTypingStop } = useSocketStore();
  const [content, setContent] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Handle typing debounce
  const handleInputChange = (e) => {
    setContent(e.target.value);

    emitTypingStart(user?.nickname || 'Pasangan');

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      emitTypingStop();
    }, 2000);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Ukuran foto maksimal 10MB ya sayang');
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleClearPhoto = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!content.trim() && !selectedFile) return;

    let mediaUrl = null;

    if (selectedFile) {
      try {
        setIsUploading(true);
        const uploadRes = await uploadApi.uploadPhoto(selectedFile);
        if (uploadRes.success) {
          mediaUrl = uploadRes.url;
        }
      } catch (err) {
        toast.error('Gagal mengunggah foto. Pesan teks tetap akan dikirim.');
      } finally {
        setIsUploading(false);
      }
    }

    onSendMessage({
      content: content.trim() || null,
      media_url: mediaUrl,
      message_type: mediaUrl ? 'image' : 'text',
    });

    setContent('');
    handleClearPhoto();
    emitTypingStop();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleQuickSend = (text) => {
    onSendMessage({
      content: text,
      media_url: null,
      message_type: 'text',
    });
    emitTypingStop();
  };

  const QUICK_LOVE_PILLS = [
    { label: '❤️ Sayang', text: 'Sayang ❤️' },
    { label: '💋 Muach', text: 'Muachhh 💋' },
    { label: '🥺 Kangen', text: 'Kangen banget sama kamu 🥺' },
    { label: '🫂 Peluk', text: 'Kirim peluk erat buat kamu 🫂' },
    { label: '🌹 Love You', text: 'Love you so much, sayangku 🌹' },
    { label: '✨ Manisku', text: 'Semangat ya manisku! ✨' },
  ];

  return (
    <div className="p-3 bg-charcoal-900/95 border-t border-charcoal-800 backdrop-blur-md">
      {/* Quick Love Pills Horizontal Strip */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none mb-1">
        {QUICK_LOVE_PILLS.map((pill, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleQuickSend(pill.text)}
            className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-charcoal-850 hover:bg-romantic-500/20 text-slate-300 hover:text-romantic-300 border border-charcoal-700/80 hover:border-romantic-500/30 whitespace-nowrap transition-all active:scale-95 shrink-0 shadow-sm"
          >
            {pill.label}
          </button>
        ))}
      </div>

      {/* Photo Preview Thumbnail */}
      {previewUrl && (
        <div className="relative inline-block mb-2 ml-2">
          <img
            src={previewUrl}
            alt="Preview"
            className="w-16 h-16 object-cover rounded-xl border border-romantic-500/50 shadow-md"
          />
          <button
            onClick={handleClearPhoto}
            className="absolute -top-1.5 -right-1.5 p-1 bg-charcoal-950 text-white rounded-full border border-charcoal-700 hover:bg-rose-600 transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />

        {/* Photo Button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="p-2.5 rounded-2xl text-slate-400 hover:text-romantic-400 hover:bg-charcoal-800 transition-colors"
          title="Kirim Foto"
        >
          <ImagePlus className="w-5 h-5" />
        </button>

        {/* Love Poke Button */}
        <button
          type="button"
          onClick={onOpenPoke}
          className="p-2.5 rounded-2xl text-romantic-400 hover:text-romantic-300 hover:bg-romantic-500/15 transition-colors"
          title="Colekan Cinta"
        >
          <Heart className="w-5 h-5 fill-romantic-500/20" />
        </button>

        {/* Text Input */}
        <div className="flex-1 relative">
          <input
            type="text"
            value={content}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Tulis pesan manis untuknya..."
            className="w-full px-4 py-2.5 rounded-2xl bg-charcoal-800/80 border border-charcoal-700/60 text-slate-100 text-sm placeholder:text-slate-500 focus:outline-none focus:border-romantic-500 focus:ring-1 focus:ring-romantic-500 transition-all"
          />
        </div>

        {/* Send Button */}
        <button
          type="submit"
          disabled={(!content.trim() && !selectedFile) || isUploading}
          className="p-2.5 rounded-2xl bg-gradient-to-r from-romantic-600 to-rose-600 hover:from-romantic-500 hover:to-rose-500 text-white shadow-md shadow-romantic-600/30 transition-all active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
        >
          {isUploading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </form>
    </div>
  );
};
