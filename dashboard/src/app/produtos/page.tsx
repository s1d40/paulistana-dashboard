'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Package, 
  Search, 
  Loader2, 
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Eye,
  Camera,
  Archive,
  PlayCircle,
  RefreshCcw
} from 'lucide-react';
import Image from 'next/image';
import { Product } from '@/services/google-sheets';
import clsx from 'clsx';

const ITEMS_PER_PAGE = 12;
const GCS_BASE_URL = 'https://storage.googleapis.com/cocreator_content';

const fetchProducts = async (): Promise<Product[]> => {
  const res = await fetch('/api/products');
  if (!res.ok) throw new Error('Falha ao carregar lista de produtos');
  return res.json();
};

export default function GerenciadorProdutosPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isGenerating, setIsGenerating] = useState<string | null>(null);

  const { data: allProducts = [], isLoading, error } = useQuery({
    queryKey: ['productList'],
    queryFn: fetchProducts,
  });

  const handleGenerateCreative = async (productName: string) => {
    setIsGenerating(productName);
    try {
      const res = await fetch('/api/production/single', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productName }),
      });

      if (!res.ok) throw new Error('Falha na requisição');
      
      alert(`Solicitação de criação para "${productName}" enviada ao n8n!`);
    } catch (error) {
      console.error(error);
      alert('Erro ao enviar solicitação de criação.');
    } finally {
      setIsGenerating(null);
    }
  };

  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim()) return allProducts;
    const q = searchTerm.toLowerCase();
    return allProducts.filter(p => 
      p.Produto.toLowerCase().includes(q) || 
      p.slug_embalagem.toLowerCase().includes(q)
    );
  }, [allProducts, searchTerm]);

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const getAssetUrl = (folder: string, slug: string) => {
    if (!slug) return null;
    // Garante que o slug tenha extensão (assume .png se não tiver)
    const fileName = slug.includes('.') ? slug : `${slug}.png`;
    return `${GCS_BASE_URL}/${folder}/${fileName}`;
  };

  return (
    <main className="flex-1 bg-zinc-50 dark:bg-zinc-950 p-6 md:p-12 overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-col gap-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-sm font-medium w-fit mb-2">
              <Package className="w-4 h-4" />
              Asset Control
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-zinc-900 dark:text-white">
              Gerenciador de Ativos
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 text-lg">
              Controle os slugs e visualize as fotos de embalagem e produtos reais.
            </p>
          </div>

          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
            <input
              type="text"
              placeholder="Buscar produto ou slug..."
              className="w-full pl-11 pr-4 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm focus:ring-2 focus:ring-amber-500/20 outline-none transition-all"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            />
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[400px] text-zinc-500">
            <Loader2 className="w-10 h-10 animate-spin text-amber-500 mb-4" />
            <p className="font-bold uppercase tracking-widest text-xs">Carregando Catálogo...</p>
          </div>
        ) : error ? (
          <div className="p-6 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-2xl border border-red-100">
            <h3 className="font-bold text-lg mb-2">Erro ao carregar dados</h3>
            <p>{(error as Error).message}</p>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="grid grid-cols-1 gap-6">
              {paginatedProducts.map((product, idx) => (
                <div key={idx} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all p-6">
                  <div className="flex flex-col lg:flex-row gap-8">
                    
                    {/* Info */}
                    <div className="flex-1 space-y-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-2xl font-black text-zinc-900 dark:text-white uppercase tracking-tight">
                            {product.Produto}
                          </h3>
                          <div className="flex flex-wrap gap-2 mt-2">
                            <span className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-500 text-[10px] font-bold font-mono">
                              EMB: {product.slug_embalagem}
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-500 text-[10px] font-bold font-mono">
                              REAL: {product.slug_imagem_real}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => handleGenerateCreative(product.Produto)}
                            disabled={!!isGenerating}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-md disabled:opacity-50"
                          >
                            {isGenerating === product.Produto ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <PlayCircle className="w-4 h-4" />}
                            Gerar Criativo
                          </button>
                          <button className="p-2 text-zinc-400 hover:text-zinc-600">
                            <ExternalLink className="w-5 h-5" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800">
                          <p className="text-[10px] font-black uppercase text-amber-600 mb-1">Restrição Narrativa</p>
                          <p className="text-sm text-zinc-600 dark:text-zinc-400 italic">
                            {product.Restricao_Narrativa || 'Nenhuma restrição registrada.'}
                          </p>
                        </div>
                        <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800">
                          <p className="text-[10px] font-black uppercase text-indigo-600 mb-1">Restrição Visual</p>
                          <p className="text-sm text-zinc-600 dark:text-zinc-400 italic">
                            {product.Restricao_Visual || 'Nenhuma restrição registrada.'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Previews */}
                    <div className="flex gap-4 shrink-0">
                      <div className="space-y-2 text-center">
                        <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest flex items-center justify-center gap-1">
                          <Archive className="w-3 h-3" /> Embalagem
                        </p>
                        <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-2xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 border-2 border-zinc-100 dark:border-zinc-800 group/img">
                          {product.slug_embalagem ? (
                            <Image 
                              src={getAssetUrl('embalagem', product.slug_embalagem) || ''} 
                              alt="Embalagem" fill className="object-cover group-hover/img:scale-110 transition-transform" unoptimized 
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-zinc-300"><Eye className="w-8 h-8 opacity-20" /></div>
                          )}
                        </div>
                      </div>
                      
                      <div className="space-y-2 text-center">
                        <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest flex items-center justify-center gap-1">
                          <Camera className="w-3 h-3" /> Produto Real
                        </p>
                        <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-2xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 border-2 border-zinc-100 dark:border-zinc-800 group/img">
                          {product.slug_imagem_real ? (
                            <Image 
                              src={getAssetUrl('produtos_reais', product.slug_imagem_real) || ''} 
                              alt="Real" fill className="object-cover group-hover/img:scale-110 transition-transform" unoptimized 
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-zinc-300"><Eye className="w-8 h-8 opacity-20" /></div>
                          )}
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-zinc-200 dark:border-zinc-800 pt-8 pb-12">
                <div className="text-sm text-zinc-500 dark:text-zinc-400">
                  Mostrando <span className="font-black text-zinc-900 dark:text-white">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> a <span className="font-black text-zinc-900 dark:text-white">{Math.min(currentPage * ITEMS_PER_PAGE, filteredProducts.length)}</span> de <span className="font-black text-zinc-900 dark:text-white">{filteredProducts.length}</span> produtos
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
                              ? "bg-amber-600 text-white shadow-lg shadow-amber-500/30"
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
