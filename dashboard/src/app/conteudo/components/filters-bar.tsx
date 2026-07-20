'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, ChevronDown, Camera, Share2, PlayCircle, Music, Check, X, SortAsc, SortDesc, FileText } from 'lucide-react';
import { useContentFilters } from '@/hooks/use-content-filters';
import clsx from 'clsx';

const STATUS_OPTIONS = [
  { label: 'Pendente Geração', value: 'Pendente_Geracao' },
  { label: 'Gerando', value: 'Gerando' },
  { label: 'Revisão', value: 'Revisão' },
  { label: 'Agendado', value: 'Agendado' },
  { label: 'Publicado', value: 'Publicado' },
  { label: 'Erro', value: 'Erro' },
];

const PLATFORM_OPTIONS = [
  { label: 'Instagram', value: 'Instagram', icon: Camera },
  { label: 'Facebook', value: 'Facebook', icon: Share2 },
  { label: 'TikTok', value: 'TikTok', icon: Music },
  { label: 'YouTube Shorts', value: 'YouTube', icon: PlayCircle },
  { label: 'Blog', value: 'Blog', icon: FileText },
];

const SORT_FIELDS = [
  { label: 'Data de Criação', value: 'createdAt' },
  { label: 'Status', value: 'status' },
  { label: 'Título', value: 'titulo_post' },
];

export default function FiltersBar() {
  const { filters, updateFilters, clearFilters } = useContentFilters();
  const [searchTerm, setSearchTerm] = useState(filters.searchQuery);
  const [isStatusOpen, setIsStatusOpen] = useState(false);

  // Debounced search update
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== filters.searchQuery) {
        updateFilters({ searchQuery: searchTerm, page: 1 });
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, updateFilters, filters.searchQuery]);

  const toggleStatus = (status: string) => {
    const newStatus = filters.status.includes(status)
      ? filters.status.filter(s => s !== status)
      : [...filters.status, status];
    updateFilters({ status: newStatus, page: 1 });
  };

  const togglePlatform = (platform: string) => {
    const newPlatform = filters.platform.includes(platform)
      ? filters.platform.filter(p => p !== platform)
      : [...filters.platform, platform];
    updateFilters({ platform: newPlatform, page: 1 });
  };

  return (
    <div className="flex flex-col gap-4 bg-zinc-900/40 p-6 rounded-[2rem] border border-zinc-800/50 backdrop-blur-xl">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Search */}
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-orange-500 transition-colors" />
          <input
            type="text"
            placeholder="Buscar no ecossistema de conteúdo..."
            className="w-full pl-12 pr-4 py-3 bg-black/40 border border-zinc-800 rounded-2xl text-sm text-zinc-300 focus:outline-none focus:border-orange-500/50 focus:ring-4 focus:ring-orange-500/5 transition-all placeholder:text-zinc-700"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Status Filter */}
        <div className="relative z-30">
          <button
            onClick={() => setIsStatusOpen(!isStatusOpen)}
            className="flex items-center gap-3 px-6 py-3 bg-black/40 border border-zinc-800 rounded-2xl text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white hover:border-zinc-700 transition-all min-w-[200px] justify-between group"
          >
            <span className="flex items-center gap-2">
              <Filter className="w-4 h-4 group-hover:text-orange-500 transition-colors" />
              Status {filters.status.length > 0 && <span className="text-orange-500">[{filters.status.length}]</span>}
            </span>
            <ChevronDown className={clsx("w-4 h-4 transition-transform", isStatusOpen && "rotate-180")} />
          </button>

          {isStatusOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setIsStatusOpen(false)} />
              <div className="absolute top-full left-0 mt-3 w-72 bg-[#0c0a09] border border-zinc-800 rounded-3xl shadow-2xl z-20 overflow-hidden animate-in fade-in slide-in-from-top-2">
                <div className="p-3 space-y-1">
                  {STATUS_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => toggleStatus(opt.value)}
                      className="flex items-center justify-between w-full px-4 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-zinc-900 transition-colors text-zinc-500 hover:text-white"
                    >
                      <span>{opt.label}</span>
                      {filters.status.includes(opt.value) && <Check className="w-4 h-4 text-orange-500" />}
                    </button>
                  ))}
                </div>
                {filters.status.length > 0 && (
                  <div className="border-t border-zinc-800/50 p-3 bg-black/40">
                    <button
                      onClick={() => updateFilters({ status: [] })}
                      className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-600 hover:text-red-500 w-full text-center py-2 transition-colors"
                    >
                      Limpar Seleção
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Sorting */}
        <div className="flex items-center gap-3">
          <select
            value={filters.sortBy}
            onChange={(e) => updateFilters({ sortBy: e.target.value, page: 1 })}
            className="px-6 py-3 bg-black/40 border border-zinc-800 rounded-2xl text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white focus:outline-none focus:border-orange-500/50 transition-all appearance-none cursor-pointer"
          >
            {SORT_FIELDS.map(opt => (
              <option key={opt.value} value={opt.value} className="bg-[#0c0a09]">{opt.label}</option>
            ))}
          </select>
          <button
            onClick={() => updateFilters({ sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc' })}
            className="p-3 bg-black/40 border border-zinc-800 rounded-2xl hover:border-zinc-700 transition-all text-zinc-600 hover:text-orange-500"
          >
            {filters.sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 border-t border-zinc-800/50 pt-6">
        {/* Platform Pills */}
        <div className="flex flex-wrap gap-3">
          {PLATFORM_OPTIONS.map((opt) => {
            const isActive = filters.platform.includes(opt.value);
            return (
              <button
                key={opt.value}
                onClick={() => togglePlatform(opt.value)}
                className={clsx(
                  "flex items-center gap-2.5 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border",
                  isActive
                    ? "bg-orange-500/10 border-orange-500/50 text-orange-500 shadow-lg shadow-orange-500/10"
                    : "bg-black/20 border-zinc-800 text-zinc-600 hover:text-zinc-400 hover:border-zinc-700"
                )}
              >
                <opt.icon className={clsx("w-3.5 h-3.5", isActive ? "text-orange-500" : "text-zinc-700")} />
                {opt.label}
              </button>
            );
          })}
        </div>

        {/* Clear All Button */}
        {(filters.searchQuery || filters.status.length > 0 || filters.platform.length > 0 || filters.niche) && (
          <button
            onClick={() => {
              setSearchTerm('');
              clearFilters();
            }}
            className="flex items-center gap-2 px-4 py-2 text-[9px] font-black uppercase tracking-widest text-red-500/60 hover:text-red-500 transition-colors group"
          >
            <X className="w-3.5 h-3.5 group-hover:rotate-90 transition-transform" />
            Resetar Filtros
          </button>
        )}
      </div>
    </div>
  );
}
