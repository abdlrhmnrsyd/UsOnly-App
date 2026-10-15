import React, { useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore.js';
import { spaceApi } from '../../api/endpoints.js';
import { 
  HeartHandshake, 
  KeyRound, 
  Copy, 
  Check, 
  ShieldCheck, 
  Users, 
  Loader2, 
  Sparkles,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';

export const SpacePairingSection = () => {
  const { user, partner, space, setSpace } = useAuthStore();
  const [inviteCode, setInviteCode] = useState(null);
  const [expiresAt, setExpiresAt] = useState(null);
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  const isPaired = space && space.partner1_id && space.partner2_id;

  const handleGenerateCode = async () => {
    try {
      setIsGenerating(true);
      const res = await spaceApi.createInvite();
      if (res.success && res.invitation) {
        setInviteCode(res.invitation.code);
        setExpiresAt(res.invitation.expires_at);
        toast.success('Kode undangan berdua berhasil dibuat!');
      }
    } catch (err) {
      toast.error(err.message || 'Gagal membuat kode undangan.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!inviteCode) return;
    navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    toast.success('Kode undangan disalin ke clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!joinCode.trim()) return;

    try {
      setIsJoining(true);
      const res = await spaceApi.joinSpace({ code: joinCode.trim() });
      if (res.success) {
        setSpace(res.space, res.partner);
        toast.success(res.message || 'Berhasil terhubung ke Ruang Kita!');
        setJoinCode('');
      }
    } catch (err) {
      toast.error(err.message || 'Gagal menghubungkan ruang.');
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="p-6 rounded-3xl glass-card border border-charcoal-700/60 bg-charcoal-900/60 shadow-xl space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-charcoal-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-2xl bg-romantic-500/15 text-romantic-400 border border-romantic-500/30">
            <HeartHandshake className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-100 text-base">
              Koneksi Ruang Berdua (Pairing)
            </h3>
            <p className="text-xs text-slate-400">
              Eksklusif dan terbatas untuk tepat 2 anggota (Kamu & Pasangan)
            </p>
          </div>
        </div>

        <span className="flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full bg-plum-900/60 text-romantic-300 border border-plum-700/50">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          {isPaired ? 'Terhubung Berdua' : 'Menunggu Pasangan'}
        </span>
      </div>

      {isPaired ? (
        /* Paired Status Box */
        <div className="p-4 rounded-2xl bg-gradient-to-r from-plum-950/70 via-charcoal-850 to-plum-950/70 border border-romantic-500/30 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-romantic-500/20 text-romantic-400 flex items-center justify-center font-bold text-lg">
              ❤️
            </div>
            <div>
              <h4 className="font-semibold text-slate-100 text-sm">
                Ruang Sudah Lengkap Berdua
              </h4>
              <p className="text-xs text-slate-300">
                Terhubung mesra dengan <strong className="text-romantic-300">{partner?.full_name || 'Nisya'} ({partner?.nickname || 'Nisya'})</strong>.
              </p>
            </div>
          </div>
          <span className="text-xs text-emerald-400 font-medium px-3 py-1 bg-emerald-950/60 rounded-full border border-emerald-800/50">
            Akses Terkunci 2 Orang
          </span>
        </div>
      ) : (
        /* Unpaired Options */
        <div className="space-y-6">
          {/* Option A: Generate Invite Code */}
          <div className="p-4 rounded-2xl bg-charcoal-850/60 border border-charcoal-700/60 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-slate-200 text-sm">Undang Pasanganmu</h4>
                <p className="text-xs text-slate-400">
                  Buat kode rahasia sekali pakai yang berlaku 48 jam untuk pasanganmu.
                </p>
              </div>

              {!inviteCode && (
                <button
                  onClick={handleGenerateCode}
                  disabled={isGenerating}
                  className="px-3.5 py-2 rounded-xl text-xs font-medium bg-gradient-to-r from-romantic-600 to-plum-600 hover:from-romantic-500 hover:to-plum-500 text-white shadow-md shadow-romantic-600/20 transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50 shrink-0"
                >
                  {isGenerating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <KeyRound className="w-4 h-4" />
                  )}
                  Buat Kode Undangan
                </button>
              )}
            </div>

            {inviteCode && (
              <div className="p-3.5 rounded-xl bg-charcoal-900 border border-romantic-500/40 flex items-center justify-between gap-3 animate-fade-in">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                    Kode Undangan Sekali Pakai
                  </span>
                  <span className="text-lg font-mono font-bold text-romantic-300 tracking-wider">
                    {inviteCode}
                  </span>
                  <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-0.5">
                    <Clock className="w-3 h-3 text-amber-400" />
                    Berlaku 48 jam ke depan
                  </div>
                </div>

                <button
                  onClick={handleCopy}
                  className="px-3 py-2 rounded-xl text-xs font-medium bg-charcoal-800 hover:bg-charcoal-750 text-slate-200 border border-charcoal-700 transition-colors flex items-center gap-1.5 active:scale-95"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      Tersalin!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-romantic-400" />
                      Salin Kode
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Option B: Enter Partner's Code */}
          <div className="p-4 rounded-2xl bg-charcoal-850/60 border border-charcoal-700/60 space-y-3">
            <div>
              <h4 className="font-semibold text-slate-200 text-sm">Punya Kode dari Pasangan?</h4>
              <p className="text-xs text-slate-400">
                Masukkan kode undangan yang diberikan pasanganmu untuk menghubungkan ruang ini.
              </p>
            </div>

            <form onSubmit={handleJoin} className="flex gap-2">
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="Contoh: KITA-8291"
                className="flex-1 px-4 py-2.5 rounded-xl bg-charcoal-900 border border-charcoal-700 text-slate-100 text-sm font-mono uppercase tracking-wider focus:outline-none focus:border-romantic-500"
              />
              <button
                type="submit"
                disabled={!joinCode.trim() || isJoining}
                className="px-4 py-2.5 rounded-xl text-xs font-medium bg-romantic-600 hover:bg-romantic-500 text-white shadow-md shadow-romantic-600/30 transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-40"
              >
                {isJoining ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                Gabung Ruang
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
