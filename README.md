# ❤️ OUR SPACE (Ruang Kita) — Private Couple Web App

A private, full-stack, production-minded romantic web application exclusively designed for **Abdul Rahman Rasyid (Asit)** & **Anisya (Nisya)** to communicate in real-time, share photos (PAP), share mutual consent locations on an interactive map, and preserve cherished digital memories together.

---

## 🌟 Fitur Utama (Core Features)

1. **Eksklusif Berdua (Strict 2-Member Pairing)**:
   - Sistem undangan aman berbasis kode acak kriptografis sekali pakai (`KITA-XXXX`) berdurasi 48 jam.
   - Enforce batas maksimal 2 anggota di level database trigger PostgreSQL dan Express backend.
   - Pihak ketiga otomatis ditolak dan tidak dapat bergabung.

2. **Beranda Romantis (Home Dashboard)**:
   - Sapaan hangat dan mesra: *"Hai, Asit Sayang ❤️"* atau *"Hai, Nisya Cantik ❤️"*.
   - **Love Counter Card**: Perhitungan real-time lama waktu bersama sejak hari jadian (Hari, Jam, Menit, Detik).
   - **Status & Baterai Pasangan**: Indikator online/offline, persentase baterai, dan kabar status terkini.
   - **Pertanyaan Manis Hari Ini**: Koleksi pertanyaan harian intim untuk mempererat obrolan dengan tombol sekali klik kirim ke chat.
   - Pintasan pesan terakhir & cuplikan album foto kenangan terbaru.

3. **Ruang Obrolan Realtime (Private Chat & Love Poke)**:
   - Pengiriman pesan instan berbasis WebSocket (Socket.IO).
   - Tanda pesan terbaca (Read receipts / centang dua merah muda).
   - Indikator pasangan sedang mengetik (*"Nisya sedang mengetik..."*).
   - Reaksi emoji romantis (❤️, 🥰, 🥺, 💖, ✨, 💑).
   - **Colekan Sayang (Love Poke)**: Kirim perhatian instan (*Peluk Jauh, Kecup Manis, Kangen Banget, Colek Sayang, Detak Jantung*) dengan efek suara Web Audio API dan konfeti layar penuh!
   - Pengunggahan foto langsung dari kamera HP atau galeri file dengan lightbox layar penuh.

4. **Kenangan Kita & PAP (Digital Scrapbook)**:
   - Album foto digital dengan kategori: *Kencan Pertama, Liburan Berdua, Momen Manis, Hari Jadian, Kulineran, Pencapaian*.
   - Carousel foto multi-gambar di setiap kartu kenangan.
   - Penandaan momen favorit ❤️ dan filter kategori.
   - Modal detail kenangan dengan cerita lengkap dan lokasi.

5. **Peta & Kabar Saling Rela (Mutual Consent Location)**:
   - Peta interaktif Leaflet dengan tema gelap (Dark OSM tiles).
   - **Prinsip Saling Rela**: Sakelar izin berbagi lokasi independen. Koordinat pasangan **hanya** ditampilkan jika pasangan menyalakan izin berbagi.
   - Marker avatar Asit dan Nisya beranimasi pulsing ring di peta.
   - Garis romantis putus-putus menghubungkan posisi kedua pasangan dengan perhitungan jarak real-time (km/meter).
   - Tombol *Hapus Riwayat Lokasi* untuk privasi penuh.

6. **Pengaturan & Profil (Settings & Pairing)**:
   - Ubah nama panggilan sayang, bio/catatan hati, dan foto profil.
   - Pengaturan tanggal jadian (anniversary) dan nama ruang bersama.
   - **Peralihan Akun Demo Sekali Klik**: Tombol beralih instan antara Asit dan Nisya untuk kemudahan pengujian kedua belah pihak di satu perangkat.
   - Fitur tinggalkan ruang pasangan (unpair) dengan konfirmasi aman.

---

## 🛠️ Arsitektur & Teknologi

