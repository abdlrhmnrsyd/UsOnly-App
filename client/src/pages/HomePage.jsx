import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore.js';
import { useSocketStore } from '../store/useSocketStore.js';
import { messageApi, memoryApi, locationApi, milestoneApi } from '../api/endpoints.js';
import { LoveCounterCard } from '../components/couple/LoveCounterCard.jsx';
import { LoveBatteryWidget } from '../components/couple/LoveBatteryWidget.jsx';
import { LoveNotesBoard } from '../components/couple/LoveNotesBoard.jsx';
import { MilestoneList } from '../components/couple/MilestoneList.jsx';
import { DistanceBadge } from '../components/location/DistanceBadge.jsx';
import { StatusNoteModal } from '../components/location/StatusNoteModal.jsx';
import { 
  Heart, 
  MessageCircleHeart, 
  MapPin, 
  Sparkles, 
  Battery, 
  Send, 
  ArrowRight, 
  Image, 
  ShieldCheck,
  Mail,
  RefreshCw,
  Camera
} from 'lucide-react';
import { formatTime } from '../utils/dateUtils.js';
import { toast } from 'sonner';

const DAILY_QUESTIONS = [
  'Apa hal kecil yang pasanganmu lakuin minggu ini yang bikin kamu senyum-senyum sendiri?',
  'Kalau kita bisa liburan berdua besok pagi tanpa mikirin biaya, ke mana destinasi impianmu?',
  'Lagu apa yang paling mengingatkanmu saat pertama kali kita saling tatap mata?',
  'Apa satu makanan favorit yang selalu bikin kamu kangen makan bareng pasangan?',
  'Apa momen paling lucu atau konyol yang pernah kita lewatin berdua?',
  'Apa doa atau harapan terbesarmu untuk hubungan kita di tahun ini?',
  'Kalau cinta kita diumpamakan sebuah warna, warna apa yang paling mewakilinya?',
  'Apa sifat terbaik dari pasangan yang selalu bikin kamu kagum setiap hari?'
];

