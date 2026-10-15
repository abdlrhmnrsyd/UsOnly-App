import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import multer from 'multer';
import { supabaseAdminClient } from '../config/supabase.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOADS_DIR = path.resolve(__dirname, '../../uploads');

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Multer disk storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    cb(null, `photo-${uniqueSuffix}${ext}`);
  }
});

// File filter (images only, max 10MB)
export const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Hanya file gambar (JPEG, PNG, WebP) yang diperbolehkan.'), false);
    }
  }
});

export const handleSingleUpload = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Tidak ada file gambar yang diunggah.' });
    }

    const filename = req.file.filename;
    let fileUrl = `/uploads/${filename}`;

    // If Supabase Storage is configured, optionally upload to Supabase Storage
    if (supabaseAdminClient) {
      try {
        const fileBuffer = fs.readFileSync(req.file.path);
        const { data, error } = await supabaseAdminClient.storage
          .from('our-space-media')
          .upload(`uploads/${filename}`, fileBuffer, {
            contentType: req.file.mimetype,
            upsert: true
          });

        if (!error && data) {
          const { data: publicData } = supabaseAdminClient.storage
            .from('our-space-media')
            .getPublicUrl(`uploads/${filename}`);

          if (publicData?.publicUrl) {
            fileUrl = publicData.publicUrl;
          }
        }
      } catch (sbErr) {
        console.warn('[Supabase Storage Upload Warning]', sbErr.message);
        // Fallback to local file URL
      }
    }

    return res.json({
      success: true,
      message: 'Foto berhasil diunggah ❤️',
      url: fileUrl
    });
  } catch (err) {
    console.error('[Upload Error]', err);
    return res.status(500).json({ success: false, message: 'Gagal mengunggah foto.' });
  }
};
