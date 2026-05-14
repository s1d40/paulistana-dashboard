'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Images, 
  Search, 
  Loader2, 
  Copy, 
  Check, 
  ChevronLeft, 
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import Image from 'next/image';
import { PostImage } from '@/services/google-sheets';
import clsx from 'clsx';

const IMAGES_PER_PAGE = 24;

const fetchImages = async (): Promise<PostImage[]> => {
  const res = await fetch('/api/images');
  if (!res.ok) throw new Error('Falha ao carregar banco de imagens');
  return res.json();
};

export default function BancoImagensPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { data: allImages = [], isLoading, error } = useQuery({
    queryKey: ['imageBank'],
    queryFn: fetchImages,
  });

  const handleCopyPrompt = (prompt: string, id: string) => {
    navigator.clipboard.writeText(prompt);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filtro "Semântico" (Busca por palavras-chave no prompt)
  const filteredImages = useMemo(() => {
    if (!searchTerm.trim()) return allImages;
    
    const terms = searchTerm.toLowerCase().split(/\s+/).filter(Boolean);
    return allImages.filter(img => {
      const prompt = (img.prompt_utilizado || img.texto_na_imagem || '').toLowerCase();
      // Deve conter todos os termos da busca para ser um match (AND logic)
      return terms.every(term => prompt.includes(term));
    });
  }, [allImages, searchTerm]);

  // Paginação
  const totalPages = Math.ceil(filteredImages.length / IMAGES_PER_PAGE);
  const paginatedImages = filteredImages.slice(
    (currentPage - 1) * IMAGES_PER_PAGE,
    currentPage * IMAGES_PER_PAGE
  );

  return (
    <main className="flex-1 bg-zinc-50 dark:bg-zinc-950 p-6 md:p-12 overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-col gap-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-sm font-medium w-fit mb-2">
              <Images className="w-4 h-4" />
              Banco de Assets
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-zinc-900 dark:text-white">
              Banco de Imagens
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 text-lg">
              Explore e reutilize prompts de imagens geradas pela IA.
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
            <input
              type="text"
              placeholder="Busca semântica por prompt (ex: amendoas, natural, luz suave)..."
              className="w-full pl-11 pr-4 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[400px] text-zinc-500">
            <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mb-4" />
            <p className="font-bold uppercase tracking-widest text-xs">Carregando Galeria...</p>
          </div>
        ) : error ? (
          <div className="p-6 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-2xl border border-red-100 dark:border-red-900/50">
            <h3 className="font-bold text-lg mb-2">Erro ao carregar dados</h3>
            <p>{(error as Error).message}</p>
          </div>
        ) : filteredImages.length === 0 ? (
          <div className="p-20 text-center bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-inner">
            <Images className="w-16 h-16 text-zinc-300 dark:text-zinc-700 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">Nenhum asset encontrado</h3>
            <p className="text-zinc-500 dark:text-zinc-400">
              Tente outros termos de busca para encontrar o que procura.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {paginatedImages.map((img, idx) => {
                const url = img.image_url || img.url_imagem_fundo || '';
                const prompt = img.prompt_utilizado || img.texto_na_imagem || 'Sem prompt registrado.';
                const uniqueId = `${img.id_post}-${idx}`;

                return (
                  <div key={uniqueId} className="group flex flex-col bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300">
                    
                    {/* Image Wrapper */}
                    <div className="relative aspect-square bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                      <Image 
                        src={url} 
                        alt="Asset" 
                        fill 
                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                        unoptimized
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4 gap-3">
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleCopyPrompt(prompt, uniqueId)}
                            className="flex-1 flex items-center justify-center gap-2 py-2 bg-white/20 backdrop-blur-md hover:bg-white/40 text-white rounded-lg text-xs font-black transition-all"
                          >
                            {copiedId === uniqueId ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            {copiedId === uniqueId ? 'COPIADO' : 'COPIAR PROMPT'}
                          </button>
                          <a 
                            href={url} 
                            target="_blank" 
                            rel="noreferrer"
                            className="p-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </div>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-4 space-y-2 flex-1 flex flex-col">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded">
                          Post #{img.id_post?.substring(0, 6)}
                        </span>
                        <span className="text-[10px] font-bold text-zinc-400">
                          {img.numero_cena ? `Cena ${img.numero_cena}` : 'Carrossel'}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-3 italic leading-relaxed">
                        &quot;{prompt}&quot;
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-zinc-200 dark:border-zinc-800 pt-8 pb-12">
                <div className="text-sm text-zinc-500 dark:text-zinc-400">
                  Mostrando <span className="font-black text-zinc-900 dark:text-white">{(currentPage - 1) * IMAGES_PER_PAGE + 1}</span> a <span className="font-black text-zinc-900 dark:text-white">{Math.min(currentPage * IMAGES_PER_PAGE, filteredImages.length)}</span> de <span className="font-black text-zinc-900 dark:text-white">{filteredImages.length}</span> assets
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
                      // Simples lógica para mostrar páginas ao redor da atual
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
                              ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30"
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
