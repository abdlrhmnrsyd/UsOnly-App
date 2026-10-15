# 📚 Dokumentasi Lengkap API — Our Space (Mobile App Integration)

Dokumentasi ini mencakup seluruh REST API Endpoint dan WebSocket Events yang siap digunakan untuk membangun aplikasi mobile (Flutter, React Native, Kotlin, Swift, dsb).

---

## 🌐 1. Konfigurasi Dasar

- **Base URL (Localhost)**: `http://localhost:5000/api`
- **Base URL (Testing di HP Android/iOS via WiFi)**: `http://<IP_KOMPUTER_ANDA>:5000/api` (contoh: `http://192.168.1.10:5000/api`)
- **WebSocket URL**: `http://<IP_KOMPUTER_ANDA>:5000` (Socket.IO client v4)
- **Header Standar**:
  ```http
  Content-Type: application/json
  Authorization: Bearer <JWT_TOKEN>
  ```
  *(Endpoint public `/auth/login`, `/auth/register`, `/auth/quick-login` tidak membutuhkan header Authorization).*

---

## 🔐 2. Autentikasi & Profil (`/api/auth`)

### 2.1 Register (Daftar Akun Baru)
- **Method**: `POST`
- **Endpoint**: `/api/auth/register`
- **Body (JSON)**:
  ```json
  {
    "email": "asit@ourspace.id",
    "password": "password123",
    "fullName": "Abdul Rahman Rasyid",
    "nickname": "Asit"
  }
  ```
- **Response `201 Created`**:
  ```json
  {
    "success": true,
    "message": "Selamat datang di Our Space, Asit!",
    "token": "eyJhbGciOi...",
    "user": {
      "id": "user-123",
      "email": "asit@ourspace.id",
      "full_name": "Abdul Rahman Rasyid",
      "nickname": "Asit",
      "avatar_url": "https://...",
      "space_id": null
    }
  }
  ```

### 2.2 Login (Masuk Akun)
- **Method**: `POST`
- **Endpoint**: `/api/auth/login`
- **Body (JSON)**:
  ```json
  {
    "email": "asit@ourspace.id",
    "password": "password123"
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "message": "Selamat datang kembali, Asit! ❤️",
    "token": "eyJhbGciOi...",
    "user": { ... }
  }
  ```

### 2.3 Quick Login (Demo Cepat)
- **Method**: `POST`
- **Endpoint**: `/api/auth/quick-login/:role` (`:role` = `asit` atau `nisya`)
- **Body**: `{}`
- **Response `200 OK`**: Mengembalikan JWT Token dan data profil demo.

### 2.4 Get Me & Partner Info (Cek Sesi & Pasangan)
- **Method**: `GET`
- **Endpoint**: `/api/auth/me`
- **Headers**: `Authorization: Bearer <TOKEN>`
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "user": {
      "id": "user-1",
      "email": "asit@ourspace.id",
      "full_name": "Abdul Rahman Rasyid",
      "nickname": "Asit",
      "avatar_url": "https://...",
      "space_id": "space-1"
    },
    "space": {
      "id": "space-1",
      "name": "Ruang Asit & Nisya",
      "anniversary_date": "2023-08-14",
      "partner1_id": "user-1",
      "partner2_id": "user-2",
      "status": "paired"
    },
    "partner": {
      "id": "user-2",
      "email": "nisya@ourspace.id",
      "full_name": "Anisya",
      "nickname": "Nisya",
      "avatar_url": "https://..."
    }
  }
  ```
  > **Catatan Mobile**: Jika `partner === null` atau `space === null`, arahkan user ke **Layar Pairing (Buat/Masukkan Kode)**.

### 2.5 Update Profil
- **Method**: `PUT`
- **Endpoint**: `/api/auth/profile`
- **Headers**: `Authorization: Bearer <TOKEN>`
- **Body (JSON)**:
  ```json
  {
    "full_name": "Abdul Rahman Rasyid",
    "nickname": "Asit",
    "bio": "Mencintai Nisya selalu ❤️",
    "avatar_url": "https://...",
    "theme_preference": "dark",
    "status_text": "Lagi mikirin kamu 🥰"
  }
  ```

---

## 💍 3. Ruang Pasangan & Pairing Code (`/api/space`)

### 3.1 Buat Kode Pairing (Generate Code)
- **Method**: `POST`
- **Endpoint**: `/api/space/invite`
- **Headers**: `Authorization: Bearer <TOKEN>`
- **Body**: `{}`
- **Response `201 Created`**:
  ```json
  {
    "success": true,
    "message": "Kode undangan berhasil dibuat.",
    "invitation": {
      "code": "KITA-8J2K",
      "expires_at": "2026-10-17T12:00:00.000Z"
    }
  }
  ```

### 3.2 Masukkan Kode Pairing (Join Space)
- **Method**: `POST`
- **Endpoint**: `/api/space/join`
- **Headers**: `Authorization: Bearer <TOKEN>`
- **Body (JSON)**:
  ```json
  {
    "code": "KITA-8J2K"
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "message": "Berhasil terhubung dengan Nisya! Selamat datang di Ruang Kita ❤️",
    "space": { ... },
    "partner": { ... }
  }
  ```

### 3.3 Detail Ruang
- **Method**: `GET`
- **Endpoint**: `/api/space`
- **Headers**: `Authorization: Bearer <TOKEN>`

### 3.4 Update Pengaturan Ruang
- **Method**: `PUT`
- **Endpoint**: `/api/space`
- **Body (JSON)**:
  ```json
  {
    "name": "Ruang Cinta Selamanya",
    "anniversary_date": "2023-08-14",
    "cover_photo_url": "https://..."
  }
  ```

### 3.5 Tinggalkan / Reset Ruang Pasangan
- **Method**: `POST`
- **Endpoint**: `/api/space/leave`

---

## 💬 4. Obrolan & Pesan Cinta (`/api/messages`)

### 4.1 Ambil Semua Pesan
- **Method**: `GET`
- **Endpoint**: `/api/messages`
- **Headers**: `Authorization: Bearer <TOKEN>`
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "messages": [
      {
        "id": "msg-1",
        "space_id": "space-1",
        "sender_id": "user-1",
        "content": "Pagi sayangku! ❤️",
        "media_url": null,
        "message_type": "text", // "text" | "poke" | "image" | "system"
        "reaction": "❤️",
        "is_read": true,
        "created_at": "2026-10-15T08:00:00.000Z"
      }
    ]
  }
  ```

