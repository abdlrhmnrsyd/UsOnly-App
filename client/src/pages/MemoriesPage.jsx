import React, { useState, useEffect } from 'react';
import { memoryApi } from '../api/endpoints.js';
import { MemoryCard } from '../components/memories/MemoryCard.jsx';
import { CreateMemoryModal } from '../components/memories/CreateMemoryModal.jsx';
import { MemoryDetailModal } from '../components/memories/MemoryDetailModal.jsx';
import { 
  BookHeart, 
  Plus, 
  Heart, 
  Sparkles, 
  Filter, 
  Loader2 
} from 'lucide-react';
import { toast } from 'sonner';

const CATEGORIES = [
  { id: 'all', label: 'Semua Momen' },
  { id: 'favorites', label: 'Favorit ❤️' },
  { id: 'sweet_moment', label: 'Momen Manis' },
  { id: 'first_date', label: 'Kencan Pertama' },
  { id: 'trip', label: 'Liburan Berdua' },
  { id: 'culinary', label: 'Kulineran' },
  { id: 'anniversary', label: 'Hari Jadian' },
];

export const MemoriesPage = () => {
  const [memories, setMemories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState('polaroid'); // 'polaroid' | 'grid'
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedMemory, setSelectedMemory] = useState(null);

  const loadMemories = async () => {
    try {
      setIsLoading(true);
      const res = await memoryApi.getMemories();
      if (res.success && res.memories) {
        setMemories(res.memories);
      }
    } catch (err) {
      console.warn('[LoadMemories Error]', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMemories();
  }, []);

  const handleCreateMemory = async (data) => {
    const res = await memoryApi.createMemory(data);
    if (res.success && res.memory) {
      setMemories((prev) => [res.memory, ...prev]);
    }
  };

  const handleToggleFavorite = async (id) => {
    try {
      const res = await memoryApi.toggleFavorite(id);
      if (res.success) {
        setMemories((prev) =>
          prev.map((m) =>
            m.id === id ? { ...m, is_favorite: !m.is_favorite } : m
          )
        );
        toast.success('Status favorit diperbarui ❤️');
      }
    } catch (err) {
      toast.error('Gagal memperbarui status favorit.');
    }
  };

  const handleDeleteMemory = async (id) => {
    if (!window.confirm('Yakin ingin menghapus kenangan ini? Tindakan ini tidak bisa dibatalkan.')) {
      return;
    }

    try {
      await memoryApi.deleteMemory(id);
      setMemories((prev) => prev.filter((m) => m.id !== id));
      toast.success('Kenangan berhasil dihapus.');
      if (selectedMemory?.id === id) {
        setSelectedMemory(null);
      }
    } catch (err) {
      toast.error('Gagal menghapus kenangan.');
    }
  };

  // Filter memories
  const filteredMemories = memories.filter((m) => {
    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'favorites') return m.is_favorite;
    return m.category === selectedCategory;
  });

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-charcoal-800">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-gradient-to-tr from-rose-600 to-plum-600 text-white shadow-lg shadow-rose-600/20">
            <BookHeart className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
              Kenangan Kita &amp; PAP
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-plum-900/60 text-romantic-300 border border-plum-700/50 font-normal">
                {memories.length} Momen
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Scrapbook digital perjalanan cinta Asit &amp; Nisya
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Mode Switcher */}
          <div className="flex items-center p-1 rounded-2xl bg-charcoal-850 border border-charcoal-700/80">
            <button
              onClick={() => setViewMode('polaroid')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                viewMode === 'polaroid'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              📸 Polaroid
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                viewMode === 'grid'
                  ? 'bg-plum-500/20 text-plum-300 border border-plum-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              ✨ Grid Modern
            </button>
          </div>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-romantic-600 to-plum-600 hover:from-romantic-500 hover:to-plum-500 text-white font-medium text-xs shadow-lg shadow-romantic-600/30 transition-all flex items-center justify-center gap-1.5 active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Tambah Kenangan</span>
            <span className="sm:hidden">Tambah</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs Horizontal Scroll */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all border ${
                isSelected
                  ? 'bg-romantic-600 text-white border-romantic-500 shadow-md shadow-romantic-600/20'
                  : 'bg-charcoal-850 text-slate-300 border-charcoal-700/80 hover:bg-charcoal-800 hover:text-slate-100'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Memories Grid or Loading / Empty state */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-2">
          <Loader2 className="w-7 h-7 animate-spin text-romantic-400" />
          <span className="text-xs">Membuka lembaran kenangan indah berdua...</span>
        </div>
      ) : filteredMemories.length === 0 ? (
        <div className="p-12 rounded-3xl glass-card border border-charcoal-700/60 bg-charcoal-900/40 text-center flex flex-col items-center justify-center my-8">
          <div className="w-16 h-16 rounded-3xl bg-romantic-500/10 border border-romantic-500/20 flex items-center justify-center text-romantic-400 mb-4 animate-pulse-subtle">
            <BookHeart className="w-8 h-8 fill-romantic-500/20" />
          </div>
          <h3 className="text-base font-semibold text-slate-100 mb-1">
            Belum Ada Kenangan di Kategori Ini
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mb-5 leading-relaxed">
            Abadikan momen kencan pertama, liburan bareng, foto PAP harian, atau cerita manismu dengan Nisya di sini.
          </p>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="px-4 py-2.5 rounded-xl text-xs font-medium bg-charcoal-800 hover:bg-charcoal-750 text-slate-200 border border-charcoal-700 transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4 text-romantic-400" />
            Abadikan Momen Pertama Sekarang
          </button>
        </div>
      ) : (
        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 ${viewMode === 'polaroid' ? 'gap-7 sm:gap-8 pt-3' : 'gap-5'}`}>
          {filteredMemories.map((mem) => (
            <MemoryCard
              key={mem.id}
              memory={mem}
              viewMode={viewMode}
              onToggleFavorite={handleToggleFavorite}
              onDelete={handleDeleteMemory}
              onClick={(m) => setSelectedMemory(m)}
            />
          ))}
        </div>
      )}

      {/* Create Memory Modal */}
      <CreateMemoryModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={handleCreateMemory}
      />

      {/* Memory Detail Lightbox Modal */}
      <MemoryDetailModal
        memory={selectedMemory}
        onClose={() => setSelectedMemory(null)}
        onToggleFavorite={handleToggleFavorite}
      />
    </div>
  );
};
