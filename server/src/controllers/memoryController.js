import { db } from '../db/store.js';

export const getMemories = (req, res) => {
  try {
    const user = db.findUserById(req.user.id);
    if (!user || !user.space_id) {
      return res.status(400).json({ success: false, message: 'Belum terhubung ke ruang pasangan.' });
    }

    const memories = db.getMemoriesBySpaceId(user.space_id);
    return res.json({
      success: true,
      memories
    });
  } catch (err) {
    console.error('[GetMemories Error]', err);
    return res.status(500).json({ success: false, message: 'Gagal mengambil kenangan.' });
  }
};

export const createMemory = (req, res) => {
  try {
    const user = db.findUserById(req.user.id);
    if (!user || !user.space_id) {
      return res.status(400).json({ success: false, message: 'Belum terhubung ke ruang pasangan.' });
    }

    const { 
      title, 
      story, 
      memory_date, 
      category, 
      location_name, 
      latitude,
      longitude,
      battery_level,
      photos, 
      is_favorite 
    } = req.body;

    const newMemory = {
      id: `pap-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      space_id: user.space_id,
      created_by: user.id,
      sender_name: user.nickname || user.full_name || 'Pasangan',
      sender_avatar: user.avatar_url || null,
      title: title ? title.trim() : 'PAP Sayang ❤️',
      story: story ? story.trim() : '',
      memory_date: memory_date || new Date().toISOString().split('T')[0],
      category: category || 'sweet_moment',
      location_name: location_name ? location_name.trim() : null,
      latitude: latitude != null ? Number(latitude) : null,
      longitude: longitude != null ? Number(longitude) : null,
      battery_level: battery_level != null ? Number(battery_level) : (user.battery_level != null ? user.battery_level : null),
      photos: Array.isArray(photos) ? photos : [],
      is_favorite: !!is_favorite,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const saved = db.createMemory(newMemory);

    return res.status(201).json({
      success: true,
      message: 'PAP manis berhasil dikirim! ❤️',
      memory: saved,
      pap: saved
    });
  } catch (err) {
    console.error('[CreateMemory Error]', err);
    return res.status(500).json({ success: false, message: 'Gagal mengirim PAP.' });
  }
};

export const updateMemory = (req, res) => {
  try {
    const { id } = req.params;
    const user = db.findUserById(req.user.id);
    if (!user || !user.space_id) {
      return res.status(400).json({ success: false, message: 'Belum terhubung ke ruang pasangan.' });
    }

    const updates = req.body;
    const updated = db.updateMemory(id, updates);

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Kenangan tidak ditemukan.' });
    }

    return res.json({
      success: true,
      message: 'Kenangan berhasil diperbarui ❤️',
      memory: updated
    });
  } catch (err) {
    console.error('[UpdateMemory Error]', err);
    return res.status(500).json({ success: false, message: 'Gagal memperbarui kenangan.' });
  }
};

export const deleteMemory = (req, res) => {
  try {
    const { id } = req.params;
    const user = db.findUserById(req.user.id);
    if (!user || !user.space_id) {
      return res.status(400).json({ success: false, message: 'Belum terhubung ke ruang pasangan.' });
    }

    const success = db.deleteMemory(id);
    if (!success) {
      return res.status(404).json({ success: false, message: 'Kenangan tidak ditemukan.' });
    }

    return res.json({
      success: true,
      message: 'Kenangan telah dihapus.'
    });
  } catch (err) {
    console.error('[DeleteMemory Error]', err);
    return res.status(500).json({ success: false, message: 'Gagal menghapus kenangan.' });
  }
};

export const toggleFavorite = (req, res) => {
  try {
    const { id } = req.params;
    const memories = db.getMemoriesBySpaceId(req.user.space_id);
    const item = memories.find(m => m.id === id);

    if (!item) {
      return res.status(404).json({ success: false, message: 'Kenangan tidak ditemukan.' });
    }

    const updated = db.updateMemory(id, { is_favorite: !item.is_favorite });

    return res.json({
      success: true,
      memory: updated
    });
  } catch (err) {
    console.error('[ToggleFavorite Error]', err);
    return res.status(500).json({ success: false, message: 'Gagal mengubah favorit.' });
  }
};
