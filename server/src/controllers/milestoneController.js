import { db } from '../db/store.js';

export const getMilestones = (req, res) => {
  try {
    const user = db.findUserById(req.user.id);
    if (!user || !user.space_id) {
      return res.status(400).json({ success: false, message: 'Belum terhubung ke ruang pasangan.' });
    }

    const items = db.getSpecialDatesBySpaceId(user.space_id);
    return res.json({ success: true, milestones: items });
  } catch (err) {
    console.error('[GetMilestones Error]', err);
    return res.status(500).json({ success: false, message: 'Gagal mengambil tanggal spesial.' });
  }
};

export const createMilestone = (req, res) => {
  try {
    const user = db.findUserById(req.user.id);
    if (!user || !user.space_id) {
      return res.status(400).json({ success: false, message: 'Belum terhubung ke ruang pasangan.' });
    }

    const { title, event_date, is_recurring_yearly, icon, notes } = req.body;
    if (!title || !event_date) {
      return res.status(400).json({ success: false, message: 'Judul dan tanggal spesial wajib diisi.' });
    }

    const item = {
      id: `date-${Date.now()}`,
      space_id: user.space_id,
      title: title.trim(),
      event_date,
      is_recurring_yearly: is_recurring_yearly !== undefined ? !!is_recurring_yearly : true,
      icon: icon || 'heart',
      notes: notes ? notes.trim() : ''
    };

    const saved = db.createSpecialDate(item);
    return res.status(201).json({ success: true, milestone: saved });
  } catch (err) {
    console.error('[CreateMilestone Error]', err);
    return res.status(500).json({ success: false, message: 'Gagal menambahkan tanggal spesial.' });
  }
};

export const deleteMilestone = (req, res) => {
  try {
    const { id } = req.params;
    db.deleteSpecialDate(id);
    return res.json({ success: true, message: 'Tanggal spesial berhasil dihapus.' });
  } catch (err) {
    console.error('[DeleteMilestone Error]', err);
    return res.status(500).json({ success: false, message: 'Gagal menghapus tanggal spesial.' });
  }
};
