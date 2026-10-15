import React, { useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore.js';
import { authApi, spaceApi, uploadApi } from '../../api/endpoints.js';
import { Camera, Check, Loader2, Sparkles, User, Heart, Calendar } from 'lucide-react';
import { toast } from 'sonner';

export const ProfileSettings = () => {
  const { user, space, updateUser, setSpace } = useAuthStore();

  const [fullName, setFullName] = useState(user?.full_name || '');
  const [nickname, setNickname] = useState(user?.nickname || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');
  const [spaceName, setSpaceName] = useState(space?.name || 'Ruang Kita');
  const [anniversaryDate, setAnniversaryDate] = useState(space?.anniversary_date || '2023-08-14');

  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingAvatar(true);
      const res = await uploadApi.uploadPhoto(file);
      if (res.success && res.url) {
        setAvatarUrl(res.url);
        toast.success('Foto profil berhasil diunggah!');
      }
    } catch (err) {
      toast.error('Gagal mengunggah foto profil.');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsSaving(true);

      // Update user profile
      const userRes = await authApi.updateProfile({
        full_name: fullName.trim(),
        nickname: nickname.trim(),
        bio: bio.trim(),
        avatar_url: avatarUrl,
      });

      if (userRes.success) {
        updateUser(userRes.user);
      }

      // Update space settings if exists
      if (space) {
        const spaceRes = await spaceApi.updateSettings({
          name: spaceName.trim(),
          anniversary_date: anniversaryDate,
        });

        if (spaceRes.success) {
          setSpace(spaceRes.space);
        }
      }

      toast.success('Profil & Pengaturan Ruang berhasil disimpan ❤️');
    } catch (err) {
      toast.error(err.message || 'Gagal menyimpan perubahan.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 rounded-3xl glass-card border border-charcoal-700/60 bg-charcoal-900/60 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2.5 pb-4 border-b border-charcoal-800">
        <div className="p-2.5 rounded-2xl bg-plum-500/15 text-plum-400 border border-plum-500/30">
          <User className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-semibold text-slate-100 text-base">
            Ubah Profil & Ruang Kita
          </h3>
          <p className="text-xs text-slate-400">
            Sesuaikan nama panggilan, foto profil, dan tanggal jadian
          </p>
        </div>
      </div>

      {/* Avatar Change */}
      <div className="flex items-center gap-4">
        <div className="relative group">
          <img
            src={avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120'}
            alt="Avatar"
            className="w-20 h-20 rounded-full object-cover ring-2 ring-romantic-500/50 shadow-md"
          />
          <label className="absolute inset-0 bg-charcoal-950/60 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white text-[10px]">
            {isUploadingAvatar ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Camera className="w-5 h-5 mb-0.5" />
                <span>Ganti</span>
              </>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              disabled={isUploadingAvatar}
              className="hidden"
            />
          </label>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-slate-200">Foto Profil Kamu</h4>
          <p className="text-xs text-slate-400 mb-2">
            Klik foto untuk mengunggah foto terbaikmu
          </p>
          <label className="text-xs font-medium text-romantic-400 hover:text-romantic-300 cursor-pointer inline-flex items-center gap-1">
            <Camera className="w-3.5 h-3.5" />
            Unggah Foto Baru
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Inputs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">
            Nama Lengkap
          </label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-800 border border-charcoal-700 text-slate-100 text-sm focus:outline-none focus:border-romantic-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">
            Nama Panggilan Sayang (Nickname)
          </label>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            required
            className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-800 border border-charcoal-700 text-slate-100 text-sm focus:outline-none focus:border-romantic-500"
          />
        </div>
      </div>

      {/* Bio / Love Quote */}
      <div>
        <label className="block text-xs font-medium text-slate-300 mb-1">
          Catatan Hati / Bio Singkat
        </label>
        <input
          type="text"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Mencintai kamu setiap hari ❤️"
          className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-800 border border-charcoal-700 text-slate-100 text-sm focus:outline-none focus:border-romantic-500"
        />
      </div>

      {/* Couple Space Settings */}
      <div className="pt-3 border-t border-charcoal-800 space-y-4">
        <h4 className="text-xs font-semibold text-romantic-400 uppercase tracking-wider flex items-center gap-1.5">
          <Heart className="w-3.5 h-3.5 fill-romantic-500 text-romantic-500" />
          Pengaturan Ruang Bersama
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Nama Ruang
            </label>
            <input
              type="text"
              value={spaceName}
              onChange={(e) => setSpaceName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-800 border border-charcoal-700 text-slate-100 text-sm focus:outline-none focus:border-romantic-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Tanggal Jadian (Anniversary)
            </label>
            <input
              type="date"
              value={anniversaryDate}
              onChange={(e) => setAnniversaryDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-800 border border-charcoal-700 text-slate-100 text-sm focus:outline-none focus:border-romantic-500"
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <button
        type="submit"
        disabled={isSaving}
        className="w-full py-3 rounded-2xl bg-gradient-to-r from-romantic-600 to-plum-600 hover:from-romantic-500 hover:to-plum-500 text-white font-medium text-sm shadow-lg shadow-romantic-600/30 transition-all flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
      >
        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
        Simpan Semua Perubahan ❤️
      </button>
    </form>
  );
};
