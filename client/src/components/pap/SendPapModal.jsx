import React, { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../../store/useAuthStore.js';
import { uploadApi, papApi } from '../../api/endpoints.js';
import { 
  Camera, 
  MapPin, 
  Battery, 
  UploadCloud, 
  X, 
  Loader2, 
  Sparkles, 
  Navigation,
  Heart,
  Send
} from 'lucide-react';
import { toast } from 'sonner';

export const SendPapModal = ({ isOpen, onClose, onPapSent }) => {
  const { user, partner } = useAuthStore();
  
  const [photoFile, setPhotoFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [caption, setCaption] = useState('');
  const [locationName, setLocationName] = useState('');
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [batteryLevel, setBatteryLevel] = useState(85);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const fileInputRef = useRef(null);

  // Auto-detect battery level on mount/open
  useEffect(() => {
    if (isOpen) {
      if ('getBattery' in navigator) {
        navigator.getBattery().then((battery) => {
          const level = Math.round(battery.level * 100);
          setBatteryLevel(level);
        }).catch(() => {
          setBatteryLevel(user?.battery_level || 88);
        });
      } else {
        setBatteryLevel(user?.battery_level || 88);
      }
    }
  }, [isOpen, user?.battery_level]);

  // Handle GPS location auto-detect
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Browser tidak mendukung geolokasi GPS.');
      return;
    }

    setIsDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setLatitude(lat);
        setLongitude(lng);

        // Try reverse geocoding via OpenStreetMap Nominatim for human-readable address
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
          );
          const data = await res.json();
          if (data && data.display_name) {
            const shortName = data.address?.amenity || data.address?.road || data.address?.suburb || data.address?.city || data.display_name.split(',')[0];
            setLocationName(shortName);
            toast.success(`Lokasi terdeteksi: ${shortName}`);
          } else {
            setLocationName('Lokasi Saat Ini');
          }
        } catch (e) {
          setLocationName(`GPS: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        } finally {
          setIsDetectingLocation(false);
        }
      },
      (err) => {
        setIsDetectingLocation(false);
        toast.error('Izin lokasi ditolak atau GPS tidak aktif. Silakan ketik nama lokasi.');
      },
      { timeout: 8000 }
    );
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 15 * 1024 * 1024) {
        toast.error('Ukuran foto maksimal 15MB ya sayang');
        return;
      }
      setPhotoFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      // Auto detect location when user picks a photo if not set yet
      if (!locationName) {
        handleDetectLocation();
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!photoFile) {
      toast.error('Silakan pilih foto PAP terlebih dahulu.');
      return;
    }

    try {
      setIsUploading(true);

      // 1. Upload photo file
      const uploadRes = await uploadApi.uploadPhoto(photoFile);
      if (!uploadRes.success || !uploadRes.url) {
        throw new Error('Gagal mengunggah file foto.');
      }

      // 2. Save PAP record with location and battery level
      const payload = {
        title: caption.trim() ? caption.trim().slice(0, 50) : `PAP dari ${user?.nickname || 'Pasangan'}`,
        story: caption.trim(),
        location_name: locationName.trim() || 'Lokasi Bersama',
        latitude,
        longitude,
        battery_level: Number(batteryLevel),
        photos: [uploadRes.url],
        category: 'sweet_moment',
        memory_date: new Date().toISOString().split('T')[0]
      };

      const res = await papApi.sendPap(payload);
      if (res.success) {
        toast.success(`PAP berhasil dikirim ke ${partner?.nickname || 'pasangan'}! ❤️`);
        onPapSent && onPapSent(res.pap || res.memory);
        handleClose();
      } else {
        throw new Error(res.message || 'Gagal menyimpan PAP');
      }
    } catch (err) {
      toast.error(err.message || 'Gagal mengirim PAP.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setPhotoFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setCaption('');
    setLocationName('');
    setLatitude(null);
    setLongitude(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      onClick={handleClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/85 backdrop-blur-md animate-fade-in overflow-y-auto"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-3xl glass-card border border-romantic-500/30 bg-charcoal-900 shadow-2xl overflow-hidden my-6"
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-charcoal-800 flex items-center justify-between bg-charcoal-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-romantic-600 to-rose-600 text-white shadow-md shadow-romantic-600/30">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-100 flex items-center gap-1.5">
                Kirim PAP Sekarang
                <Sparkles className="w-3.5 h-3.5 text-romantic-400" />
              </h3>
              <p className="text-[11px] text-slate-400">
                Berbagi foto selfie/kegiatan, lokasi, &amp; level baterai ke {partner?.nickname || 'Pasangan'}
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white bg-charcoal-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Photo Picker Box */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />

          {previewUrl ? (
            <div className="relative aspect-video sm:aspect-[4/3] rounded-2xl overflow-hidden border border-romantic-500/40 bg-charcoal-950 group">
              <img
                src={previewUrl}
                alt="Preview PAP"
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => {
                  setPhotoFile(null);
                  URL.revokeObjectURL(previewUrl);
                  setPreviewUrl(null);
                }}
                className="absolute top-3 right-3 p-2 rounded-full bg-charcoal-950/80 text-white hover:bg-rose-600 transition-colors"
                title="Ganti Foto"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="absolute bottom-3 left-3 bg-charcoal-950/80 backdrop-blur-md px-3 py-1 rounded-full text-[11px] text-romantic-300 border border-romantic-500/30 flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5" />
                <span>Foto Siap Dikirim</span>
              </div>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-charcoal-700 hover:border-romantic-500/60 rounded-2xl p-6 text-center cursor-pointer transition-colors bg-charcoal-850/50 hover:bg-charcoal-850 flex flex-col items-center justify-center gap-2 group"
            >
              <div className="w-14 h-14 rounded-2xl bg-romantic-500/10 border border-romantic-500/20 text-romantic-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Camera className="w-7 h-7" />
              </div>
              <p className="text-xs font-semibold text-slate-200">
                Pilih atau Ambil Foto PAP
              </p>
              <p className="text-[11px] text-slate-400 max-w-xs">
                Kamera HP atau galeri foto. Format PNG, JPG (Maks. 15MB)
              </p>
            </div>
          )}

          {/* Location & Battery Metadata Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Location Input with Auto-detect */}
            <div className="p-3.5 rounded-2xl bg-charcoal-850/80 border border-charcoal-700/60 space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-rose-400" />
                  Lokasi PAP
                </label>
                <button
                  type="button"
                  onClick={handleDetectLocation}
                  disabled={isDetectingLocation}
                  className="text-[10px] text-romantic-400 hover:text-romantic-300 font-medium flex items-center gap-1 disabled:opacity-50"
                >
                  {isDetectingLocation ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Mencari...
                    </>
                  ) : (
                    <>
                      <Navigation className="w-3 h-3" />
                      Cari GPS
                    </>
                  )}
                </button>
              </div>

              <input
                type="text"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                placeholder="Contoh: Starbucks GI, Kamar, Kantor..."
                className="w-full px-3 py-1.5 rounded-xl bg-charcoal-900 border border-charcoal-700/80 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-romantic-500"
              />
            </div>

            {/* Battery Level Reader */}
            <div className="p-3.5 rounded-2xl bg-charcoal-850/80 border border-charcoal-700/60 space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                  <Battery className="w-3.5 h-3.5 text-emerald-400" />
                  Baterai HP Saat Ini
                </label>
                <span className="text-xs font-bold font-mono text-emerald-400">
                  {batteryLevel}%
                </span>
              </div>

              <input
                type="range"
                min="1"
                max="100"
                value={batteryLevel}
                onChange={(e) => setBatteryLevel(e.target.value)}
                className="w-full accent-emerald-500 cursor-pointer"
              />
              <span className="text-[10px] text-slate-400 block text-right">
                Terbaca otomatis dari perangkat
              </span>
            </div>
          </div>

          {/* Caption Input */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-300 block">
              Catatan / Pesan untuk {partner?.nickname || 'Pasangan'}:
            </label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Lagi apa sekarang sayang? Tulis pesan manismu di sini..."
              rows={3}
              className="w-full p-3 rounded-2xl bg-charcoal-850 border border-charcoal-700/80 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-romantic-500 focus:ring-1 focus:ring-romantic-500 resize-none leading-relaxed"
            />
          </div>

          {/* Submit Action */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={isUploading}
              className="px-4 py-2.5 rounded-xl text-xs font-medium text-slate-400 hover:bg-charcoal-800 transition-colors"
            >
              Batal
            </button>

            <button
              type="submit"
              disabled={!photoFile || isUploading}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-romantic-600 via-rose-600 to-plum-600 hover:from-romantic-500 hover:to-plum-500 text-white text-xs font-semibold shadow-lg shadow-romantic-600/30 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Mengunggah PAP...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Kirim PAP Sayang ❤️</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