### Frontend
- **Framework**: React 19 + Vite 8
- **Routing**: React Router DOM v7
- **Styling**: Tailwind CSS v4 (`@tailwindcss/postcss`) dengan tema Dark Charcoal & Plum Accent
- **Icons**: Lucide React
- **Peta**: Leaflet & React-Leaflet
- **State & Realtime**: Zustand, Socket.IO Client, TanStack Query
- **Form & Validasi**: React Hook Form, Zod
- **Notifikasi & Suara**: Sonner Toaster, Web Audio API Sound Synthesizer, Canvas Confetti
- **PWA**: Web App Manifest, Viewport Fit Cover, Touch-friendly UI

### Backend
- **Runtime**: Node.js v24 (ES Modules)
- **Framework**: Express.js
- **Keamanan**: Helmet, CORS, Express-Rate-Limit, JWT HttpOnly/Bearer Token, Bcrypt password hashing
- **Realtime**: Socket.IO server
- **Upload File**: Multer (disk storage local fallback & Supabase Storage integration)
- **Database**: Supabase PostgreSQL dengan Row Level Security (RLS) + Local In-Memory/JSON Fallback Store

---

## 🚀 Panduan Menjalankan di Lokal (Windows PowerShell)

### 1. Prasyarat
- Node.js versi 18 atau lebih baru (Disarankan Node.js 20+).
- Windows PowerShell.

### 2. Instalasi Dependensi
Buka Windows PowerShell di direktori proyek `d:\Project\UsOnly-App`:

```powershell
# Instal dependensi root, backend, dan frontend sekaligus
npm run install:all
```

### 3. Konfigurasi Environment Variables
Salin berkas contoh environment:

```powershell
# Backend environment
Copy-Item server/.env.example server/.env

# Frontend environment
Copy-Item client/.env.example client/.env
```

Isi berkas `server/.env`:
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
JWT_SECRET=our_space_super_secret_romantic_key_2026

# Opsional: Supabase Credentials
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

### 4. Menjalankan Server & Client Bersama
Jalankan perintah berikut:

```powershell
# Menjalankan server backend (port 5000) dan client frontend (port 5173)
npm run dev
```

Atau jalankan di terminal terpisah jika diinginkan:
```powershell
# Terminal 1: Backend
npm run dev:server

# Terminal 2: Frontend
npm run dev:client
```

Buka peramban di: **`http://localhost:5173/`**

---

## 🧪 Menjalankan Tes Otomatis (Automated Testing)

Proyek ini dilengkapi dengan rangkaian tes otomatis terintegrasi menggunakan Node.js test runner bawaan:

```powershell
# Jalankan seluruh rangkaian tes otomatis
npm test
```

### Cakupan Pengujian:
1. `GET /api/health` — Verifikasi health check server.
2. `POST /api/auth/register` & `login` — Verifikasi registrasi, hashing kata sandi, dan token JWT.
3. `POST /api/auth/quick-login/:role` — Verifikasi autentikasi cepat akun Asit dan Nisya.
4. `POST /api/space` & `/invite` & `/join` — Verifikasi pembuatan ruang, kode pairing kriptografis `KITA-XXXX`, penegakan **single-use** (kode yang sudah dipakai ditolak), dan penegakan **maksimal 2 anggota** (ruang penuh menolak undangan baru).
5. `POST /api/messages`, `PUT reaction`, `PATCH edit`, `DELETE delete` — Verifikasi otorisasi pesan chat.
6. `POST /api/location/toggle-consent` & `GET /api/location` — Verifikasi privasi GPS saling rela (koordinat disembunyikan jika izin mati, ditampilkan jika izin aktif, dan penghapusan riwayat lokasi).
7. `POST /api/milestones` — Verifikasi tanggal spesial berdua.

---

## 🗄️ Panduan Setup Supabase & RLS

