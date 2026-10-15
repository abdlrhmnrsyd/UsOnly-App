import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../../data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Generate default initial database
const getInitialData = () => {
  const salt = bcrypt.genSaltSync(10);
  const defaultPasswordHash = bcrypt.hashSync('password123', salt);

  const asitId = '3458cedf-45c9-4312-a346-ebb29a2c742a';
  const nisyaId = '2aae1c6e-dcf4-4325-b355-e7141f32fa5e';
  const spaceId = '6e0c0d52-46fe-4d82-a977-20e1c7be0d85';

  return {
    users: [
      {
        id: asitId,
        email: 'asit@ourspace.id',
        password_hash: defaultPasswordHash,
        full_name: 'Abdul Rahman Rasyid',
        nickname: 'Asit',
        avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=faces',
        bio: 'Mencintai Nisya selalu dan selamanya ✨',
        theme_preference: 'dark',
        status_text: 'Lagi mikirin kamu 🥰',
        battery_level: 84,
        space_id: spaceId,
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: new Date().toISOString()
      },
      {
        id: nisyaId,
        email: 'nisya@ourspace.id',
        password_hash: defaultPasswordHash,
        full_name: 'Anisya',
        nickname: 'Nisya',
        avatar_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&h=200&fit=crop&crop=faces',
        bio: 'Bahagia ada Asit di sisiku ❤️',
        theme_preference: 'dark',
        status_text: 'Santai di rumah ✨',
        battery_level: 92,
        space_id: spaceId,
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: new Date().toISOString()
      }
    ],
    spaces: [
      {
        id: spaceId,
        name: 'Ruang Asit & Nisya',
        anniversary_date: '2023-08-14',
        partner1_id: asitId,
        partner2_id: nisyaId,
        status: 'paired',
        cover_photo_url: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=1200&h=400&fit=crop',
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: new Date().toISOString()
      }
    ],
    pair_invitations: [],
    messages: [
      {
        id: 'msg-1',
        space_id: spaceId,
        sender_id: asitId,
        content: 'Pagi sayangku! Udah sarapan belum hari ini? ❤️',
        media_url: null,
        message_type: 'text',
        reaction: '❤️',
        is_read: true,
        read_at: '2026-10-13T08:05:00.000Z',
        created_at: new Date(Date.now() - 3600000 * 4).toISOString()
      },
      {
        id: 'msg-2',
        space_id: spaceId,
        sender_id: nisyaId,
        content: 'Pagi Asit! Udah nih, roti bakar sama teh hangat. Kamu jangan lupa makan yaa, semangat kerjanya hari ini!',
        media_url: null,
        message_type: 'text',
        reaction: '🥰',
        is_read: true,
        read_at: '2026-10-13T08:10:00.000Z',
        created_at: new Date(Date.now() - 3600000 * 3.8).toISOString()
      },
      {
        id: 'msg-3',
        space_id: spaceId,
        sender_id: asitId,
        content: 'Peluk Jauh 🤗',
        media_url: null,
        message_type: 'poke',
        reaction: '🥺',
        is_read: true,
        read_at: '2026-10-13T08:15:00.000Z',
        created_at: new Date(Date.now() - 3600000 * 2).toISOString()
      },
      {
        id: 'msg-4',
        space_id: spaceId,
        sender_id: nisyaId,
        content: 'Aww peluk balik erat-erat 🤗 Nanti malam teleponan ya?',
        media_url: null,
        message_type: 'text',
        reaction: '💖',
        is_read: true,
        read_at: '2026-10-13T08:16:00.000Z',
        created_at: new Date(Date.now() - 3600000 * 1.5).toISOString()
      }
    ],
    memories: [
      {
        id: 'mem-1',
        space_id: spaceId,
        created_by: asitId,
        title: 'Kencan Pertama Kita di Senja Cafe',
        story: 'Waktu pertama kali kita duduk berdua ngobrol berjam-jam sampai cafe mau tutup. Rasanya waktu cepat banget berlalu kalau sama kamu.',
        memory_date: '2023-08-14',
        category: 'first_date',
        location_name: 'Senja Coffee & Eatery, Bandung',
        photos: [
          'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&fit=crop',
          'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&fit=crop'
        ],
        is_favorite: true,
        created_at: '2024-01-05T12:00:00.000Z',
        updated_at: '2024-01-05T12:00:00.000Z'
      },
      {
        id: 'mem-2',
        space_id: spaceId,
        created_by: nisyaId,
        title: 'Jalan Santai & Sunset di Pantai Indah',
        story: 'Nisya ingat waktu ombak hampir kena sepatu kita berdua dan Asit langsung narik tangan Nisya sambil ketawa. Momen sederhana tapi paling manis.',
        memory_date: '2023-11-20',
        category: 'trip',
        location_name: 'Pantai Indah Kapuk, Jakarta',
        photos: [
          'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&fit=crop'
        ],
        is_favorite: true,
        created_at: '2024-02-10T14:30:00.000Z',
        updated_at: '2024-02-10T14:30:00.000Z'
      },
      {
        id: 'mem-3',
        space_id: spaceId,
        created_by: asitId,
        title: 'Merayakan 1 Tahun Perjalanan Cinta Kita',
        story: '365 hari penuh cerita, tawa, dan rasa syukur bisa saling melengkapi. Semoga langkah kita selalu searah sampai masa depan nanti.',
        memory_date: '2024-08-14',
        category: 'anniversary',
        location_name: 'Skyline Garden Restaurant',
        photos: [
          'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=800&fit=crop'
        ],
        is_favorite: true,
        created_at: '2024-08-14T20:00:00.000Z',
        updated_at: '2024-08-14T20:00:00.000Z'
      }
    ],
    locations: [
      {
        id: 'loc-asit',
        user_id: asitId,
        space_id: spaceId,
        latitude: -6.2088,
        longitude: 106.8456,
        accuracy: 15,
        address_label: 'Jakarta Pusat, DKI Jakarta',
        status_note: 'Di kantor, lagi ngerjain project 💻',
        is_sharing_enabled: true,
        battery_level: 84,
        last_updated_at: new Date(Date.now() - 1000 * 60 * 5).toISOString()
      },
      {
        id: 'loc-nisya',
        user_id: nisyaId,
        space_id: spaceId,
        latitude: -6.2297,
        longitude: 106.8167,
        accuracy: 10,
        address_label: 'Jakarta Selatan, DKI Jakarta',
        status_note: 'Lagi santai di rumah baca buku 📖',
        is_sharing_enabled: true,
        battery_level: 92,
        last_updated_at: new Date(Date.now() - 1000 * 60 * 8).toISOString()
      }
    ],
    special_dates: [
      {
        id: 'date-1',
        space_id: spaceId,
        title: 'Hari Jadian Kita (Anniversary)',
        event_date: '2023-08-14',
        is_recurring_yearly: true,
        icon: 'heart',
        notes: 'Hari pertama kita resmi memulai perjalanan berdua'
      },
      {
        id: 'date-2',
        space_id: spaceId,
        title: 'Ulang Tahun Nisya Sayang 🎂',
        event_date: '2024-05-18',
        is_recurring_yearly: true,
        icon: 'gift',
        notes: 'Hari lahir bidadari tercantik'
      },
      {
        id: 'date-3',
        space_id: spaceId,
        title: 'Ulang Tahun Asit 🎂',
        event_date: '2024-11-25',
        is_recurring_yearly: true,
        icon: 'gift',
        notes: 'Hari lahir imam terbaik'
      }
    ]
  };
};

