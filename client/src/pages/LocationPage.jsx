import React, { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../store/useAuthStore.js';
import { useSocketStore } from '../store/useSocketStore.js';
import { locationApi } from '../api/endpoints.js';
import { CoupleMap } from '../components/location/CoupleMap.jsx';
import { LocationConsentBanner } from '../components/location/LocationConsentBanner.jsx';
import { DistanceBadge } from '../components/location/DistanceBadge.jsx';
import { StatusNoteModal } from '../components/location/StatusNoteModal.jsx';
import { 
  MapPin, 
  ShieldCheck, 
  Trash2, 
  AlertCircle, 
  Loader2, 
  Navigation,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';

export const LocationPage = () => {
  const { user, partner, space } = useAuthStore();
  const { socket, emitLocationUpdate } = useSocketStore();

  const [myLocation, setMyLocation] = useState(null);
  const [partnerLocation, setPartnerLocation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshingGps, setIsRefreshingGps] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);

  const watchIdRef = useRef(null);

  const loadLocationState = async () => {
    try {
      setIsLoading(true);
      const res = await locationApi.getState();
      if (res.success) {
        setMyLocation(res.my_location);
        setPartnerLocation(res.partner_location);
      }
    } catch (err) {
      console.warn('[LoadLocation Error]', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLocationState();
  }, []);

  // Listen to socket partner location updates
  useEffect(() => {
    if (!socket) return;

    const handlePartnerLocationUpdated = (loc) => {
      setPartnerLocation(loc);
    };

    socket.on('partner_location_updated', handlePartnerLocationUpdated);
    return () => {
      socket.off('partner_location_updated', handlePartnerLocationUpdated);
    };
  }, [socket]);

  // Handle GPS coordinate fetch
  const fetchGpsCoordinates = () => {
    if (!navigator.geolocation) {
      toast.error('Perangkat atau browser kamu tidak mendukung GPS.');
      return;
    }

    setIsRefreshingGps(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude, accuracy } = pos.coords;

          // Attempt battery check if supported
          let batteryLevel = undefined;
          if (navigator.getBattery) {
            try {
              const battery = await navigator.getBattery();
              batteryLevel = Math.round(battery.level * 100);
            } catch (e) {}
          }

          const res = await locationApi.updateLocation({
            latitude,
            longitude,
            accuracy,
            address_label: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
            battery_level: batteryLevel,
            is_sharing_enabled: true
          });

          if (res.success && res.location) {
            setMyLocation(res.location);
            emitLocationUpdate(res.location);
            toast.success('Lokasi GPS berhasil diperbarui!');
          }
        } catch (err) {
          toast.error('Gagal memperbarui data lokasi ke server.');
        } finally {
          setIsRefreshingGps(false);
        }
      },
      (err) => {
        setIsRefreshingGps(false);
        toast.error(`Akses GPS ditolak atau tidak tersedia: ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  };

  const handleToggleConsent = async () => {
    try {
      const currentStatus = myLocation?.is_sharing_enabled ?? false;
      const newStatus = !currentStatus;

      const res = await locationApi.toggleConsent(newStatus);
      if (res.success) {
        setMyLocation(res.location);
        emitLocationUpdate(res.location);
        toast.success(res.message);

        // If turning ON, immediately refresh GPS coordinates
        if (newStatus) {
          fetchGpsCoordinates();
        }
      }
    } catch (err) {
      toast.error(err.message || 'Gagal mengubah izin lokasi.');
    }
  };

  const handleClearHistory = async () => {
    if (!window.confirm('Hapus seluruh riwayat data lokasimu dari server? Koordinatmu akan segera disetel menjadi kosong.')) {
      return;
    }

    try {
      const res = await locationApi.clearHistory();
      if (res.success) {
        toast.success(res.message);
        loadLocationState();
      }
    } catch (err) {
      toast.error('Gagal menghapus riwayat lokasi.');
    }
  };

  const handleUpdateStatusNote = async (newNote) => {
    try {
      const res = await locationApi.updateLocation({ status_note: newNote });
      if (res.success) {
        setMyLocation(res.location);
        emitLocationUpdate(res.location);
        toast.success('Kabar status berhasil diperbarui!');
      }
    } catch (err) {
      toast.error('Gagal memperbarui status.');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-charcoal-800">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-gradient-to-tr from-indigo-600 to-plum-600 text-white shadow-lg shadow-indigo-600/20">
            <MapPin className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
              Peta Lokasi &amp; Kabar Berdua
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-950/70 text-emerald-300 border border-emerald-800/50 font-normal">
                Saling Rela (Mutual Consent)
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Lihat posisi saling mengisi jarak antara Asit &amp; Nisya secara privat
            </p>
          </div>
        </div>

        {/* Clear history button */}
        <button
          onClick={handleClearHistory}
          className="px-3.5 py-2 rounded-xl text-xs font-medium bg-charcoal-850 hover:bg-rose-500/10 text-slate-400 hover:text-rose-300 border border-charcoal-700/80 hover:border-rose-500/30 transition-all flex items-center gap-1.5 active:scale-95 self-start sm:self-auto"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Hapus Riwayat Lokasi
        </button>
      </div>

      {/* 1. Mutual Consent Control Banner */}
      <LocationConsentBanner
        isSharingEnabled={myLocation?.is_sharing_enabled ?? false}
        onToggleConsent={handleToggleConsent}
        onRefreshLocation={fetchGpsCoordinates}
        isRefreshing={isRefreshingGps}
        lastUpdated={myLocation?.last_updated_at}
      />

      {/* 2. Interactive Leaflet Map */}
      <div className="h-[400px] sm:h-[480px] w-full">
        {isLoading ? (
          <div className="w-full h-full rounded-3xl bg-charcoal-900/60 border border-charcoal-700/60 flex flex-col items-center justify-center text-slate-400 gap-2">
            <Loader2 className="w-7 h-7 animate-spin text-romantic-400" />
            <span className="text-xs">Memuat peta cinta kita...</span>
          </div>
        ) : (
          <CoupleMap
            myLocation={myLocation}
            partnerLocation={partnerLocation}
            myUser={user}
            partnerUser={partner}
          />
        )}
      </div>

      {/* 3. Distance & Kabar Status Cards */}
      <DistanceBadge
        myLocation={myLocation}
        partnerLocation={partnerLocation}
        myUser={user}
        partnerUser={partner}
        onOpenStatusModal={() => setIsStatusModalOpen(true)}
      />

      {/* 4. Privacy Principles Note */}
      <div className="p-4 rounded-2xl bg-charcoal-900/40 border border-charcoal-800 text-xs text-slate-400 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="font-semibold text-slate-200">
            Prinsip Privasi Berdua Our Space
          </h4>
          <p className="leading-relaxed">
            Data lokasi hanya disimpan sebagai koordinat terakhir yang diizinkan dan tidak disimpan sebagai jalur pelacakan abadi. Matikan sakelar di atas kapan pun kamu ingin menghentikan pembagian posisi. Koordinat tidak dapat diakses oleh pihak ketiga atau publik.
          </p>
        </div>
      </div>

      {/* Status Note Modal */}
      <StatusNoteModal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        currentNote={myLocation?.status_note}
        onSave={handleUpdateStatusNote}
      />
    </div>
  );
};
