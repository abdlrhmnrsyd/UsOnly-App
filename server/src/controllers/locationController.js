import { db } from '../db/store.js';

export const getLocationState = (req, res) => {
  try {
    const user = db.findUserById(req.user.id);
    if (!user || !user.space_id) {
      return res.status(400).json({ success: false, message: 'Belum terhubung ke ruang pasangan.' });
    }

    const space = db.findSpaceById(user.space_id);
    if (!space) {
      return res.status(404).json({ success: false, message: 'Ruang tidak ditemukan.' });
    }

    const partnerId = space.partner1_id === user.id ? space.partner2_id : space.partner1_id;

    const myLocation = db.getLocationByUserId(user.id) || {
      user_id: user.id,
      space_id: user.space_id,
      latitude: null,
      longitude: null,
      accuracy: null,
      address_label: 'Lokasi belum dibagikan',
      status_note: '',
      is_sharing_enabled: false,
      battery_level: user.battery_level || null,
      last_updated_at: null
    };

    let partnerLocation = null;
    let partnerUser = null;

    if (partnerId) {
      partnerUser = db.findUserById(partnerId);
      const rawPartnerLoc = db.getLocationByUserId(partnerId);

      if (rawPartnerLoc) {
        // STRICT PRIVACY CONSENT CHECK:
        // Only disclose partner coordinates if partner has explicitly enabled sharing!
        if (rawPartnerLoc.is_sharing_enabled) {
          partnerLocation = {
            ...rawPartnerLoc,
            nickname: partnerUser?.nickname || 'Pasangan'
          };
        } else {
          // Partner has turned off sharing
          partnerLocation = {
            user_id: partnerId,
            space_id: user.space_id,
            latitude: null,
            longitude: null,
            accuracy: null,
            address_label: 'Privat (Berbagi lokasi dinonaktifkan oleh pasangan)',
            status_note: rawPartnerLoc.status_note || '',
            is_sharing_enabled: false,
            battery_level: rawPartnerLoc.battery_level || null,
            last_updated_at: rawPartnerLoc.last_updated_at,
            nickname: partnerUser?.nickname || 'Pasangan'
          };
        }
      }
    }

    return res.json({
      success: true,
      my_location: myLocation,
      partner_location: partnerLocation
    });
  } catch (err) {
    console.error('[GetLocationState Error]', err);
    return res.status(500).json({ success: false, message: 'Gagal mengambil data lokasi.' });
  }
};

export const updateLocation = (req, res) => {
  try {
    const user = db.findUserById(req.user.id);
    if (!user || !user.space_id) {
      return res.status(400).json({ success: false, message: 'Belum terhubung ke ruang pasangan.' });
    }

    const { latitude, longitude, accuracy, address_label, status_note, battery_level, is_sharing_enabled } = req.body;

    const updates = {};
    if (latitude !== undefined) updates.latitude = Number(latitude);
    if (longitude !== undefined) updates.longitude = Number(longitude);
    if (accuracy !== undefined) updates.accuracy = Number(accuracy);
    if (address_label !== undefined) updates.address_label = address_label;
    if (status_note !== undefined) updates.status_note = status_note;
    if (battery_level !== undefined) {
      updates.battery_level = Number(battery_level);
      db.updateUser(user.id, { battery_level: Number(battery_level) });
    }
    if (is_sharing_enabled !== undefined) updates.is_sharing_enabled = !!is_sharing_enabled;

    const saved = db.upsertLocation(user.id, user.space_id, updates);

    return res.json({
      success: true,
      message: 'Lokasi berhasil diperbarui.',
      location: saved
    });
  } catch (err) {
    console.error('[UpdateLocation Error]', err);
    return res.status(500).json({ success: false, message: 'Gagal memperbarui lokasi.' });
  }
};

export const toggleConsent = (req, res) => {
  try {
    const user = db.findUserById(req.user.id);
    if (!user || !user.space_id) {
      return res.status(400).json({ success: false, message: 'Belum terhubung ke ruang pasangan.' });
    }

    const { is_sharing_enabled } = req.body;
    const currentLoc = db.getLocationByUserId(user.id);

    const newStatus = is_sharing_enabled !== undefined 
      ? !!is_sharing_enabled 
      : !(currentLoc?.is_sharing_enabled ?? false);

    const saved = db.upsertLocation(user.id, user.space_id, {
      is_sharing_enabled: newStatus
    });

    return res.json({
      success: true,
      message: newStatus 
        ? 'Berbagi lokasi telah diaktifkan secara mutual ❤️' 
        : 'Berbagi lokasi telah dinonaktifkan demi privasimu.',
      is_sharing_enabled: newStatus,
      location: saved
    });
  } catch (err) {
    console.error('[ToggleConsent Error]', err);
    return res.status(500).json({ success: false, message: 'Gagal memperbarui izin lokasi.' });
  }
};

export const clearHistory = (req, res) => {
  try {
    const user = db.findUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan.' });
    }

    db.clearLocationHistory(user.id);
    return res.json({
      success: true,
      message: 'Riwayat data lokasi berhasil dihapus demi privasimu.'
    });
  } catch (err) {
    console.error('[ClearLocationHistory Error]', err);
    return res.status(500).json({ success: false, message: 'Gagal menghapus riwayat lokasi.' });
  }
};

