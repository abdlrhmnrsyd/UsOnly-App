import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore.js';
import { useSocketStore } from '../store/useSocketStore.js';
import { papApi, messageApi } from '../api/endpoints.js';
import { PapCard } from '../components/pap/PapCard.jsx';
import { SendPapModal } from '../components/pap/SendPapModal.jsx';
import { 
  Camera, 
  Plus, 
  Heart, 
  Sparkles, 
  Filter, 
  Loader2, 
  Send, 
  Battery, 
  MapPin, 
  X,
  BellRing
} from 'lucide-react';
import { toast } from 'sonner';

export const PapPage = () => {
  const navigate = useNavigate();
  const { user, partner } = useAuthStore();
  const { socket } = useSocketStore();

  const [paps, setPaps] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterSender, setFilterSender] = useState('all'); // 'all' | 'asit' | 'nisya' | 'favorites'
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(null);

  const loadPaps = async () => {
    try {
      setIsLoading(true);
      const res = await papApi.getPaps();
      if (res.success && res.memories) {
        setPaps(res.memories);
      }
    } catch (err) {
      console.warn('[LoadPaps Error]', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPaps();
  }, []);

  const handlePapSent = (newPap) => {
    setPaps((prev) => [newPap, ...prev]);

    // Send notification in chat
    messageApi.sendMessage({
      content: `📷 Mengirimkan PAP baru dari ${newPap.location_name || 'lokasinya'} (Baterai: ${newPap.battery_level || 80}%) ❤️\nCek di menu PAP Kita ya!`,
      message_type: 'text'
    }).catch(() => null);
  };

  const handleToggleFavorite = async (id) => {
    try {
      const res = await papApi.toggleFavorite(id);
      if (res.success) {
        setPaps((prev) =>
          prev.map((p) =>
            p.id === id ? { ...p, is_favorite: !p.is_favorite } : p
          )
        );
        toast.success('Favorit diperbarui ❤️');
      }
    } catch (err) {
      toast.error('Gagal memperbarui favorit.');
    }
  };

  const handleDeletePap = async (id) => {
    if (!window.confirm('Yakin ingin menghapus PAP ini?')) return;

    try {
      await papApi.deletePap(id);
      setPaps((prev) => prev.filter((p) => p.id !== id));
      toast.success('PAP berhasil dihapus.');
    } catch (err) {
      toast.error('Gagal menghapus PAP.');
    }
  };

  const handleRequestPap = async () => {
    try {
      const msg = `🥺 Sayang, ${user?.nickname || 'aku'} lagi kangen banget nih dan minta PAP! Kirim foto kamu, lokasi & baterai HP sekarang yuk ❤️📸`;
      await messageApi.sendMessage({
        content: msg,
        message_type: 'text'
      });
      toast.success(`Permintaan PAP telah dikirimkan ke ${partner?.nickname || 'Pasangan'}! ❤️`);
    } catch (err) {
      toast.error('Gagal mengirim permintaan PAP.');
    }
  };

  const handleSendToChat = async (pap) => {
    try {
      const firstPhoto = pap.photos?.[0];
      await messageApi.sendMessage({
        content: `💬 Bahas PAP ini: "${pap.story || 'Foto PAP manis'}" di ${pap.location_name || 'lokasi'} (🔋 ${pap.battery_level || 80}%)`,
        media_url: firstPhoto,
        message_type: firstPhoto ? 'image' : 'text'
      });
      toast.success('PAP dikirim ke obrolan!');
      navigate('/chat');
    } catch (err) {
      toast.error('Gagal meneruskan ke chat.');
    }
  };

  // Filter PAPs
  const filteredPaps = paps.filter((p) => {
    if (filterSender === 'all') return true;
    if (filterSender === 'favorites') return p.is_favorite;
    if (filterSender === 'me') return p.created_by === user?.id;
    if (filterSender === 'partner') return p.created_by !== user?.id;
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-charcoal-800">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-gradient-to-tr from-romantic-600 via-rose-500 to-plum-600 text-white shadow-lg shadow-romantic-600/30">
            <Camera className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
              PAP Kita Berdua 📸
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-romantic-500/20 text-romantic-300 border border-romantic-500/30 font-normal">
                {paps.length} Foto
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Saling berbagi foto kegiatan, lokasi realtime, &amp; level baterai HP Asit &amp; Nisya
            </p>
          </div>
        </div>

        {/* Action Buttons: Kirim PAP & Minta PAP */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleRequestPap}
            className="px-3.5 py-2.5 rounded-2xl bg-charcoal-850 hover:bg-charcoal-800 text-slate-300 hover:text-romantic-300 border border-charcoal-700/80 text-xs font-medium transition-all flex items-center gap-1.5 active:scale-95 shadow-sm"
            title="Minta PAP ke Pasangan"
          >
            <BellRing className="w-4 h-4 text-romantic-400" />
            <span className="hidden sm:inline">Minta PAP</span>
            <span className="sm:hidden">Minta</span>
          </button>

          <button
            onClick={() => setIsSendModalOpen(true)}
            className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-romantic-600 via-rose-600 to-plum-600 hover:from-romantic-500 hover:to-plum-500 text-white font-semibold text-xs shadow-lg shadow-romantic-600/30 transition-all flex items-center justify-center gap-1.5 active:scale-95 shrink-0"
          >
            <Camera className="w-4 h-4" />
            <span>Kirim PAP Sekarang ❤️</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setFilterSender('all')}
          className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-all border ${
            filterSender === 'all'
              ? 'bg-romantic-600 text-white border-romantic-500 shadow-md shadow-romantic-600/20'
              : 'bg-charcoal-850 text-slate-300 border-charcoal-700/80 hover:bg-charcoal-800'
          }`}
        >
          Semua PAP ({paps.length})
        </button>

        <button
          onClick={() => setFilterSender('partner')}
          className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-all border ${
            filterSender === 'partner'
              ? 'bg-plum-600 text-white border-plum-500 shadow-md shadow-plum-600/20'
              : 'bg-charcoal-850 text-slate-300 border-charcoal-700/80 hover:bg-charcoal-800'
          }`}
        >
          Dari {partner?.nickname || 'Pasangan'} 👧
        </button>

        <button
          onClick={() => setFilterSender('me')}
          className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-all border ${
            filterSender === 'me'
              ? 'bg-romantic-600 text-white border-romantic-500 shadow-md shadow-romantic-600/20'
              : 'bg-charcoal-850 text-slate-300 border-charcoal-700/80 hover:bg-charcoal-800'
          }`}
        >
          Dari Kamu 👦
        </button>

        <button
          onClick={() => setFilterSender('favorites')}
          className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-all border ${
            filterSender === 'favorites'
              ? 'bg-rose-600 text-white border-rose-500 shadow-md shadow-rose-600/20'
              : 'bg-charcoal-850 text-slate-300 border-charcoal-700/80 hover:bg-charcoal-800'
          }`}
        >
          Favorit ❤️
        </button>
      </div>

      {/* Feed / Grid of PAPs */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-2">
          <Loader2 className="w-7 h-7 animate-spin text-romantic-400" />
          <span className="text-xs">Memuat kumpulan foto PAP mesra kalian...</span>
        </div>
      ) : filteredPaps.length === 0 ? (
        <div className="p-12 rounded-3xl glass-card border border-charcoal-700/60 bg-charcoal-900/40 text-center flex flex-col items-center justify-center my-8">
          <div className="w-16 h-16 rounded-3xl bg-romantic-500/10 border border-romantic-500/20 flex items-center justify-center text-romantic-400 mb-4 animate-pulse-subtle">
            <Camera className="w-8 h-8" />
          </div>
          <h3 className="text-base font-semibold text-slate-100 mb-1">
            Belum Ada PAP di Sini
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mb-5 leading-relaxed">
            Abadikan momen harianmu, bagikan lokasimu saat ini beserta sisa baterai HP ke {partner?.nickname || 'pasanganmu'} ❤️
          </p>
          <button
            onClick={() => setIsSendModalOpen(true)}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-romantic-600 to-rose-600 text-white shadow-md shadow-romantic-600/30 flex items-center gap-1.5 active:scale-95"
          >
            <Camera className="w-4 h-4" />
            Kirim PAP Pertama Sekarang
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPaps.map((pap) => (
            <PapCard
              key={pap.id}
              pap={pap}
              onToggleFavorite={handleToggleFavorite}
              onDelete={handleDeletePap}
              onImageClick={(url) => setLightboxImage(url)}
              onSendToChat={handleSendToChat}
            />
          ))}
        </div>
      )}

      {/* Send PAP Modal */}
      <SendPapModal
        isOpen={isSendModalOpen}
        onClose={() => setIsSendModalOpen(false)}
        onPapSent={handlePapSent}
      />

      {/* Lightbox Preview */}
      {lightboxImage && (
        <div 
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/95 backdrop-blur-md animate-fade-in"
        >
          <div className="relative max-w-3xl max-h-[90vh]">
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute -top-10 right-0 p-1.5 rounded-full text-slate-300 hover:text-white bg-charcoal-800"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={lightboxImage}
              alt="Preview PAP"
              className="rounded-2xl max-h-[85vh] max-w-full object-contain shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
};