class DataStore {
  constructor() {
    this.data = null;
    this.init();
  }

  init() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
      } else {
        this.data = getInitialData();
        this.save();
      }
    } catch (err) {
      console.warn('[DataStore] Corrupted or missing db.json, generating default data:', err.message);
      this.data = getInitialData();
      this.save();
    }
  }

  save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('[DataStore] Save failed:', err.message);
    }
  }

  // Users
  findUserById(id) {
    return this.data.users.find(u => u.id === id);
  }

  findUserByEmail(email) {
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  createUser(user) {
    this.data.users.push(user);
    this.save();
    return user;
  }

  updateUser(id, updates) {
    const idx = this.data.users.findIndex(u => u.id === id);
    if (idx !== -1) {
      this.data.users[idx] = { ...this.data.users[idx], ...updates, updated_at: new Date().toISOString() };
      this.save();
      return this.data.users[idx];
    }
    return null;
  }

  // Spaces
  findSpaceById(id) {
    return this.data.spaces.find(s => s.id === id);
  }

  createSpace(space) {
    this.data.spaces.push(space);
    this.save();
    return space;
  }

  updateSpace(id, updates) {
    const idx = this.data.spaces.findIndex(s => s.id === id);
    if (idx !== -1) {
      this.data.spaces[idx] = { ...this.data.spaces[idx], ...updates, updated_at: new Date().toISOString() };
      this.save();
      return this.data.spaces[idx];
    }
    return null;
  }

  // Invitations
  createInvitation(invite) {
    this.data.pair_invitations.push(invite);
    this.save();
    return invite;
  }

  findInvitationByCode(code) {
    return this.data.pair_invitations.find(inv => inv.code.toUpperCase() === code.trim().toUpperCase() && !inv.is_used);
  }

  findActiveInvitationBySpaceId(spaceId) {
    const now = new Date();
    return this.data.pair_invitations.find(
      inv => inv.space_id === spaceId && !inv.is_used && new Date(inv.expires_at) > now
    );
  }

  updateInvitation(id, updates) {
    const idx = this.data.pair_invitations.findIndex(inv => inv.id === id);
    if (idx !== -1) {
      this.data.pair_invitations[idx] = { ...this.data.pair_invitations[idx], ...updates };
      this.save();
      return this.data.pair_invitations[idx];
    }
    return null;
  }

  // Messages
  getMessagesBySpaceId(spaceId) {
    return this.data.messages
      .filter(m => m.space_id === spaceId)
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  }

  createMessage(msg) {
    this.data.messages.push(msg);
    this.save();
    return msg;
  }

  updateMessage(id, updates) {
    const idx = this.data.messages.findIndex(m => m.id === id);
    if (idx !== -1) {
      this.data.messages[idx] = { ...this.data.messages[idx], ...updates };
      this.save();
      return this.data.messages[idx];
    }
    return null;
  }

  editMessage(id, userId, content) {
    const idx = this.data.messages.findIndex(m => m.id === id && m.sender_id === userId);
    if (idx !== -1) {
      this.data.messages[idx] = {
        ...this.data.messages[idx],
        content,
        edited_at: new Date().toISOString()
      };
      this.save();
      return this.data.messages[idx];
    }
    return null;
  }

  deleteMessage(id, userId) {
    const idx = this.data.messages.findIndex(m => m.id === id && m.sender_id === userId);
    if (idx !== -1) {
      this.data.messages.splice(idx, 1);
      this.save();
      return true;
    }
    return false;
  }

  markMessagesAsRead(spaceId, recipientUserId) {
    let modified = false;
    this.data.messages.forEach(m => {
      if (m.space_id === spaceId && m.sender_id !== recipientUserId && !m.is_read) {
        m.is_read = true;
        m.read_at = new Date().toISOString();
        modified = true;
      }
    });
    if (modified) this.save();
  }

  // Memories
  getMemoriesBySpaceId(spaceId) {
    return this.data.memories
      .filter(m => m.space_id === spaceId)
      .sort((a, b) => new Date(b.memory_date) - new Date(a.memory_date));
  }

  createMemory(memory) {
    this.data.memories.push(memory);
    this.save();
    return memory;
  }

  updateMemory(id, updates) {
    const idx = this.data.memories.findIndex(m => m.id === id);
    if (idx !== -1) {
      this.data.memories[idx] = { ...this.data.memories[idx], ...updates, updated_at: new Date().toISOString() };
      this.save();
      return this.data.memories[idx];
    }
    return null;
  }

  deleteMemory(id) {
    const prevLen = this.data.memories.length;
    this.data.memories = this.data.memories.filter(m => m.id !== id);
    if (this.data.memories.length !== prevLen) {
      this.save();
      return true;
    }
    return false;
  }

  // Locations
  getLocationByUserId(userId) {
    return this.data.locations.find(l => l.user_id === userId);
  }

  getLocationsBySpaceId(spaceId) {
    return this.data.locations.filter(l => l.space_id === spaceId);
  }

  clearLocationHistory(userId) {
    const idx = this.data.locations.findIndex(l => l.user_id === userId);
    if (idx !== -1) {
      this.data.locations[idx] = {
        ...this.data.locations[idx],
        latitude: null,
        longitude: null,
        accuracy: null,
        address_label: 'Lokasi telah dihapus',
        status_note: '',
        is_sharing_enabled: false,
        last_updated_at: new Date().toISOString()
      };
      this.save();
      return true;
    }
    return false;
  }

  leaveSpace(userId) {
    const user = this.findUserById(userId);
    if (!user || !user.space_id) return false;
    const spaceId = user.space_id;
    const space = this.findSpaceById(spaceId);
    if (space) {
      if (space.partner1_id === userId) {
        if (space.partner2_id) {
          space.partner1_id = space.partner2_id;
          space.partner2_id = null;
          space.status = 'pending';
        } else {
          const sIdx = this.data.spaces.findIndex(s => s.id === spaceId);
          if (sIdx !== -1) this.data.spaces.splice(sIdx, 1);
        }
      } else if (space.partner2_id === userId) {
        space.partner2_id = null;
        space.status = 'pending';
      }
      space.updated_at = new Date().toISOString();
    }
    this.updateUser(userId, { space_id: null });
    this.save();
    return true;
  }

  upsertLocation(userId, spaceId, updates) {
    const idx = this.data.locations.findIndex(l => l.user_id === userId);
    const now = new Date().toISOString();
    if (idx !== -1) {
      this.data.locations[idx] = {
        ...this.data.locations[idx],
        ...updates,
        space_id: spaceId,
        last_updated_at: now
      };
      this.save();
      return this.data.locations[idx];
    } else {
      const newLoc = {
        id: `loc-${Date.now()}`,
        user_id: userId,
        space_id: spaceId,
        latitude: null,
        longitude: null,
        accuracy: null,
        address_label: 'Belum dibagikan',
        status_note: '',
        is_sharing_enabled: false,
        battery_level: null,
        last_updated_at: now,
        ...updates
      };
      this.data.locations.push(newLoc);
      this.save();
      return newLoc;
    }
  }

  // Special Dates
  getSpecialDatesBySpaceId(spaceId) {
    return this.data.special_dates
      .filter(d => d.space_id === spaceId)
      .sort((a, b) => new Date(a.event_date) - new Date(b.event_date));
  }

  createSpecialDate(item) {
    this.data.special_dates.push(item);
    this.save();
    return item;
  }

  deleteSpecialDate(id) {
    this.data.special_dates = this.data.special_dates.filter(d => d.id !== id);
    this.save();
    return true;
  }
}

export const db = new DataStore();
