import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { uploadApi } from '../../api/endpoints.js';
import { X, ImagePlus, Loader2, Sparkles, Heart } from 'lucide-react';
import { toast } from 'sonner';

const memorySchema = z.object({
  title: z.string().min(2, 'Judul kenangan minimal 2 karakter'),
  memory_date: z.string().min(1, 'Tanggal kenangan wajib dipilih'),
  category: z.string().default('sweet_moment'),
  location_name: z.string().optional(),
  story: z.string().optional(),
  is_favorite: z.boolean().default(false),
});

export const CreateMemoryModal = ({ isOpen, onClose, onCreated }) => {
  const [photoUrls, setPhotoUrls] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(memorySchema),
    defaultValues: {
      category: 'sweet_moment',
      memory_date: new Date().toISOString().split('T')[0],
      is_favorite: false,
    },
  });

  if (!isOpen) return null;

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    try {
      setIsUploading(true);
      for (const file of files) {
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`File ${file.name} melebihi 10MB`);
          continue;
        }
        const res = await uploadApi.uploadPhoto(file);
        if (res.success && res.url) {
          setPhotoUrls((prev) => [...prev, res.url]);
        }
      }
      toast.success('Foto berhasil ditambahkan!');
    } catch (err) {
      toast.error('Gagal mengunggah beberapa foto.');
    } finally {
      setIsUploading(false);
    }
  };

  const removePhoto = (idx) => {
    setPhotoUrls((prev) => prev.filter((_, i) => i !== idx));
  };

  const onSubmit = async (data) => {
    try {
      const payload = {
        ...data,
        photos: photoUrls,
      };
      await onCreated(payload);
      toast.success('Kenangan indah berhasil disimpan ❤️');
      reset();
      setPhotoUrls([]);
      onClose();
    } catch (err) {
      toast.error(err.message || 'Gagal menyimpan kenangan.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg rounded-3xl glass-card border border-charcoal-700/80 bg-charcoal-900 shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-charcoal-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-romantic-500/20 text-romantic-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-100 text-base">Tambah Kenangan Baru</h3>
              <p className="text-xs text-slate-400">Abadikan momen berharga berdua</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-charcoal-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 my-4">
          {/* Photos Upload & Preview */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-2">
              Foto Kenangan (Bisa lebih dari satu)
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {photoUrls.map((url, idx) => (
                <div key={idx} className="relative w-20 h-20 rounded-xl overflow-hidden border border-charcoal-700">
                  <img src={url} alt="Uploaded" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removePhoto(idx)}
                    className="absolute top-1 right-1 p-0.5 rounded-full bg-charcoal-950/80 text-white hover:bg-rose-600 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}

              <label className="w-20 h-20 rounded-xl border border-dashed border-charcoal-700 hover:border-romantic-500 flex flex-col items-center justify-center cursor-pointer bg-charcoal-850/50 hover:bg-charcoal-800 transition-all text-slate-400 hover:text-romantic-300">
                {isUploading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <ImagePlus className="w-5 h-5 mb-1" />
                    <span className="text-[10px]">Unggah</span>
                  </>
                )}
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Judul Kenangan *
            </label>
            <input
              type="text"
              {...register('title')}
              placeholder="Contoh: Kencan Pertama di Cafe Senja"
              className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-800/80 border border-charcoal-700 text-slate-100 text-sm focus:outline-none focus:border-romantic-500"
            />
            {errors.title && <p className="text-rose-400 text-xs mt-1">{errors.title.message}</p>}
          </div>

          {/* Date & Category Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Tanggal Kejadian *
              </label>
              <input
                type="date"
                {...register('memory_date')}
                className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-800/80 border border-charcoal-700 text-slate-100 text-xs focus:outline-none focus:border-romantic-500"
              />
              {errors.memory_date && (
                <p className="text-rose-400 text-xs mt-1">{errors.memory_date.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Kategori
              </label>
              <select
                {...register('category')}
                className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-800/80 border border-charcoal-700 text-slate-100 text-xs focus:outline-none focus:border-romantic-500"
              >
                <option value="sweet_moment">Momen Manis</option>
                <option value="first_date">Kencan Pertama</option>
                <option value="trip">Liburan Berdua</option>
                <option value="anniversary">Hari Jadian</option>
                <option value="culinary">Kulineran</option>
                <option value="milestone">Pencapaian</option>
              </select>
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Lokasi / Tempat (Opsional)
            </label>
            <input
              type="text"
              {...register('location_name')}
              placeholder="Contoh: Bandung, Jawa Barat"
              className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-800/80 border border-charcoal-700 text-slate-100 text-xs focus:outline-none focus:border-romantic-500"
            />
          </div>

          {/* Story */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Cerita di Balik Momen Ini
            </label>
            <textarea
              rows={3}
              {...register('story')}
              placeholder="Ceritakan rasa bahagia atau kenangan manis waktu itu..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-800/80 border border-charcoal-700 text-slate-100 text-xs focus:outline-none focus:border-romantic-500 resize-none"
            />
          </div>

          {/* Mark as favorite checkbox */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="fav-check"
              {...register('is_favorite')}
              className="rounded accent-romantic-500 w-4 h-4 cursor-pointer"
            />
            <label htmlFor="fav-check" className="text-xs text-slate-300 cursor-pointer select-none flex items-center gap-1">
              <Heart className="w-3.5 h-3.5 text-romantic-500 fill-romantic-500" />
              Tandai sebagai kenangan favorit
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || isUploading}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-romantic-600 to-plum-600 hover:from-romantic-500 hover:to-plum-500 text-white font-medium text-sm shadow-lg shadow-romantic-600/30 transition-all flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Simpan Kenangan Ini ❤️
          </button>
        </form>
      </div>
    </div>
  );
};
