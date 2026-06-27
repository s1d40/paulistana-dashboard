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
  RefreshCcw,
  ShoppingBag,
  Store,
  Video
} from 'lucide-react';
import Image from 'next/image';
import clsx from 'clsx';

const ITEMS_PER_PAGE = 12;
const GCS_BASE_URL = 'https://storage.googleapis.com/cocreator_content';

interface PlatformData {
  price: number;
  permalink: string;
}

interface InventoryItem {
  id: string;
  title: string;
  slug_imagem_real: string | null;
  slug_embalagem: string | null;
  thumbnail: string | null;
  platforms: {
    mercadolivre?: PlatformData;
    nuvemshop?: PlatformData;
    tiktok?: PlatformData;
  };
  avgPrice: number;
}

const fetchInventory = async (): Promise<InventoryItem[]> => {
  const res = await fetch('/api/inventory');
  if (!res.ok) throw new Error('Falha ao carregar inventário');
  return res.json();
};

export default function GerenciadorProdutosPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isGenerating, setIsGenerating] = useState<string | null>(null);

  const { data: allProducts = [], isLoading, error } = useQuery({
    queryKey: ['inventoryList'],
    queryFn: fetchInventory,
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
      
      alert(`Solicitação de criação para "${productName}" enviada com sucesso!`);
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
      p.title.toLowerCase().includes(q) || 
      (p.slug_imagem_real && p.slug_imagem_real.toLowerCase().includes(q))
    );
  }, [allProducts, searchTerm]);

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const getAssetUrl = (folder: string, slug: string | null) => {
    if (!slug) return null;
    const fileName = slug.includes('.') ? slug : `${slug}.png`;
    return `${GCS_BASE_URL}/${folder}/${fileName}`;
  };

  if (error) {
    return (
      <div className="min-h-screen p-8 text-white flex flex-col items-center justify-center">
        <div className="text-red-400 bg-red-400/10 p-4 rounded-xl border border-red-400/20 max-w-md text-center">
          <p className="font-bold mb-2">Erro ao carregar dados</p>
          <p className="text-sm opacity-80">{(error as Error).message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 text-white max-w-[1600px] mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-200 to-orange-400 bg-clip-text text-transparent flex items-center gap-3">
            <Package className="w-8 h-8 text-amber-400" />
            Inventário Central
          </h1>
          <p className="text-slate-400 mt-2">Visão unificada do catálogo e inteligência de ativos visuais.</p>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-72">
            <Search className="w-4 h-4 absolute left-3 top-3.5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar por nome ou slug..."
              className="w-full bg-slate-900 border border-slate-700 text-sm text-white rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all"
              value={searchTerm}
              onChange={e => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between hover:border-slate-700 transition-colors">
          <div className="flex justify-between items-start">
            <p className="text-slate-400 font-medium">Total de Produtos</p>
            <Package className="w-5 h-5 text-amber-500" />
          </div>
          <h2 className="text-4xl font-black text-white mt-4">{isLoading ? '-' : allProducts.length}</h2>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between hover:border-slate-700 transition-colors">
          <div className="flex justify-between items-start">
            <p className="text-slate-400 font-medium">Mapeados c/ Foto</p>
            <Camera className="w-5 h-5 text-emerald-500" />
          </div>
          <h2 className="text-4xl font-black text-emerald-400 mt-4">{isLoading ? '-' : allProducts.filter(p => p.slug_imagem_real).length}</h2>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between hover:border-slate-700 transition-colors">
          <div className="flex justify-between items-start">
            <p className="text-slate-400 font-medium">Nuvemshop</p>
            <Store className="w-5 h-5 text-purple-500" />
          </div>
          <h2 className="text-4xl font-black text-white mt-4">{isLoading ? '-' : allProducts.filter(p => p.platforms.nuvemshop).length}</h2>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between hover:border-slate-700 transition-colors">
          <div className="flex justify-between items-start">
            <p className="text-slate-400 font-medium">Mercado Livre</p>
            <ShoppingBag className="w-5 h-5 text-yellow-500" />
          </div>
          <h2 className="text-4xl font-black text-white mt-4">{isLoading ? '-' : allProducts.filter(p => p.platforms.mercadolivre).length}</h2>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-amber-500 mb-4" />
          <p className="text-slate-400 animate-pulse">Sincronizando catálogos do Supabase...</p>
        </div>
      ) : paginatedProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-slate-900/50 rounded-3xl border border-slate-800 border-dashed">
          <Archive className="w-16 h-16 text-slate-700 mb-4" />
          <p className="text-slate-400 text-lg">Nenhum produto encontrado.</p>
          <button onClick={() => setSearchTerm('')} className="mt-4 text-amber-400 hover:underline">Limpar busca</button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {paginatedProducts.map(product => {
              const realImg = getAssetUrl('produtos_reais', product.slug_imagem_real);
              const pkgImg = getAssetUrl('embalagens', product.slug_embalagem);
              
              const hasAssets = realImg || pkgImg;

              return (
                <div key={product.id} className="group bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-slate-600 hover:shadow-2xl hover:shadow-amber-500/5 transition-all duration-300 flex flex-col">
                  {/* Image Header */}
                  <div className="relative h-48 bg-slate-950 w-full overflow-hidden flex items-center justify-center">
                    {realImg ? (
                      <img src={realImg} alt={product.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500 group-hover:scale-105" />
                    ) : product.thumbnail ? (
                      <img src={product.thumbnail} alt={product.title} className="w-full h-full object-cover opacity-50 blur-sm group-hover:blur-none transition-all duration-500" />
                    ) : (
                      <Package className="w-12 h-12 text-slate-800" />
                    )}
                    
                    {pkgImg && (
                      <div className="absolute bottom-2 right-2 w-12 h-12 rounded-lg border-2 border-slate-900 overflow-hidden shadow-lg">
                        <img src={pkgImg} alt="Embalagem" className="w-full h-full object-cover bg-slate-800" />
                      </div>
                    )}

                    {!hasAssets && (
                      <div className="absolute top-2 right-2 bg-red-500/80 backdrop-blur text-white text-[10px] font-bold px-2 py-1 rounded-md">
                        Sem Foto Mapeada
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-5 flex-1 flex flex-col">
                    <h3 className="font-bold text-white text-lg leading-tight mb-2 line-clamp-2" title={product.title}>
                      {product.title}
                    </h3>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      {product.platforms.nuvemshop && (
                        <a href={product.platforms.nuvemshop.permalink} target="_blank" rel="noreferrer" className="bg-purple-500/10 text-purple-400 border border-purple-500/20 text-xs px-2 py-1 rounded-md flex items-center gap-1 hover:bg-purple-500/20 transition-colors">
                          <Store className="w-3 h-3" /> Nuvemshop
                        </a>
                      )}
                      {product.platforms.mercadolivre && (
                        <a href={product.platforms.mercadolivre.permalink} target="_blank" rel="noreferrer" className="bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 text-xs px-2 py-1 rounded-md flex items-center gap-1 hover:bg-yellow-500/20 transition-colors">
                          <ShoppingBag className="w-3 h-3" /> Mercado Livre
                        </a>
                      )}
                      {product.platforms.tiktok && (
                        <a href={product.platforms.tiktok.permalink} target="_blank" rel="noreferrer" className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-xs px-2 py-1 rounded-md flex items-center gap-1 hover:bg-cyan-500/20 transition-colors">
                          <Store className="w-3 h-3" /> TikTok
                        </a>
                      )}
                    </div>

                    <div className="mt-auto">
                      <div className="flex justify-between items-end mb-4">
                        <div className="text-slate-400 text-xs uppercase tracking-wider font-semibold">Preço Médio</div>
                        <div className="text-xl font-black text-emerald-400">
                          {product.avgPrice > 0 ? `R$ ${product.avgPrice.toFixed(2)}` : 'N/A'}
                        </div>
                      </div>

                      <button
                        onClick={() => handleGenerateCreative(product.title)}
                        disabled={!!isGenerating || !hasAssets}
                        className={clsx(
                          "w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all",
                          isGenerating === product.title
                            ? "bg-slate-800 text-amber-500 cursor-not-allowed"
                            : hasAssets
                              ? "bg-amber-500 hover:bg-amber-400 text-amber-950 shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40"
                              : "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700"
                        )}
                      >
                        {isGenerating === product.title ? (
                          <><Loader2 className="w-5 h-5 animate-spin" /> Produzindo...</>
                        ) : hasAssets ? (
                          <><PlayCircle className="w-5 h-5" /> Criar Vídeo</>
                        ) : (
                          <><Camera className="w-5 h-5" /> Foto Pendente</>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-12 bg-slate-900 border border-slate-800 p-2 rounded-2xl w-max mx-auto shadow-xl">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-3 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 bg-slate-950 hover:bg-slate-800 rounded-xl transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="text-sm font-medium text-slate-300 px-4">
                Página {currentPage} de {totalPages}
              </div>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-3 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 bg-slate-950 hover:bg-slate-800 rounded-xl transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
