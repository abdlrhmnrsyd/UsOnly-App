import { db } from '../db/store.js';

export const getMessages = (req, res) => {
  try {
    const user = db.findUserById(req.user.id);
    if (!user || !user.space_id) {
      return res.status(400).json({ success: false, message: 'Belum terhubung ke ruang pasangan.' });
    }

    const messages = db.getMessagesBySpaceId(user.space_id);
    return res.json({
      success: true,
      messages
    });
  } catch (err) {
    console.error('[GetMessages Error]', err);
    return res.status(500).json({ success: false, message: 'Gagal memuat pesan.' });
  }
};

export const sendMessage = (req, res) => {
  try {
    const user = db.findUserById(req.user.id);
    if (!user || !user.space_id) {
      return res.status(400).json({ success: false, message: 'Belum terhubung ke ruang pasangan.' });
    }

    const { content, media_url, message_type } = req.body;

    if (!content && !media_url) {
      return res.status(400).json({ success: false, message: 'Konten atau media pesan tidak boleh kosong.' });
    }

    const newMessage = {
      id: `msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      space_id: user.space_id,
      sender_id: user.id,
      content: content ? content.trim() : null,
      media_url: media_url || null,
      message_type: message_type || 'text',
      reaction: null,
      is_read: false,
      read_at: null,
      created_at: new Date().toISOString()
    };

    const saved = db.createMessage(newMessage);

    return res.status(201).json({
      success: true,
      message: saved
    });
  } catch (err) {
    console.error('[SendMessage Error]', err);
    return res.status(500).json({ success: false, message: 'Gagal mengirim pesan.' });
  }
};

export const reactToMessage = (req, res) => {
  try {
    const { id } = req.params;
    const { reaction } = req.body;
    const user = db.findUserById(req.user.id);

    if (!user || !user.space_id) {
      return res.status(400).json({ success: false, message: 'Belum terhubung ke ruang.' });
    }

    const updated = db.updateMessage(id, { reaction });
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Pesan tidak ditemukan.' });
    }

    return res.json({
      success: true,
      message: updated
    });
  } catch (err) {
    console.error('[ReactToMessage Error]', err);
    return res.status(500).json({ success: false, message: 'Gagal memperbarui reaksi pesan.' });
  }
};

export const markAsRead = (req, res) => {
  try {
    const user = db.findUserById(req.user.id);
    if (!user || !user.space_id) {
      return res.status(400).json({ success: false, message: 'Belum terhubung ke ruang.' });
    }

    db.markMessagesAsRead(user.space_id, user.id);
    return res.json({ success: true, message: 'Semua pesan telah dibaca.' });
  } catch (err) {
    console.error('[MarkAsRead Error]', err);
    return res.status(500).json({ success: false, message: 'Gagal menandai pesan telah dibaca.' });
  }
};

export const editMessage = (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Konten pesan tidak boleh kosong.' });
    }

    const updated = db.editMessage(id, req.user.id, content.trim());
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Pesan tidak ditemukan atau kamu bukan pengirimnya.' });
    }

    return res.json({
      success: true,
      message: 'Pesan berhasil diubah.',
      data: updated
    });
  } catch (err) {
    console.error('[EditMessage Error]', err);
    return res.status(500).json({ success: false, message: 'Gagal mengedit pesan.' });
  }
};

export const deleteMessage = (req, res) => {
  try {
    const { id } = req.params;
    const deleted = db.deleteMessage(id, req.user.id);

    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Pesan tidak ditemukan atau kamu bukan pengirimnya.' });
    }

    return res.json({
      success: true,
      message: 'Pesan berhasil dihapus.'
    });
  } catch (err) {
    console.error('[DeleteMessage Error]', err);
    return res.status(500).json({ success: false, message: 'Gagal menghapus pesan.' });
  }
};

