import crypto from 'crypto';
import { db } from '../db/store.js';

// Generates cryptographically secure human-readable pairing code: KITA-XXXX
const generateSecureCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // exclude ambiguous letters
  const randomBytes = crypto.randomBytes(4);
  let code = 'KITA-';
  for (let i = 0; i < 4; i++) {
    code += chars[randomBytes[i] % chars.length];
  }
  return code;
};

export const createSpace = (req, res) => {
  try {
    const user = db.findUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan.' });
    }

    if (user.space_id) {
      const existing = db.findSpaceById(user.space_id);
      if (existing) {
        return res.status(400).json({ 
          success: false, 
          message: 'Kamu sudah memiliki Ruang Pasangan aktif.' 
        });
      }
    }

    const { name, anniversary_date } = req.body;
    const newSpaceId = `space-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const newSpace = {
      id: newSpaceId,
      name: name?.trim() || `Ruang ${user.nickname}`,
      anniversary_date: anniversary_date || new Date().toISOString().split('T')[0],
      partner1_id: user.id,
      partner2_id: null,
      status: 'pending',
      cover_photo_url: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=1200&h=400&fit=crop',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    db.createSpace(newSpace);
    db.updateUser(user.id, { space_id: newSpaceId });

    return res.status(201).json({
      success: true,
      message: 'Ruang cinta berhasil dibuat! Sekarang undang pasanganmu ❤️',
      space: newSpace
    });
  } catch (err) {
    console.error('[CreateSpace Error]', err);
    return res.status(500).json({ success: false, message: 'Gagal membuat ruang pasangan.' });
  }
};

export const createInvitation = (req, res) => {
  try {
    const user = db.findUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan.' });
    }

    let space = user.space_id ? db.findSpaceById(user.space_id) : null;
    
    // Auto-create pending couple space if user does not have one yet
    if (!space) {
      const newSpaceId = `space-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      space = {
        id: newSpaceId,
        name: `Ruang Cinta ${user.nickname || 'Kita'}`,
        anniversary_date: new Date().toISOString().split('T')[0],
        partner1_id: user.id,
        partner2_id: null,
        status: 'pending',
        cover_photo_url: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=1200&h=400&fit=crop',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      db.createSpace(space);
      db.updateUser(user.id, { space_id: newSpaceId });
    }

    // STRICT RULE: If space is already paired with 2 members, forbid creating invitations!
    if (space.partner1_id && space.partner2_id) {
      return res.status(400).json({ 
        success: false, 
        message: 'Ruang ini sudah lengkap berdua (2 anggota). Tidak dapat menambahkan orang lain.' 
      });
    }

    // Check if there is already an active, unused invitation for this space
    const existingInvite = db.findActiveInvitationBySpaceId(space.id);
    if (existingInvite) {
      return res.status(200).json({
        success: true,
        message: 'Kode undangan aktif ditemukan.',
        invitation: {
          code: existingInvite.code,
          expires_at: existingInvite.expires_at
        }
      });
    }

    const code = generateSecureCode();
    const expiresAt = new Date(Date.now() + 48 * 3600 * 1000).toISOString(); // 48 hours

    const invite = {
      id: `inv-${Date.now()}`,
      space_id: space.id,
      created_by: user.id,
      code,
      expires_at: expiresAt,
      is_used: false,
      used_by: null,
      used_at: null,
      created_at: new Date().toISOString()
    };

    db.createInvitation(invite);

    return res.status(201).json({
      success: true,
      message: 'Kode undangan berhasil dibuat.',
      invitation: {
        code: invite.code,
        expires_at: invite.expires_at
      }
    });
  } catch (err) {
    console.error('[CreateInvitation Error]', err);
    return res.status(500).json({ success: false, message: 'Gagal membuat kode undangan.' });
  }
};

export const getActiveInvitation = (req, res) => {
  try {
    const user = db.findUserById(req.user.id);
    if (!user || !user.space_id) {
      return res.json({ success: true, invitation: null });
    }
    const invite = db.findActiveInvitationBySpaceId(user.space_id);
    return res.json({
      success: true,
      invitation: invite ? { code: invite.code, expires_at: invite.expires_at } : null
    });
  } catch (err) {
    console.error('[GetActiveInvitation Error]', err);
    return res.status(500).json({ success: false, message: 'Gagal mengambil kode undangan aktif.' });
  }
};