export const HomePage = ({ onOpenLovePoke }) => {
  const navigate = useNavigate();
  const { user, partner, space } = useAuthStore();
  const { partnerOnline } = useSocketStore();

  const [latestMessage, setLatestMessage] = useState(null);
  const [recentMemories, setRecentMemories] = useState([]);
  const [myLocation, setMyLocation] = useState(null);
  const [partnerLocation, setPartnerLocation] = useState(null);
  const [milestones, setMilestones] = useState([]);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [activeQuestionIdx, setActiveQuestionIdx] = useState(0);

  // Pick question based on day of month
  useEffect(() => {
    const day = new Date().getDate();
    setActiveQuestionIdx(day % DAILY_QUESTIONS.length);
  }, []);

  // Time-aware greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 11) return 'Selamat Pagi';
    if (hour < 15) return 'Selamat Siang';
    if (hour < 18) return 'Selamat Sore';
    return 'Selamat Malam';
  };

  const loadDashboardData = async () => {
    try {
      // 1. Messages
      const msgRes = await messageApi.getMessages().catch(() => null);
      if (msgRes?.success && msgRes.messages?.length > 0) {
        setLatestMessage(msgRes.messages[msgRes.messages.length - 1]);
      }

      // 2. Memories
      const memRes = await memoryApi.getMemories().catch(() => null);
      if (memRes?.success && memRes.memories) {
        setRecentMemories(memRes.memories.slice(0, 6));
      }

      // 3. Location
      const locRes = await locationApi.getState().catch(() => null);
      if (locRes?.success) {
        setMyLocation(locRes.my_location);
        setPartnerLocation(locRes.partner_location);
      }

      // 4. Milestones
      const mileRes = await milestoneApi.getMilestones().catch(() => null);
      if (mileRes?.success) {
        setMilestones(mileRes.milestones || []);
      }
    } catch (err) {
      console.warn('[Dashboard Load Error]', err);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleSendQuestionToChat = async () => {
    try {
      const questionText = DAILY_QUESTIONS[activeQuestionIdx];
      await messageApi.sendMessage({
        content: `💌 Surat Cinta Hari Ini:\n"${questionText}"\n\nJawab yuk sayang ❤️`,
        message_type: 'text'
      });
      toast.success('Surat cinta manis berhasil dikirim ke obrolan!');
      navigate('/chat');
    } catch (err) {
      toast.error('Gagal mengirim ke obrolan.');
    }
  };

  const handleRandomQuestion = () => {
    setActiveQuestionIdx((prev) => (prev + 1) % DAILY_QUESTIONS.length);
  };

  const handleUpdateStatusNote = async (newNote) => {
    try {
      await locationApi.updateLocation({ status_note: newNote });
      setMyLocation((prev) => (prev ? { ...prev, status_note: newNote } : null));
      toast.success('Kabar status berhasil diperbarui!');
    } catch (err) {
      toast.error('Gagal memperbarui kabar status.');
    }
  };

  const handleAddMilestone = async (data) => {
    try {
      const res = await milestoneApi.createMilestone(data);
      if (res.success) {
        setMilestones((prev) => [...prev, res.milestone]);
        toast.success('Tanggal spesial berhasil disimpan ❤️');
      }
    } catch (err) {
      toast.error('Gagal menambah tanggal spesial.');
    }
  };

  const handleDeleteMilestone = async (id) => {
    try {
      await milestoneApi.deleteMilestone(id);
      setMilestones((prev) => prev.filter((m) => m.id !== id));
      toast.success('Tanggal spesial dihapus.');
    } catch (err) {
      toast.error('Gagal menghapus tanggal.');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto pb-12">
      {/* 1. Welcome Greeting Hero with Interlocking Monogram */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-7 glass-card-glow border border-romantic-500/30 bg-gradient-to-r from-charcoal-900/95 via-plum-950/60 to-charcoal-900/95 shadow-2xl">
        {/* Ambient Top Glow */}
        <div className="absolute top-0 right-1/4 w-72 h-40 bg-romantic-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            {/* Interlocking Monogram Crest Badge */}
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-romantic-600 via-rose-500 to-amber-500 p-0.5 shadow-xl shadow-romantic-600/20 shrink-0">
              <div className="w-full h-full rounded-[14px] bg-charcoal-950 flex flex-col items-center justify-center text-center">
                <span className="text-xs font-serif font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-rose-200 to-amber-300">
                  A &amp; N
                </span>
                <Heart className="w-3 h-3 text-romantic-400 fill-romantic-400 mt-0.5 animate-pulse" />
              </div>
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-romantic-400 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  Ruang Eksklusif Berdua
                </span>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-950/70 text-emerald-300 border border-emerald-800/40 font-medium flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  Terkunci Privat
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {getGreeting()}, {user?.nickname || 'Asit'} Sayang ❤️
              </h1>

              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-lg leading-relaxed">
                Hari ini adalah lembaran baru untuk saling mengasihi {partner?.nickname || 'Nisya'}. Apa kabarnya dia saat ini?
              </p>
            </div>
          </div>

          {/* Partner Status Pill */}
          <div className="flex items-center gap-3.5 p-3 sm:p-3.5 rounded-2xl bg-charcoal-850/90 border border-charcoal-700/80 shadow-md shrink-0">
            <div className="relative">
              <img
                src={partner?.avatar_url || 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop'}
                alt={partner?.nickname}
                className="w-13 h-13 rounded-full object-cover ring-2 ring-romantic-500/60 shadow-md"
              />
              <span
                className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-charcoal-900 ${
                  partnerOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'
                }`}
              />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-slate-100">
                  {partner?.nickname || 'Nisya'}
                </h4>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                    partnerOnline
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-charcoal-750 text-slate-400'
                  }`}
                >
                  {partnerOnline ? 'Online' : 'Offline'}
                </span>
              </div>

              <p className="text-xs text-romantic-300 mt-0.5 truncate max-w-[160px] font-medium">
                {partnerLocation?.status_note || 'Lagi mikirin kamu ❤️'}
              </p>

              {partnerLocation?.battery_level != null && (
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-1">
                  <Battery className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Baterai HP: {partnerLocation.battery_level}%</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Interactive Love Battery & Instant Love Pulse */}
      <LoveBatteryWidget
        partnerName={partner?.nickname || 'Nisya'}
        onOpenLovePoke={onOpenLovePoke}
      />

      {/* 3. Love Counter Card */}
      <LoveCounterCard
        anniversaryDate={space?.anniversary_date || '2023-08-14'}
        spaceName={space?.name || 'Ruang Cinta Asit & Nisya'}
      />

      {/* 4. Quick Action Navigation Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={onOpenLovePoke}
          className="p-4 rounded-2xl glass-card border border-romantic-500/30 bg-romantic-500/10 hover:bg-romantic-500/20 transition-all text-left group active:scale-98 shadow-sm"
        >
          <div className="w-10 h-10 rounded-xl bg-romantic-500 text-white flex items-center justify-center mb-2 shadow-md shadow-romantic-500/30 group-hover:scale-110 transition-transform">
            <Heart className="w-5 h-5 fill-white" />
          </div>
          <h4 className="text-xs font-bold text-slate-100">Colekan Sayang</h4>
          <p className="text-[10px] text-slate-400 mt-0.5">Kirim peluk, kecup &amp; rindu</p>
        </button>

        <button
          onClick={() => navigate('/chat')}
          className="p-4 rounded-2xl glass-card border border-charcoal-700/60 bg-charcoal-900/60 hover:bg-charcoal-850 hover:border-plum-500/40 transition-all text-left group active:scale-98 shadow-sm"
        >
          <div className="w-10 h-10 rounded-xl bg-plum-600 text-white flex items-center justify-center mb-2 shadow-md shadow-plum-600/30 group-hover:scale-110 transition-transform">
            <MessageCircleHeart className="w-5 h-5" />
          </div>
          <h4 className="text-xs font-bold text-slate-100">Ruang Obrolan</h4>
          <p className="text-[10px] text-slate-400 mt-0.5">Pesan &amp; foto mesra kita</p>
        </button>

        <button
          onClick={() => navigate('/pap')}
          className="p-4 rounded-2xl glass-card border border-charcoal-700/60 bg-charcoal-900/60 hover:bg-charcoal-850 hover:border-rose-500/40 transition-all text-left group active:scale-98 shadow-sm"
        >
          <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center mb-2 shadow-md shadow-rose-600/30 group-hover:scale-110 transition-transform">
            <Camera className="w-5 h-5" />
          </div>
          <h4 className="text-xs font-bold text-slate-100">PAP Kita 📸</h4>
          <p className="text-[10px] text-slate-400 mt-0.5">Foto, lokasi &amp; baterai HP</p>
        </button>

        <button
          onClick={() => navigate('/location')}
          className="p-4 rounded-2xl glass-card border border-charcoal-700/60 bg-charcoal-900/60 hover:bg-charcoal-850 hover:border-indigo-500/40 transition-all text-left group active:scale-98 shadow-sm"
        >
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center mb-2 shadow-md shadow-indigo-600/30 group-hover:scale-110 transition-transform">
            <MapPin className="w-5 h-5" />
          </div>
          <h4 className="text-xs font-bold text-slate-100">Peta &amp; Kabar</h4>
          <p className="text-[10px] text-slate-400 mt-0.5">Saling rela berbagi lokasi</p>
        </button>
      </div>

      {/* 5. Wax-Sealed Romantic Love Letter Envelope */}
      <div className="relative overflow-hidden rounded-3xl p-5 sm:p-6 glass-card border border-romantic-500/30 bg-gradient-to-r from-plum-950/70 via-charcoal-900 to-rose-950/40 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-3 rounded-2xl bg-gradient-to-tr from-romantic-600 to-rose-600 text-white shadow-md shadow-romantic-600/30 shrink-0">
              <Mail className="w-5 h-5" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-romantic-400 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Surat Cinta Harian • Pertanyaan Intim
                </span>
                <button
                  onClick={handleRandomQuestion}
                  className="p-1 rounded-full text-slate-400 hover:text-romantic-300 transition-colors"
                  title="Ganti Pertanyaan Acak"
                >
                  <RefreshCw className="w-3 h-3" />
                </button>
              </div>

              <p className="text-sm sm:text-base font-medium text-slate-100 mt-1.5 italic leading-relaxed">
                "{DAILY_QUESTIONS[activeQuestionIdx]}"
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <button
              onClick={handleSendQuestionToChat}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-romantic-600 to-rose-600 hover:from-romantic-500 hover:to-rose-500 text-white shadow-md shadow-romantic-600/30 transition-all flex items-center gap-1.5 active:scale-95"
            >
              <Send className="w-3.5 h-3.5" />
              Kirim ke Obrolan
            </button>
          </div>
        </div>
      </div>

      {/* 6. Papan Catatan Cinta Kita (Sticky Love Notes) */}
      <LoveNotesBoard />

      {/* 7. Chat Shortcut & Recent Photos Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Latest Chat Preview */}
        <div className="p-5 rounded-3xl glass-card border border-charcoal-700/60 bg-charcoal-900/60 flex flex-col justify-between shadow-lg">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-charcoal-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-romantic-500/15 text-romantic-400">
                  <MessageCircleHeart className="w-4 h-4" />
                </div>
                <h3 className="font-semibold text-slate-100 text-sm">Pesan Terakhir di Ruang Chat</h3>
              </div>
              <button
                onClick={() => navigate('/chat')}
                className="text-xs text-romantic-400 hover:text-romantic-300 font-medium flex items-center gap-1"
              >
                Buka Chat
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {latestMessage ? (
              <div className="p-4 rounded-2xl bg-charcoal-850/80 border border-charcoal-700/70 my-2">
                <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
                  <span className="font-semibold text-romantic-300">
                    {latestMessage.sender_id === user?.id ? 'Kamu' : partner?.nickname || 'Pasangan'}
                  </span>
                  <span>{formatTime(latestMessage.created_at)}</span>
                </div>
                <p className="text-xs text-slate-200 line-clamp-2 leading-relaxed">
                  {latestMessage.content || (latestMessage.media_url ? '📷 Mengirimkan sebuah foto kenangan' : 'Colekan Manis')}
                </p>
              </div>
            ) : (
              <p className="text-xs text-slate-500 py-6 text-center">
                Belum ada pesan obrolan hari ini. Sapa pasanganmu sekarang ❤️
              </p>
            )}
          </div>

          <button
            onClick={() => navigate('/chat')}
            className="w-full mt-3 py-2.5 rounded-xl bg-charcoal-800 hover:bg-charcoal-750 text-slate-200 text-xs font-medium border border-charcoal-700 transition-colors flex items-center justify-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5 text-romantic-400" />
            Tulis Pesan untuk {partner?.nickname || 'Nisya'}
          </button>
        </div>

        {/* Recently Shared Photos (PAP) Strip */}
        <div className="p-5 rounded-3xl glass-card border border-charcoal-700/60 bg-charcoal-900/60 flex flex-col justify-between shadow-lg">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-charcoal-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-rose-500/15 text-rose-400">
                  <Image className="w-4 h-4" />
                </div>
                <h3 className="font-semibold text-slate-100 text-sm">Galeri PAP &amp; Lokasi Terbaru</h3>
              </div>
              <button
                onClick={() => navigate('/pap')}
                className="text-xs text-romantic-400 hover:text-romantic-300 font-medium flex items-center gap-1"
              >
                Lihat Semua
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {recentMemories.length > 0 ? (
              <div className="grid grid-cols-3 gap-2.5 my-2">
                {recentMemories.slice(0, 3).map((mem) => {
                  const firstPhoto = mem.photos?.[0];
                  return (
                    <div
                      key={mem.id}
                      onClick={() => navigate('/pap')}
                      className="group relative aspect-square rounded-2xl overflow-hidden bg-charcoal-950 border border-charcoal-700/80 cursor-pointer shadow-sm"
                    >
                      {firstPhoto ? (
                        <img
                          src={firstPhoto}
                          alt={mem.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-slate-500">
                          {mem.title}
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-charcoal-950/90 via-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                        <span className="text-[10px] text-slate-100 font-medium truncate">{mem.title}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-slate-500 py-6 text-center">
                Belum ada foto PAP yang dibagikan. Kirim PAP manismu sekarang ❤️
              </p>
            )}
          </div>

          <button
            onClick={() => navigate('/pap')}
            className="w-full mt-3 py-2.5 rounded-xl bg-charcoal-800 hover:bg-charcoal-750 text-slate-200 text-xs font-medium border border-charcoal-700 transition-colors flex items-center justify-center gap-1.5"
          >
            <Camera className="w-3.5 h-3.5 text-rose-400" />
            Buka Galeri PAP &amp; Lokasi
          </button>
        </div>
      </div>

      {/* 8. Mutual Distance & Kabar Status */}
      <DistanceBadge
        myLocation={myLocation}
        partnerLocation={partnerLocation}
        myUser={user}
        partnerUser={partner}
        onOpenStatusModal={() => setIsStatusModalOpen(true)}
      />

      {/* 9. Special Dates & Milestones */}
      <MilestoneList
        milestones={milestones}
        onAddMilestone={handleAddMilestone}
        onDeleteMilestone={handleDeleteMilestone}
      />

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