Berkas SQL lengkap tersedia di: [`supabase/schema.sql`](file:///d:/Project/UsOnly-App/supabase/schema.sql).

### Langkah Menjalankan di Supabase:
1. Buka [Supabase Dashboard](https://supabase.com/dashboard) dan buat proyek baru.
2. Buka menu **SQL Editor**.
3. Buka file `supabase/schema.sql`, salin seluruh kodenya, lalu klik tombol **Run**.
4. Skrip akan secara otomatis:
   - Membuat ekstensi UUID & PGCrypto.
   - Membuat seluruh tabel (`profiles`, `couple_spaces`, `couple_members`, `invitations`, `messages`, `message_receipts`, `memories`, `locations`, `location_sharing`, `user_presence`, `favorites`, `special_dates`).
   - Membuat trigger PostgreSQL `trg_enforce_couple_max_two_members` yang secara fisik menggagalkan penambahan anggota ke-3.
   - Mengaktifkan Row Level Security (RLS) pada seluruh tabel.
   - Menerapkan kebijakan RLS ketat berbasis kepemilikan couple space.

### Menyiapkan Supabase Storage:
1. Buka menu **Storage** di Supabase Dashboard.
2. Buat bucket baru bernama `our-space-media`.
3. Setel bucket sebagai **Private** (bukan public).
4. Di bagian RLS storage, terapkan kebijakan yang ada pada bagian bawah `supabase/schema.sql`.

---

## 📋 Lembar Uji Manual (Manual Testing Checklist)

| No | Skenario Uji | Prosedur | Hasil yang Diharapkan | Status |
|----|--------------|----------|-----------------------|--------|
| 1 | Onboarding & Quick Login | Buka `http://localhost:5173/`, klik tab 'Demo Cepat', pilih 'Masuk sebagai Asit' | Masuk ke dashboard dengan sapaan *"Hai, Asit Sayang ❤️"* | ✅ Berhasil |
| 2 | Love Counter | Periksa kartu counter waktu bersama di beranda | Hari, jam, menit, dan detik bertambah secara dinamis | ✅ Berhasil |
| 3 | Colekan Sayang (Love Poke) | Klik tombol 'Colekan Sayang', pilih 'Peluk Jauh', klik kirim | Muncul efek suara romantis, pesan tercatat di obrolan | ✅ Berhasil |
| 4 | Obrolan Realtime | Kirim pesan teks dan foto di menu 'Ruang Obrolan' | Pesan tampil dengan penanda waktu, bubble rapi, preview foto | ✅ Berhasil |
| 5 | Kenangan & PAP | Buka 'Kenangan Kita', tambah kenangan baru dengan foto dan kategori | Kenangan tersimpan di scrapbook dan muncul di beranda | ✅ Berhasil |
| 6 | Berbagi Lokasi Saling Rela | Buka 'Peta & Kabar', periksa sakelar izin lokasi | Lokasi hanya dibagi saat sakelar aktif; koordinat tidak dilacak sembunyi-sembunyi | ✅ Berhasil |
| 7 | Hapus Riwayat Lokasi | Klik 'Hapus Riwayat Lokasi' di halaman peta | Koordinat di server dikosongkan demi privasi | ✅ Berhasil |
| 8 | Beralih Akun (Asit ⇄ Nisya) | Buka 'Pengaturan & Profil', klik 'Sebagai Nisya' | Akun berganti ke Nisya, sapaan beranda berubah ke *"Hai, Nisya Sayang ❤️"* | ✅ Berhasil |
| 9 | Kode Undangan Pairing | Buat kode undangan di menu profil | Muncul kode acak format `KITA-XXXX` yang valid 48 jam | ✅ Berhasil |
| 10 | Penegakan Batas 2 Orang | Uji coba penggabungan pihak ketiga ke ruang yang sudah lengkap | Server menolak permintaan dengan kode 400/403 | ✅ Berhasil |

---

## 🔒 Catatan Keamanan & Privasi

- **Tidak Ada Pelacakan GPS Terselubung**: Browser Geolocation hanya dipanggil setelah pengguna secara sadar menyalakan tombol sakelar berbagi lokasi.
- **Isolasi Data Antar Pasangan**: Seluruh query pesan, foto, dan lokasi divalidasi berdasarkan ID ruang bersama (`space_id`), mencegah kerentanan IDOR (Insecure Direct Object References).
- **Enkripsi Kunci & Token**: Token JWT menggunakan secret aman dan kata sandi di-hash menggunakan algoritma Bcrypt dengan 10 salt rounds.
- **Kredensial Aman**: Service role key Supabase tidak pernah diekspos ke sisi klien React.
# UsOnly-App
