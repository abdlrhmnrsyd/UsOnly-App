import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db/store.js';
import { config } from '../config/index.js';

const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      nickname: user.nickname, 
      spaceId: user.space_id 
    },
    config.jwtSecret,
    { expiresIn: '30d' }
  );
};

export const register = (req, res) => {
  try {
    const { email, password, fullName, nickname } = req.body;

    if (!email || !password || !fullName || !nickname) {
      return res.status(400).json({ 
        success: false, 
        message: 'Mohon lengkapi semua kolom yang wajib diisi.' 
      });
    }

    const existingUser = db.findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email sudah terdaftar. Silakan gunakan email lain atau masuk.' 
      });
    }

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);

    const newUser = {
      id: `user-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      email: email.trim().toLowerCase(),
      password_hash: passwordHash,
      full_name: fullName.trim(),
      nickname: nickname.trim(),
      avatar_url: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(nickname)}`,
      bio: 'Ruang cinta kita berdua ❤️',
      theme_preference: 'dark',
      status_text: 'Online',
      battery_level: 100,
      space_id: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    db.createUser(newUser);
    const token = generateToken(newUser);

    const { password_hash, ...safeUser } = newUser;
    return res.status(201).json({
      success: true,
      message: `Selamat datang di Our Space, ${safeUser.nickname}!`,
      token,
      user: safeUser
    });
  } catch (err) {
    console.error('[Register Error]', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan saat pendaftaran akun.' });
  }
};

export const login = (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email dan kata sandi wajib diisi.' 
      });
    }

    const user = db.findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Email atau kata sandi tidak sesuai.' 
      });
    }

    const isMatch = bcrypt.compareSync(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false, 
        message: 'Email atau kata sandi tidak sesuai.' 
      });
    }

    const token = generateToken(user);
    const { password_hash, ...safeUser } = user;

    return res.json({
      success: true,
      message: `Selamat datang kembali, ${safeUser.nickname}! ❤️`,
      token,
      user: safeUser
    });
  } catch (err) {
    console.error('[Login Error]', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan saat masuk akun.' });
  }
};

// Helper for quick demonstration & seamless switching between Asit and Nisya
export const quickLogin = (req, res) => {
  try {
    const { role } = req.params; // 'asit' or 'nisya'
    const email = role === 'asit' ? 'asit@ourspace.id' : 'nisya@ourspace.id';
    
    let user = db.findUserByEmail(email);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Akun demo tidak ditemukan.' });
    }

    const token = generateToken(user);
    const { password_hash, ...safeUser } = user;

    return res.json({
      success: true,
      message: `Masuk sebagai ${safeUser.nickname} (${safeUser.full_name}) ❤️`,
      token,
      user: safeUser
    });
  } catch (err) {
    console.error('[QuickLogin Error]', err);
    return res.status(500).json({ success: false, message: 'Gagal melakukan quick login demo.' });
  }
};

export const getMe = (req, res) => {
  try {
    const user = db.findUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan.' });
    }

    const { password_hash, ...safeUser } = user;

    let space = null;
    let partner = null;

    if (user.space_id) {
      space = db.findSpaceById(user.space_id);
      if (space) {
        const partnerId = space.partner1_id === user.id ? space.partner2_id : space.partner1_id;
        if (partnerId) {
          const partnerUser = db.findUserById(partnerId);
          if (partnerUser) {
            const { password_hash: _, ...safePartner } = partnerUser;
            partner = safePartner;
          }
        }
      }
    }

    return res.json({
      success: true,
      user: safeUser,
      space,
      partner
    });
  } catch (err) {
    console.error('[GetMe Error]', err);
    return res.status(500).json({ success: false, message: 'Gagal memuat profil pengguna.' });
  }
};

export const updateProfile = (req, res) => {
  try {
    const { full_name, nickname, bio, avatar_url, theme_preference, status_text } = req.body;

    const updates = {};
    if (full_name !== undefined) updates.full_name = full_name.trim();
    if (nickname !== undefined) updates.nickname = nickname.trim();
    if (bio !== undefined) updates.bio = bio;
    if (avatar_url !== undefined) updates.avatar_url = avatar_url;
    if (theme_preference !== undefined) updates.theme_preference = theme_preference;
    if (status_text !== undefined) updates.status_text = status_text;

    const updatedUser = db.updateUser(req.user.id, updates);
    const { password_hash, ...safeUser } = updatedUser;

    return res.json({
      success: true,
      message: 'Profil berhasil diperbarui ❤️',
      user: safeUser
    });
  } catch (err) {
    console.error('[UpdateProfile Error]', err);
    return res.status(500).json({ success: false, message: 'Gagal memperbarui profil.' });
  }
};
