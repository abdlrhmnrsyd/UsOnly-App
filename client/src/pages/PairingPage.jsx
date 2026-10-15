import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore.js';
import { useSocketStore } from '../store/useSocketStore.js';
import { spaceApi } from '../api/endpoints.js';
import { 
  Heart, 
  Copy, 
  Check, 
  LogOut, 
  Loader2,
  HeartHandshake
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';

export const PairingPage = () => {
  const { user, setSpace, logout, checkAuth } = useAuthStore();
  const { socket } = useSocketStore();

  const [activeTab, setActiveTab] = useState('create'); // 'create' | 'join'
  const [inviteCode, setInviteCode] = useState(() => localStorage.getItem('our_space_invite_code') || null);
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const [joinCode, setJoinCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  // Restore any existing active invite code from backend on mount
  useEffect(() => {
    spaceApi.getInvite().then((res) => {
      if (res?.success && res?.invitation?.code) {
        setInviteCode(res.invitation.code);
        localStorage.setItem('our_space_invite_code', res.invitation.code);
      }
    }).catch(() => {});
  }, []);

  // Poll checkAuth silently every 4 seconds when waiting for partner with an active code
  useEffect(() => {
    if (!inviteCode) return;

    const interval = setInterval(async () => {
      const isOk = await checkAuth(true);
      if (isOk) {
        const currentSpace = useAuthStore.getState().space;
        const currentPartner = useAuthStore.getState().partner;
        if (currentSpace?.partner2_id || currentPartner) {
          localStorage.removeItem('our_space_invite_code');
          confetti({ particleCount: 90, spread: 60, origin: { y: 0.6 } });
          toast.success('Pasanganmu telah terhubung! ❤️');
        }
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [inviteCode]);

  // Listen to socket partner_joined event
  useEffect(() => {
    if (!socket) return;

    const handlePartnerJoined = (data) => {
      localStorage.removeItem('our_space_invite_code');
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      toast.success(data?.message || 'Pasanganmu telah terhubung! ❤️');
      checkAuth(true);
    };

    socket.on('partner_joined', handlePartnerJoined);
    return () => {
      socket.off('partner_joined', handlePartnerJoined);
    };
  }, [socket]);

  const handleGenerateCode = async () => {
    try {
      setIsGenerating(true);
      const res = await spaceApi.createInvite();
      if (res.success && res.invitation?.code) {
        const code = res.invitation.code;
        setInviteCode(code);
        localStorage.setItem('our_space_invite_code', code);
        await checkAuth(true);
        toast.success('Kode pairing berhasil dibuat!');
      }
    } catch (err) {
      toast.error(err.message || 'Gagal membuat kode pairing.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!inviteCode) return;
    navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    toast.success('Kode disalin!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleJoin = async (e) => {
    e?.preventDefault();
    if (!joinCode.trim()) {
      toast.error('Masukkan kode pairing.');
      return;
    }

    try {
      setIsJoining(true);
      const res = await spaceApi.joinSpace({ code: joinCode.trim().toUpperCase() });
      if (res.success) {
        localStorage.removeItem('our_space_invite_code');
        setSpace(res.space, res.partner);
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        toast.success(res.message || 'Berhasil terhubung dengan pasangan! ❤️');
        await checkAuth(true);
      }
    } catch (err) {
      toast.error(err.message || 'Kode tidak valid atau sudah kadaluwarsa.');
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-charcoal-950 relative overflow-hidden select-none">
      {/* Soft ambient rose glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-romantic-500/15 rounded-full blur-[110px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-romantic-600 to-rose-500 text-white shadow-lg shadow-romantic-600/20 mb-3 animate-heartbeat">
            <HeartHandshake className="w-7 h-7" />
          </div>

          <h1 className="text-2xl font-bold text-white tracking-tight">
            Hubungkan Pasangan
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Hai <span className="text-romantic-300 font-medium">{user?.nickname || 'Kamu'}</span>, hubungkan akunmu untuk membuka ruang cinta berdua.
          </p>
        </div>

        {/* Card */}
        <div className="rounded-3xl border border-charcoal-700/60 bg-charcoal-900/80 backdrop-blur-xl p-6 sm:p-7 shadow-2xl">
          {/* Segmented Control */}
          <div className="grid grid-cols-2 p-1 rounded-xl bg-charcoal-800/80 border border-charcoal-700/60 mb-6">
            <button
              type="button"
              onClick={() => setActiveTab('create')}
              className={`py-2 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'create'
                  ? 'bg-romantic-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Buat Kode
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('join')}
              className={`py-2 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'join'
                  ? 'bg-romantic-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Masukkan Kode
            </button>
          </div>

          {/* TAB 1: BUAT KODE */}
          {activeTab === 'create' && (
            <div className="space-y-4 text-center animate-fade-in">
              {!inviteCode ? (
                <div className="py-2 space-y-4">
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Buat kode unik dan berikan kepada pasanganmu agar dapat terhubung ke ruang ini.
                  </p>

                  <button
                    onClick={handleGenerateCode}
                    disabled={isGenerating}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-romantic-600 to-rose-600 hover:from-romantic-500 hover:to-rose-500 text-white font-medium text-sm shadow-lg shadow-romantic-600/25 transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Membuat kode...</span>
                      </>
                    ) : (
                      <span>Buat Kode Pairing</span>
                    )}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-5 rounded-2xl bg-charcoal-800/60 border border-charcoal-700/80">
                    <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-medium mb-1.5">
                      Kode Pasanganmu
                    </span>
                    <div className="text-2xl font-mono font-bold text-white tracking-[0.2em]">
                      {inviteCode}
                    </div>
                  </div>

                  <button
                    onClick={handleCopy}
                    className="w-full py-2.5 rounded-xl bg-charcoal-800 hover:bg-charcoal-750 text-slate-200 text-xs font-medium border border-charcoal-700 transition-all flex items-center justify-center gap-1.5 active:scale-[0.98]"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Kode disalin</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-romantic-400" />
                        <span>Salin Kode</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center justify-center gap-2 text-xs text-slate-400 pt-1">
                    <span className="w-2 h-2 rounded-full bg-romantic-400 animate-pulse" />
                    <span>Menunggu pasangan bergabung...</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: MASUKKAN KODE */}
          {activeTab === 'join' && (
            <form onSubmit={handleJoin} className="space-y-4 animate-fade-in">
              <p className="text-xs text-slate-400 text-center leading-relaxed">
                Masukkan kode yang diberikan oleh pasanganmu.
              </p>

              <div>
                <input
                  type="text"
                  required
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="KITA-XXXX"
                  className="w-full px-4 py-3 rounded-xl bg-charcoal-800/80 border border-charcoal-700 text-slate-100 text-base font-mono uppercase tracking-[0.15em] text-center focus:outline-none focus:border-romantic-500 focus:ring-1 focus:ring-romantic-500 transition-all placeholder:tracking-normal placeholder:font-sans placeholder:text-slate-500"
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={!joinCode.trim() || isJoining}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-romantic-600 to-rose-600 hover:from-romantic-500 hover:to-rose-500 text-white font-medium text-sm shadow-lg shadow-romantic-600/25 transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50"
              >
                {isJoining ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Heart className="w-4 h-4 fill-white" />
                    <span>Hubungkan</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Switch Account */}
          <div className="mt-6 pt-4 border-t border-charcoal-800/70 text-center">
            <button
              onClick={logout}
              className="text-xs text-slate-400 hover:text-slate-200 inline-flex items-center gap-1.5 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Ganti Akun</span>
            </button>
          </div>
        </div>

        {/* Minimal Footer */}
        <p className="text-center text-[11px] text-slate-400 mt-6 tracking-wide">
          Eksklusif berdua • Enkripsi privat
        </p>
      </div>
    </div>
  );
};