export const joinSpace = (req, res) => {
  try {
    const { code } = req.body;
    const user = db.findUserById(req.user.id);

    if (!code || typeof code !== 'string') {
      return res.status(400).json({ 
        success: false, 
        message: 'Kode undangan wajib dimasukkan.' 
      });
    }

    if (user.space_id) {
      const existing = db.findSpaceById(user.space_id);
      if (existing && existing.partner2_id) {
        return res.status(400).json({ 
          success: false, 
          message: 'Kamu sudah terhubung di ruang pasangan lain. Tinggalkan ruang sebelumnya jika ingin pindah.' 
        });
      }
    }

    const invitation = db.findInvitationByCode(code.trim().toUpperCase());
    if (!invitation) {
      return res.status(404).json({ 
        success: false, 
        message: 'Kode undangan tidak ditemukan atau sudah digunakan.' 
      });
    }

    if (new Date(invitation.expires_at) < new Date()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Kode undangan telah kedaluwarsa. Mohon minta pasanganmu membuat kode baru.' 
      });
    }

    if (invitation.created_by === user.id) {
      return res.status(400).json({ 
        success: false, 
        message: 'Kamu tidak dapat bergabung menggunakan kode buatanmu sendiri.' 
      });
    }

    const space = db.findSpaceById(invitation.space_id);
    if (!space) {
      return res.status(404).json({ success: false, message: 'Ruang pasangan tidak ditemukan.' });
    }

    // STRICT CHECK: Space must NOT already have partner2
    if (space.partner2_id && space.partner2_id !== user.id) {
      return res.status(403).json({ 
        success: false, 
        message: 'Ruang ini sudah memiliki 2 pasangan. Akses orang ketiga dilarang!' 
      });
    }

    // Pair successfully
    const updatedSpace = db.updateSpace(space.id, {
      partner2_id: user.id,
      status: 'paired',
      updated_at: new Date().toISOString()
    });

    db.updateUser(user.id, { space_id: space.id });

    // Mark invitation as permanently used
    db.updateInvitation(invitation.id, {
      is_used: true,
      used_by: user.id,
      used_at: new Date().toISOString()
    });

    // Create system celebration message
    db.createMessage({
      id: `msg-join-${Date.now()}`,
      space_id: space.id,
      sender_id: user.id,
      content: `🎉 ${user.nickname} telah resmi bergabung ke Ruang Kita! Selamat memulai lembaran baru berdua ❤️`,
      media_url: null,
      message_type: 'system',
      reaction: '❤️',
      is_read: true,
      read_at: new Date().toISOString(),
      created_at: new Date().toISOString()
    });

    const partner1 = db.findUserById(space.partner1_id);
    const { password_hash, ...safePartner1 } = partner1 || {};

    // Notify partner in realtime via WebSocket if connected
    const io = req.app.get('io');
    if (io) {
      io.to(`space_${space.id}`).emit('partner_joined', {
        message: `🎉 ${user.nickname} telah terhubung ke Ruang Kita! ❤️`,
        partner: {
          id: user.id,
          nickname: user.nickname,
          full_name: user.full_name,
          avatar_url: user.avatar_url
        },
        space: updatedSpace
      });
    }

    return res.json({
      success: true,
      message: `Berhasil terhubung dengan ${safePartner1.nickname || 'pasanganmu'}! Selamat datang di Ruang Kita ❤️`,
      space: updatedSpace,
      partner: safePartner1
    });
  } catch (err) {
    console.error('[JoinSpace Error]', err);
    return res.status(500).json({ success: false, message: 'Gagal bergabung ke ruang pasangan.' });
  }
};

export const getSpaceDetails = (req, res) => {
  try {
    const user = db.findUserById(req.user.id);
    if (!user || !user.space_id) {
      return res.status(200).json({ success: true, space: null, partner: null });
    }

    const space = db.findSpaceById(user.space_id);
    if (!space) {
      return res.status(404).json({ success: false, message: 'Ruang tidak ditemukan.' });
    }

    const partnerId = space.partner1_id === user.id ? space.partner2_id : space.partner1_id;
    let partner = null;
    if (partnerId) {
      const pUser = db.findUserById(partnerId);
      if (pUser) {
        const { password_hash, ...safeP } = pUser;
        partner = safeP;
      }
    }

    return res.json({
      success: true,
      space,
      partner
    });
  } catch (err) {
    console.error('[GetSpaceDetails Error]', err);
    return res.status(500).json({ success: false, message: 'Gagal mengambil detail ruang.' });
  }
};

export const updateSpaceSettings = (req, res) => {
  try {
    const user = db.findUserById(req.user.id);
    if (!user || !user.space_id) {
      return res.status(400).json({ success: false, message: 'Kamu belum berada di ruang pasangan.' });
    }

    const { name, anniversary_date, cover_photo_url } = req.body;
    const updates = {};
    if (name) updates.name = name.trim();
    if (anniversary_date) updates.anniversary_date = anniversary_date;
    if (cover_photo_url) updates.cover_photo_url = cover_photo_url;

    const updated = db.updateSpace(user.space_id, updates);
    return res.json({
      success: true,
      message: 'Pengaturan ruang berhasil disimpan ❤️',
      space: updated
    });
  } catch (err) {
    console.error('[UpdateSpaceSettings Error]', err);
    return res.status(500).json({ success: false, message: 'Gagal memperbarui pengaturan ruang.' });
  }
};

export const leaveSpace = (req, res) => {
  try {
    const user = db.findUserById(req.user.id);
    if (!user || !user.space_id) {
      return res.status(400).json({ success: false, message: 'Kamu belum berada di ruang pasangan.' });
    }

    db.leaveSpace(user.id);

    return res.json({
      success: true,
      message: 'Kamu telah berhasil meninggalkan ruang pasangan.'
    });
  } catch (err) {
    console.error('[LeaveSpace Error]', err);
    return res.status(500).json({ success: false, message: 'Gagal meninggalkan ruang pasangan.' });
  }
};