### 4.2 Kirim Pesan Baru
- **Method**: `POST`
- **Endpoint**: `/api/messages`
- **Headers**: `Authorization: Bearer <TOKEN>`
- **Body (JSON)**:
  ```json
  {
    "content": "Lagi apa nih sayang? 🥰",
    "media_url": null,
    "message_type": "text"
  }
  ```

### 4.3 Tandai Pesan Telah Dibaca
- **Method**: `POST`
- **Endpoint**: `/api/messages/read`

### 4.4 Beri Reaksi Emoji pada Pesan
- **Method**: `PUT`
- **Endpoint**: `/api/messages/:id/reaction`
- **Body (JSON)**:
  ```json
  {
    "reaction": "❤️"
  }
  ```

### 4.5 Edit & Hapus Pesan
- **Edit**: `PATCH /api/messages/:id` -> `{ "content": "teks baru" }`
- **Hapus**: `DELETE /api/messages/:id`

---

## 📸 5. PAP Kita (Foto, Lokasi & Baterai) (`/api/pap` atau `/api/memories`)

### 5.1 Ambil Daftar PAP
- **Method**: `GET`
- **Endpoint**: `/api/pap`
- **Headers**: `Authorization: Bearer <TOKEN>`
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "memories": [
      {
        "id": "pap-1",
        "sender_name": "Asit",
        "sender_avatar": "https://...",
        "title": "PAP di Kantor",
        "story": "Lagi istirahat siang makan siang bareng kawan kantor",
        "memory_date": "2026-10-15",
        "location_name": "Jakarta Selatan",
        "latitude": -6.2088,
        "longitude": 106.8456,
        "battery_level": 82,
        "photos": ["http://localhost:5000/uploads/photo-123.jpg"],
        "is_favorite": true,
        "created_at": "2026-10-15T12:00:00.000Z"
      }
    ]
  }
  ```

### 5.2 Kirim PAP Baru
- **Method**: `POST`
- **Endpoint**: `/api/pap`
- **Headers**: `Authorization: Bearer <TOKEN>`
- **Body (JSON)**:
  ```json
  {
    "title": "Lagi di kafe nih sayang ☕",
    "story": "Nungguin kamu pulang kerja",
    "location_name": "Senopati, Jakarta Selatan",
    "latitude": -6.2297,
    "longitude": 106.8075,
    "battery_level": 88,
    "photos": ["https://.../photo.jpg"],
    "is_favorite": false
  }
  ```

### 5.3 Toggle Favorit & Hapus PAP
- **Favorit**: `PATCH /api/pap/:id/favorite`
- **Hapus**: `DELETE /api/pap/:id`

---

## 📍 6. Lokasi & Status Baterai Saling Rela (`/api/location`)

### 6.1 Ambil Status Lokasi Keduanya
- **Method**: `GET`
- **Endpoint**: `/api/location`
- **Headers**: `Authorization: Bearer <TOKEN>`
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "my_location": {
      "latitude": -6.2088,
      "longitude": 106.8456,
      "status_note": "Lagi di kampus 📚",
      "battery_level": 75,
      "is_sharing_enabled": true,
      "updated_at": "2026-10-15T11:45:00.000Z"
    },
    "partner_location": {
      "latitude": -6.2200,
      "longitude": 106.8300,
      "status_note": "Santai di rumah ✨",
      "battery_level": 90,
      "is_sharing_enabled": true,
      "updated_at": "2026-10-15T11:50:00.000Z"
    },
    "distance_km": 2.1
  }
  ```

