import { create } from 'zustand';
import { io } from 'socket.io-client';
import { soundEffects } from '../utils/soundUtils.js';

export const useSocketStore = create((set, get) => ({
  socket: null,
  isConnected: false,
  partnerOnline: false,
  partnerTyping: false,
  partnerTypingName: '',
  activePoke: null, // Current active love poke for full-screen celebration

  connectSocket: (spaceId, userId) => {
    if (get().socket) {
      get().socket.disconnect();
    }

    const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const socketUrl = import.meta.env.VITE_SOCKET_URL || (isDev && window.location.port === '5173' ? 'http://localhost:5000' : window.location.origin);
    const socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
    });

    socket.on('connect', () => {
      set({ isConnected: true });
      if (spaceId && userId) {
        socket.emit('join_space', { spaceId, userId });
      }
    });

    socket.on('disconnect', () => {
      set({ isConnected: false, partnerOnline: false, partnerTyping: false });
    });

    socket.on('partner_online', () => {
      set({ partnerOnline: true });
    });

    socket.on('partner_offline', () => {
      set({ partnerOnline: false, partnerTyping: false });
    });

    socket.on('partner_typing_start', ({ nickname }) => {
      set({ partnerTyping: true, partnerTypingName: nickname || 'Pasangan' });
    });

    socket.on('partner_typing_stop', () => {
      set({ partnerTyping: false, partnerTypingName: '' });
    });

    socket.on('partner_love_poke', (data) => {
      soundEffects.playSparkle();
      if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
      }
      set({ activePoke: data });
    });

    set({ socket });
  },

  disconnectSocket: () => {
    if (get().socket) {
      get().socket.disconnect();
      set({ socket: null, isConnected: false, partnerOnline: false, partnerTyping: false });
    }
  },

  clearActivePoke: () => {
    set({ activePoke: null });
  },

  emitTypingStart: (nickname) => {
    const socket = get().socket;
    if (socket && socket.connected) {
      socket.emit('typing_start', { nickname });
    }
  },

  emitTypingStop: () => {
    const socket = get().socket;
    if (socket && socket.connected) {
      socket.emit('typing_stop', {});
    }
  },

  emitLovePoke: (pokeType, senderNickname, customNote) => {
    const socket = get().socket;
    if (socket && socket.connected) {
      socket.emit('send_love_poke', { pokeType, senderNickname, customNote });
    }
  },

  emitLocationUpdate: (locationData) => {
    const socket = get().socket;
    if (socket && socket.connected) {
      socket.emit('location_update', locationData);
    }
  },
}));
