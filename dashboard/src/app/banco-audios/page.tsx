'use client';
export const dynamic = 'force-dynamic';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Music, 
  Search, 
  Loader2, 
  Download, 
  Copy, 
  Check, 
  ChevronLeft, 
  ChevronRight,
  ExternalLink,
  Calendar,
  Hash
} from 'lucide-react';
import { PostAudio } from '@/services/google-sheets';
import clsx from 'clsx';

const ITEMS_PER_PAGE = 20;

const fetchAudios = async (): Promise<PostAudio[]> => {
  const res = await fetch('/api/audios');
  if (!res.ok) throw new Error('Falha ao carregar banco de áudios');
  return res.json();
};

export default function BancoAudiosPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [postIdFilter, setPostIdFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { data: allAudios = [], isLoading, error } = useQuery({
    queryKey: ['audioBank'],
    queryFn: fetchAudios,
  });

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filtros Avançados
  const filteredAudios = useMemo(() => {
    return allAudios.filter(audio => {
      const textMatch = !searchTerm.trim() || (audio.texto_narrado || '').toLowerCase().includes(searchTerm.toLowerCase());
      const postIdMatch = !postIdFilter.trim() || (audio.id_post || '').toLowerCase().includes(postIdFilter.toLowerCase());
      const dateMatch = !dateFilter || (audio.data_geracao && audio.data_geracao.includes(dateFilter));
      
      return textMatch && postIdMatch && dateMatch;
    });
  }, [allAudios, searchTerm, postIdFilter, dateFilter]);

  // Paginação
  const totalPages = Math.ceil(filteredAudios.length / ITEMS_PER_PAGE);
  const paginatedAudios = filteredAudios.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <main className="flex-1 bg-zinc-50 dark:bg-zinc-950 p-6 md:p-12 overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-sm font-medium w-fit mb-2">
              <Music className="w-4 h-4" />
              Audio Library
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-zinc-900 dark:text-white">
              Banco de Áudios
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 text-lg">
              Gerencie e ouça as narrações geradas pela IA.
            </p>
          </div>

          {/* Filters Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Buscar por texto narrado..."
                className="w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              />
            </div>
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Filtrar por Post ID..."
                className="w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                value={postIdFilter}
                onChange={(e) => { setPostIdFilter(e.target.value); setCurrentPage(1); }}
              />
            </div>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="date"
                className="w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                value={dateFilter}
                onChange={(e) => { setDateFilter(e.target.value); setCurrentPage(1); }}
              />
            </div>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[400px] text-zinc-500">
            <Loader2 className="w-10 h-10 animate-spin text-emerald-500 mb-4" />
            <p className="font-bold uppercase tracking-widest text-xs">Carregando Áudios...</p>
          </div>
        ) : error ? (
          <div className="p-6 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-2xl border border-red-100 dark:border-red-900/50">
            <h3 className="font-bold text-lg mb-2">Erro ao carregar dados</h3>
            <p>{(error as Error).message}</p>
          </div>
        ) : filteredAudios.length === 0 ? (
          <div className="p-20 text-center bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-inner">
            <Music className="w-16 h-16 text-zinc-300 dark:text-zinc-700 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">Nenhum áudio encontrado</h3>
            <p className="text-zinc-500 dark:text-zinc-400">
              Tente ajustar seus filtros para encontrar o que procura.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* List */}
            <div className="grid grid-cols-1 gap-4">
              {paginatedAudios.map((audio, idx) => {
                const uniqueId = `${audio.id_audio || idx}`;

                return (
                  <div key={uniqueId} className="group flex flex-col md:flex-row bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all p-4 gap-6 items-center">
                    
                    {/* Audio Player Section */}
                    <div className="w-full md:w-auto flex items-center gap-4 shrink-0">
                      <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                        <Music className="w-6 h-6" />
                      </div>
                      <audio 
                        src={audio.audio_url} 
                        controls 
                        className="h-10 w-full md:w-64 accent-emerald-500"
                      />
                    </div>

                    {/* Info Section */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded">
                          Post #{audio.id_post?.substring(0, 6)}
                        </span>
                        <span className="text-[10px] font-bold text-zinc-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {audio.data_geracao ? new Date(audio.data_geracao).toLocaleDateString('pt-BR') : 'Sem data'}
                        </span>
                        {audio.numero_cena && (
                          <span className="text-[10px] font-bold text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
                            Cena {audio.numero_cena}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-zinc-700 dark:text-zinc-300 font-medium line-clamp-2 italic">
                        &quot;{audio.texto_narrado || 'Sem texto registrado.'}&quot;
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 md:border-l border-zinc-100 dark:border-zinc-800 md:pl-6">
                      <button 
                        onClick={() => handleCopyText(audio.texto_narrado || '', uniqueId)}
                        className={clsx(
                          "p-2 rounded-xl transition-all",
                          copiedId === uniqueId ? "bg-emerald-500 text-white" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:bg-zinc-200"
                        )}
                        title="Copiar texto narrado"
                      >
                        {copiedId === uniqueId ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </button>
                      <a 
                        href={audio.audio_url} 
                        download
                        className="p-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:bg-zinc-200 rounded-xl transition-all"
                        title="Download"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                      <a 
                        href={audio.audio_url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="p-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:bg-zinc-200 rounded-xl transition-all"
                        title="Abrir em nova aba"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-zinc-200 dark:border-zinc-800 pt-8 pb-12">
                <div className="text-sm text-zinc-500 dark:text-zinc-400">
                  Mostrando <span className="font-black text-zinc-900 dark:text-white">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> a <span className="font-black text-zinc-900 dark:text-white">{Math.min(currentPage * ITEMS_PER_PAGE, filteredAudios.length)}</span> de <span className="font-black text-zinc-900 dark:text-white">{filteredAudios.length}</span> áudios
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:bg-white dark:hover:bg-zinc-900 disabled:opacity-30 transition-all shadow-sm"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                      let pageNum = currentPage;
                      if (currentPage <= 3) pageNum = i + 1;
                      else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                      else pageNum = currentPage - 2 + i;
                      
                      if (pageNum <= 0 || pageNum > totalPages) return null;

                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={clsx(
                            "w-10 h-10 rounded-xl text-sm font-black transition-all",
                            currentPage === pageNum
                              ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/30"
                              : "text-zinc-500 hover:bg-white dark:hover:bg-zinc-900 border border-transparent hover:border-zinc-200"
                          )}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:bg-white dark:hover:bg-zinc-900 disabled:opacity-30 transition-all shadow-sm"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