### 6.2 Perbarui Lokasi / Catatan Status / Baterai
- **Method**: `POST`
- **Endpoint**: `/api/location/update`
- **Body (JSON)**:
  ```json
  {
    "latitude": -6.2088,
    "longitude": 106.8456,
    "status_note": "Lagi OTW jemput kamu 🛵",
    "battery_level": 80
  }
  ```

### 6.3 Aktif / Nonaktifkan Saling Berbagi (Consent)
- **Method**: `POST`
- **Endpoint**: `/api/location/toggle-consent`
- **Body (JSON)**:
  ```json
  {
    "is_sharing_enabled": true
  }
  ```

---

## 📅 7. Tanggal Spesial / Milestones (`/api/milestones`)

- **Ambil Semua**: `GET /api/milestones`
- **Tambah Baru**: `POST /api/milestones`
  ```json
  {
    "title": "Anniversary Jadian",
    "date": "2023-08-14",
    "category": "anniversary",
    "notes": "Hari pertama kita jadian ❤️"
  }
  ```
- **Hapus**: `DELETE /api/milestones/:id`

---

## 📤 8. Upload File Gambar / Foto (`/api/upload`)

- **Method**: `POST`
- **Endpoint**: `/api/upload`
- **Headers**:
  ```http
  Authorization: Bearer <TOKEN>
  Content-Type: multipart/form-data
  ```
- **Form Data Field**: `photo` (file gambar JPEG, PNG, WebP)
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "message": "Foto berhasil diunggah ❤️",
    "url": "http://localhost:5000/uploads/photo-1729000000000.jpg"
  }
  ```

---

## ⚡ 9. Realtime WebSocket Events (Socket.IO)

Gunakan library Socket.IO Client di mobile (`socket_io_client` di Flutter atau `socket.io-client` di React Native):

### Inisialisasi:
```dart
// Contoh di Flutter Dart
IO.Socket socket = IO.io('http://192.168.1.X:5000', <String, dynamic>{
  'transports': ['websocket'],
  'autoConnect': true,
});

// 1. Gabung ke room pasangan setelah login
socket.emit('join_space', {
  'spaceId': user.spaceId,
  'userId': user.id,
});
```

### Event yang Dikirim dari Mobile (Client Emit):
| Event Name | Payload | Keterangan |
| :--- | :--- | :--- |
| `join_space` | `{"spaceId": "...", "userId": "..."}` | Masuk ke room pasangan |
| `new_message` | Message object JSON | Kirim chat realtime |
| `typing_start` | `{"nickname": "Asit"}` | Mengabari pasangan sedang mengetik |
| `typing_stop` | `{}` | Berhenti mengetik |
| `message_reaction` | `{"messageId": "...", "reaction": "❤️"}` | Reaksi emoji pada pesan |
| `messages_read` | `{}` | Tandai sudah membaca |
| `send_love_poke` | `{"pokeType": "hug", "senderNickname": "Asit", "customNote": "..."}` | Kirim Colekan Cinta (`hug`, `kiss`, `miss`, `tickle`, `heartbeat`) |
| `location_update`| Location data JSON | Broadcast koordinat realtime |
| `status_update` | `{"battery_level": 85, "status_text": "..."}` | Update baterai / status |

### Event yang Didengarkan oleh Mobile (Client Listen):
| Event Name | Data yang Diterima | Keterangan |
| :--- | :--- | :--- |
| `partner_online` | `{"userId": "..."}` | Pasangan baru saja online |
| `partner_offline` | `{"userId": "..."}` | Pasangan offline |
| `partner_joined` | `{"message": "...", "partner": {...}, "space": {...}}` | Pasangan baru saja memasukkan kode pairing! |
| `message_received`| Message object | Pesan baru masuk dari pasangan |
| `partner_typing_start`| `{"nickname": "..."}` | Menampilkan animasi sedang mengetik |
| `partner_typing_stop` | `{}` | Menyembunyikan animasi mengetik |
| `reaction_received`| `{"messageId": "...", "reaction": "❤️"}` | Pasangan memberi reaksi emoji |
| `partner_love_poke`| `{"pokeType": "...", "pokeTitle": "Peluk Jauh", "icon": "🤗", ...}` | Memunculkan popup/vibrasi Colekan Sayang di layar |
| `partner_location_updated`| Location JSON | Update marker peta pasangan realtime |
