import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore.js';
import { useSocketStore } from '../store/useSocketStore.js';
import { messageApi } from '../api/endpoints.js';
import { ChatWindow } from '../components/chat/ChatWindow.jsx';
import { ChatInput } from '../components/chat/ChatInput.jsx';
import { LovePokeModal } from '../components/chat/LovePokeModal.jsx';
import { soundEffects } from '../utils/soundUtils.js';
import { 
  Heart, 
  Volume2, 
  VolumeX, 
  Loader2 
} from 'lucide-react';
import { toast } from 'sonner';

export const ChatPage = ({ onOpenLovePoke }) => {
  const { user, partner } = useAuthStore();
  const { socket, partnerOnline, partnerTyping, partnerTypingName } = useSocketStore();

  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isPokeModalOpen, setIsPokeModalOpen] = useState(false);

  // Load chat history
  const loadMessages = async () => {
    try {
      setIsLoading(true);
      const res = await messageApi.getMessages();
      if (res.success && res.messages) {
        setMessages(res.messages);
      }
      // Mark messages as read
      await messageApi.markRead().catch(() => null);
    } catch (err) {
      console.warn('[LoadMessages Error]', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
  }, []);

  // Socket event subscriptions
  useEffect(() => {
    if (!socket) return;

    const handleMessageReceived = (newMessage) => {
      setMessages((prev) => {
        // Prevent duplicate messages
        if (prev.some((m) => m.id === newMessage.id)) return prev;
        return [...prev, newMessage];
      });

      if (soundEnabled && newMessage.sender_id !== user?.id) {
        soundEffects.playMessageChime();
        if (navigator.vibrate) {
          navigator.vibrate(80);
        }
      }

      // Automatically mark as read if received while looking at the chat
      messageApi.markRead().catch(() => null);
    };

    const handleReactionReceived = ({ messageId, reaction }) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, reaction } : m))
      );
    };

    const handlePartnerRead = () => {
      setMessages((prev) =>
        prev.map((m) =>
          m.sender_id === user?.id && !m.is_read
            ? { ...m, is_read: true, read_at: new Date().toISOString() }
            : m
        )
      );
    };

    socket.on('message_received', handleMessageReceived);
    socket.on('reaction_received', handleReactionReceived);
    socket.on('partner_read_messages', handlePartnerRead);

    return () => {
      socket.off('message_received', handleMessageReceived);
      socket.off('reaction_received', handleReactionReceived);
      socket.off('partner_read_messages', handlePartnerRead);
    };
  }, [socket, soundEnabled, user?.id]);

  const handleSendMessage = async (payload) => {
    try {
      const res = await messageApi.sendMessage(payload);
      if (res.success && res.message) {
        const savedMsg = res.message;
        setMessages((prev) => [...prev, savedMsg]);

        // Broadcast to partner via socket
        if (socket && socket.connected) {
          socket.emit('new_message', savedMsg);
        }
      }
    } catch (err) {
      toast.error('Gagal mengirim pesan.');
    }
  };

  const handleReact = async (messageId, reaction) => {
    try {
      await messageApi.reactToMessage(messageId, reaction);
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, reaction } : m))
      );
      if (socket && socket.connected) {
        socket.emit('message_reaction', { messageId, reaction });
      }
    } catch (err) {
      toast.error('Gagal memberi reaksi.');
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4.5rem)] md:h-[calc(100vh-5.5rem)] max-w-4xl mx-auto rounded-3xl glass-card border border-charcoal-700/60 overflow-hidden bg-charcoal-900/70 shadow-2xl">
      {/* Intimate Chat Header */}
      <div className="px-4 py-3 border-b border-charcoal-800 glass-panel flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              src={partner?.avatar_url || 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop'}
              alt={partner?.nickname || 'Pasangan'}
              className="w-10 h-10 rounded-full object-cover ring-2 ring-plum-500/50"
            />
            <span
              className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-charcoal-900 ${
                partnerOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'
              }`}
            />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-100">
                {partner?.full_name || 'Nisya'} ({partner?.nickname || 'Nisya'})
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-plum-900/60 text-romantic-300 border border-plum-700/50 font-normal">
                Privat Berdua
              </span>
            </div>

            <p className="text-[11px] text-slate-400">
              {partnerTyping ? (
                <span className="text-romantic-300 font-medium animate-pulse">
                  {partnerTypingName || 'Pasangan'} sedang mengetik...
                </span>
              ) : partnerOnline ? (
                <span className="text-emerald-400">Sedang online bersamamu</span>
              ) : (
                'Offline'
              )}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5">
          {/* Quick Love Poke */}
          <button
            onClick={() => setIsPokeModalOpen(true)}
            className="px-2.5 py-1.5 rounded-xl text-xs font-medium bg-romantic-500/15 hover:bg-romantic-500/25 text-romantic-300 border border-romantic-500/30 transition-all flex items-center gap-1 active:scale-95"
            title="Kirim Colekan Cinta"
          >
            <Heart className="w-3.5 h-3.5 text-romantic-400 fill-romantic-400" />
            <span className="hidden sm:inline">Colekan Sayang</span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={() => {
              setSoundEnabled(!soundEnabled);
              toast.info(soundEnabled ? 'Suara notifikasi dimatikan' : 'Suara notifikasi diaktifkan');
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-charcoal-800 transition-colors"
            title={soundEnabled ? 'Matikan Suara' : 'Nyalakan Suara'}
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-romantic-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-500" />
            )}
          </button>
        </div>
      </div>

      {/* Chat Messages Body */}
      {isLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-romantic-400" />
          <span className="text-xs">Membuka ruang obrolan mesra kita...</span>
        </div>
      ) : (
        <ChatWindow
          messages={messages}
          onReact={handleReact}
          partnerNickname={partner?.nickname || 'Pasangan'}
        />
      )}

      {/* Chat Input Bar */}
      <ChatInput
        onSendMessage={handleSendMessage}
        onOpenPoke={() => setIsPokeModalOpen(true)}
      />

      {/* Love Poke Modal */}
      <LovePokeModal
        isOpen={isPokeModalOpen}
        onClose={() => setIsPokeModalOpen(false)}
      />
    </div>
  );
};
