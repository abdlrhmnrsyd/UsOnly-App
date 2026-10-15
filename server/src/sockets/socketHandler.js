import { db } from '../db/store.js';

export const setupSocketHandlers = (io) => {
  io.on('connection', (socket) => {
    let currentSpaceId = null;
    let currentUserId = null;

    // User joins their couple space room
    socket.on('join_space', ({ spaceId, userId }) => {
      if (!spaceId || !userId) return;

      currentSpaceId = spaceId;
      currentUserId = userId;
      const room = `space_${spaceId}`;
      socket.join(room);

      // Notify partner in room that partner is connected/online
      socket.to(room).emit('partner_online', { userId });
      console.log(`[Socket] User ${userId} joined room ${room}`);
    });

    // Realtime typing events
    socket.on('typing_start', ({ nickname }) => {
      if (!currentSpaceId) return;
      socket.to(`space_${currentSpaceId}`).emit('partner_typing_start', {
        userId: currentUserId,
        nickname: nickname || 'Pasangan'
      });
    });

    socket.on('typing_stop', () => {
      if (!currentSpaceId) return;
      socket.to(`space_${currentSpaceId}`).emit('partner_typing_stop', {
        userId: currentUserId
      });
    });

    // Realtime new chat message
    socket.on('new_message', (message) => {
      if (!currentSpaceId) return;
      socket.to(`space_${currentSpaceId}`).emit('message_received', message);
    });

    // Realtime message reaction
    socket.on('message_reaction', ({ messageId, reaction }) => {
      if (!currentSpaceId) return;
      socket.to(`space_${currentSpaceId}`).emit('reaction_received', { messageId, reaction });
    });

    // Realtime message read notification
    socket.on('messages_read', () => {
      if (!currentSpaceId) return;
      socket.to(`space_${currentSpaceId}`).emit('partner_read_messages', {
        readAt: new Date().toISOString()
      });
    });

    // Romantic quick interactions / Love Poke ("Colekan Sayang")
    socket.on('send_love_poke', ({ pokeType, senderNickname, customNote }) => {
      if (!currentSpaceId) return;

      let pokeTitle = 'Colekan Manis';
      let icon = '❤️';

      switch (pokeType) {
        case 'hug':
          pokeTitle = 'Peluk Jauh Erat';
          icon = '🤗';
          break;
        case 'kiss':
          pokeTitle = 'Kecup Manis';
          icon = '💋';
          break;
        case 'miss':
          pokeTitle = 'Kangen Kamu Banget';
          icon = '🥺';
          break;
        case 'tickle':
          pokeTitle = 'Colek Sayang';
          icon = '👉👈';
          break;
        case 'heartbeat':
          pokeTitle = 'Detak Jantungku Untukmu';
          icon = '💓';
          break;
      }

      // Also persist love poke as a message in the chat
      const pokeMsg = {
        id: `msg-poke-${Date.now()}`,
        space_id: currentSpaceId,
        sender_id: currentUserId,
        content: customNote ? `${icon} ${pokeTitle}: "${customNote}"` : `${icon} Mengirim ${pokeTitle}!`,
        media_url: null,
        message_type: 'poke',
        reaction: icon,
        is_read: false,
        read_at: null,
        created_at: new Date().toISOString()
      };
      db.createMessage(pokeMsg);

      // Broadcast live event to partner
      socket.to(`space_${currentSpaceId}`).emit('partner_love_poke', {
        pokeType,
        pokeTitle,
        senderNickname,
        customNote,
        icon,
        message: pokeMsg,
        timestamp: new Date().toISOString()
      });
    });

    // Realtime location broadcast (only if consent enabled)
    socket.on('location_update', (locationData) => {
      if (!currentSpaceId) return;
      if (locationData && locationData.is_sharing_enabled) {
        socket.to(`space_${currentSpaceId}`).emit('partner_location_updated', locationData);
      }
    });

    // Status / Battery update
    socket.on('status_update', (statusData) => {
      if (!currentSpaceId) return;
      socket.to(`space_${currentSpaceId}`).emit('partner_status_updated', statusData);
    });

    socket.on('disconnect', () => {
      if (currentSpaceId && currentUserId) {
        socket.to(`space_${currentSpaceId}`).emit('partner_offline', { userId: currentUserId });
      }
    });
  });
};
