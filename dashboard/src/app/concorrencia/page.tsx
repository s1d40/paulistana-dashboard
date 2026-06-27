"use client";

import React, { useState, useEffect } from "react";
import { 
  TrendingUp, TrendingDown, Minus, ExternalLink, Search, 
  Plus, RefreshCw, Box, Store, X, BookmarkPlus, Image as ImageIcon, Loader2, Radar
} from "lucide-react";
import { supabase } from '@/lib/supabase';

type CompetitorAd = {
  id: string;
  seller_name: string;
  title: string;
  url: string;
  price_yesterday: number;
  price_today: number;
};

type TrackedProduct = {
  id: string;
  name: string;
  ads: CompetitorAd[];
};

export default function PriceTrackerPage() {
  const [trackedProducts, setTrackedProducts] = useState<TrackedProduct[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showExploreModal, setShowExploreModal] = useState(false);
  const [exploreSearch, setExploreSearch] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchError, setSearchError] = useState("");

  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { data: productsData } = await supabase.from('tracked_products').select('*').order('created_at', { ascending: false });
      const { data: adsData } = await supabase.from('competitor_ads').select('*');
      const { data: historyData } = await supabase.from('price_history').select('*').order('captured_at', { ascending: false });

      const mappedProducts: TrackedProduct[] = (productsData || []).map(p => {
        const productAds = (adsData || []).filter(a => a.product_id === p.id).map(ad => {
          const adHistory = (historyData || []).filter(h => h.ad_id === ad.id).sort((a,b) => new Date(b.captured_at).getTime() - new Date(a.captured_at).getTime());
          
          let price_today = adHistory[0]?.price || 0;
          let price_yesterday = adHistory.length > 1 ? adHistory[1]?.price : price_today;

          return {
            id: ad.id,
            seller_name: ad.seller_name || 'Desconhecido',
            title: ad.title || 'Sem título',
            url: ad.url || '#',
            price_yesterday,
            price_today
          };
        });

        return { id: p.id, name: p.name, ads: productAds };
      });

      setTrackedProducts(mappedProducts);
      if (mappedProducts.length > 0 && !selectedProductId) {
        setSelectedProductId(mappedProducts[0].id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAutoDiscover = async () => {
    if (!confirm("Isso fará o robô varrer todos os seus produtos no Mercado Livre e buscar os Top 25 concorrentes de cada um. Pode levar alguns segundos. Deseja continuar?")) return;
    setIsSyncing(true);
    try {
      const res = await fetch('/api/concorrencia/auto-discover', { method: 'POST' });
      if (!res.ok) throw new Error("Erro ao iniciar auto-descoberta");
      const data = await res.json();
      alert(`Auto-descoberta finalizada! Foram processados concorrentes em ${data.summary?.length || 0} produtos.`);
      await fetchData();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/concorrencia/sync', { method: 'POST' });
      if (!res.ok) throw new Error("Erro ao sincronizar preços");
      await fetchData(); // Recarrega os dados após sincronizar
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleAddProduct = async () => {
    const name = prompt("Nome do grupo de produtos (ex: Mix de Vegetais):");
    if (!name) return;
    const { error } = await supabase.from('tracked_products').insert({ name });
    if (!error) fetchData();
  };

  const handleDeleteProduct = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Tem certeza que deseja excluir este grupo?")) return;
    await supabase.from('tracked_products').delete().eq('id', id);
    if (selectedProductId === id) setSelectedProductId("");
    fetchData();
  };

  const handleDeleteAd = async (id: string) => {
    if (!confirm("Remover este concorrente?")) return;
    await supabase.from('competitor_ads').delete().eq('id', id);
    fetchData();
  };

  const handleSearchML = async () => {
    if (!exploreSearch.trim()) return;
    setIsSearching(true);
    setSearchError("");
    setSearchResults([]);

    try {
      const match = exploreSearch.match(/MLB-?(\d+)/i) || exploreSearch.match(/(?:produto\.mercadolivre\.com\.br\/|mercadolivre\.com\.br\/p\/)(MLB-?\d+)/i);
      let mlb = exploreSearch.trim();
      if (match) mlb = match[1].includes('MLB') ? match[1].replace('-', '') : `MLB${match[1]}`;
      if (!mlb.startsWith('MLB')) {
        setSearchError("Por favor, cole um link válido do Mercado Livre ou um ID MLB (ex: MLB123456)");
        setIsSearching(false);
        return;
      }

      const res = await fetch(`/api/concorrencia/ml-item?mlb=${mlb}`);
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();

      setSearchResults([{
        id: mlb,
        title: data.title,
        price: data.price,
        permalink: data.permalink,
        thumbnail: data.thumbnail,
        seller_name: data.seller_name
      }]);
    } catch (err: any) {
      setSearchError("Erro ao buscar anúncio: " + err.message);
    } finally {
      setIsSearching(false);
    }
  };

  const handleFollowAd = async (item: any) => {
    if (!selectedProductId) {
      alert("Selecione um grupo de produtos primeiro!");
      return;
    }
    const { data: newAd, error } = await supabase.from('competitor_ads').insert({
      product_id: selectedProductId,
      title: item.title,
      url: item.permalink,
      ml_id: item.id,
      seller_name: item.seller_name
    }).select('id').single();
    
    if (error) {
      alert("Erro ao adicionar anúncio");
      return;
    }

    if (newAd) {
      await supabase.from('price_history').insert({
        ad_id: newAd.id,
        price: item.price,
        captured_at: new Date().toISOString()
      });
    }

    setShowExploreModal(false);
    setExploreSearch("");
    setSearchResults([]);
    fetchData();
  };

  const selectedProduct = trackedProducts.find(p => p.id === selectedProductId);
  const filteredAds = selectedProduct?.ads.filter(ad => 
    ad.seller_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ad.title.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            <TrendingUp className="w-8 h-8 text-blue-500" />
            Radar de Concorrentes
          </h1>
          <p className="text-zinc-400 mt-2">Monitore as alterações de preços dos seus concorrentes em tempo real.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button onClick={handleAutoDiscover} disabled={isSyncing} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center gap-2 transition-colors shadow-lg shadow-purple-500/20 font-medium disabled:opacity-50">
            {isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Radar className="w-4 h-4" />}
            Auto-Descobrir (Top 25)
          </button>
          <button onClick={handleSync} disabled={isSyncing} className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg flex items-center gap-2 transition-colors border border-zinc-700 disabled:opacity-50">
            {isSyncing || isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            {isSyncing ? "Processando..." : "Sincronizar Agora"}
          </button>
          <button onClick={() => setShowExploreModal(true)} disabled={!selectedProduct} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors shadow-lg shadow-blue-500/20 font-medium disabled:opacity-50">
            <Plus className="w-4 h-4" /> Novo Anúncio
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden backdrop-blur-sm flex flex-col h-[600px]">
          <div className="p-4 border-b border-zinc-800 bg-zinc-900/80 flex justify-between items-center">
            <h2 className="font-semibold text-white flex items-center gap-2">
              <Box className="w-4 h-4 text-blue-400" /> Meus Produtos
            </h2>
            <button onClick={handleAddProduct} className="p-1.5 hover:bg-zinc-700 rounded-md text-zinc-400 hover:text-white transition-colors">
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="p-2 flex-1 overflow-y-auto space-y-1 custom-scrollbar">
            {isLoading && trackedProducts.length === 0 ? (
              <div className="p-4 text-center text-zinc-500 text-sm">Carregando...</div>
            ) : trackedProducts.length === 0 ? (
              <div className="p-4 text-center text-zinc-500 text-sm">Nenhum produto rastreado.</div>
            ) : (
              trackedProducts.map((product) => (
                <button
                  key={product.id}
                  onClick={() => setSelectedProductId(product.id)}
                  className={`w-full text-left px-3 py-3 rounded-lg text-sm transition-all duration-200 flex items-center justify-between group ${
                    selectedProductId === product.id ? "bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium" : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 border border-transparent"
                  }`}
                >
                  <span className="truncate pr-2">{product.name}</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${selectedProductId === product.id ? "bg-blue-500/20" : "bg-zinc-800"}`}>
                      {product.ads.length}
                    </span>
                    <div onClick={(e) => handleDeleteProduct(product.id, e)} className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 hover:text-red-400 rounded transition-all">
                      <X className="w-3 h-3" />
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="lg:col-span-3 bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden backdrop-blur-sm flex flex-col h-[600px]">
          <div className="p-5 border-b border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-900/80">
            <h2 className="text-lg font-semibold text-white">
              Monitorando: <span className="text-zinc-400 font-normal">{selectedProduct?.name || 'Selecione um produto'}</span>
            </h2>
            <div className="relative">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input type="text" placeholder="Buscar vendedor ou título..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 pr-4 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all w-full sm:w-64" />
            </div>
          </div>

          <div className="flex-1 overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-950/50 border-b border-zinc-800 sticky top-0 backdrop-blur-md">
                  <th className="px-5 py-4 text-xs font-medium text-zinc-400 uppercase tracking-wider">Vendedor</th>
                  <th className="px-5 py-4 text-xs font-medium text-zinc-400 uppercase tracking-wider">Anúncio</th>
                  <th className="px-5 py-4 text-xs font-medium text-zinc-400 uppercase tracking-wider text-right">D-1 (Ontem)</th>
                  <th className="px-5 py-4 text-xs font-medium text-zinc-400 uppercase tracking-wider text-right">Hoje</th>
                  <th className="px-5 py-4 text-xs font-medium text-zinc-400 uppercase tracking-wider text-right">Variação</th>
                  <th className="px-5 py-4 text-xs font-medium text-zinc-400 uppercase tracking-wider text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {isLoading ? (
                  <tr><td colSpan={6} className="px-5 py-12 text-center text-zinc-500">Carregando dados...</td></tr>
                ) : filteredAds.length === 0 ? (
                  <tr><td colSpan={6} className="px-5 py-12 text-center text-zinc-500">Nenhum anúncio monitorado para este produto.</td></tr>
                ) : (
                  filteredAds.map((ad) => {
                    const diff = ad.price_today - ad.price_yesterday;
                    const percentDiff = ad.price_yesterday > 0 ? ((diff) / ad.price_yesterday) * 100 : 0;
                    
                    let StatusIcon = Minus;
                    let statusColor = "text-zinc-500";
                    let badgeBg = "bg-zinc-500/10";
                    
                    if (diff > 0) {
                      StatusIcon = TrendingUp;
                      statusColor = "text-red-400"; 
                      badgeBg = "bg-red-500/10 border-red-500/20";
                    } else if (diff < 0) {
                      StatusIcon = TrendingDown;
                      statusColor = "text-emerald-400"; 
                      badgeBg = "bg-emerald-500/10 border-emerald-500/20";
                    }

                    return (
                      <tr key={ad.id} className="hover:bg-zinc-800/30 transition-colors group">
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Store className="w-4 h-4 text-zinc-500" />
                            <span className="font-medium text-zinc-200">{ad.seller_name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2 max-w-[200px] lg:max-w-[250px]">
                            <span className="text-sm text-zinc-400 truncate group-hover:text-zinc-300 transition-colors" title={ad.title}>{ad.title}</span>
                            <a href={ad.url} target="_blank" rel="noreferrer" className="text-zinc-600 hover:text-blue-400 transition-colors"><ExternalLink className="w-3.5 h-3.5" /></a>
                          </div>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-right text-sm text-zinc-500">R$ {ad.price_yesterday.toFixed(2).replace('.', ',')}</td>
                        <td className="px-5 py-4 whitespace-nowrap text-right font-medium text-zinc-200">R$ {ad.price_today.toFixed(2).replace('.', ',')}</td>
                        <td className="px-5 py-4 whitespace-nowrap text-right">
                          {diff === 0 ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-medium text-zinc-500 bg-zinc-500/10 border border-zinc-500/20"><Minus className="w-3 h-3" />0%</span>
                          ) : (
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-medium border ${statusColor} ${badgeBg}`}>
                              <StatusIcon className="w-3 h-3" />
                              {diff > 0 ? "+" : ""}{percentDiff.toFixed(1)}%
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-right">
                          <button onClick={() => handleDeleteAd(ad.id)} className="p-1.5 bg-zinc-800/50 hover:bg-red-500/20 text-zinc-500 hover:text-red-400 rounded-md transition-colors opacity-0 group-hover:opacity-100">
                            <X className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showExploreModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-3xl shadow-2xl flex flex-col overflow-hidden">
            <div className="p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/80">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2"><Search className="w-5 h-5 text-blue-500" /> Adicionar Anúncio ao Radar</h2>
              <button onClick={() => setShowExploreModal(false)} className="text-zinc-500 hover:text-white p-2 hover:bg-zinc-800 rounded-lg transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 bg-zinc-950/50">
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Search className="w-5 h-5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input type="text" placeholder="Cole a URL ou o código MLB do anúncio (Ex: MLB123456)..." value={exploreSearch} onChange={(e) => setExploreSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearchML()} className="pl-10 pr-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all w-full" />
                </div>
                <button onClick={handleSearchML} disabled={isSearching} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 min-w-[100px] flex items-center justify-center">
                  {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Buscar'}
                </button>
              </div>
              {searchError && <p className="text-red-400 text-sm mt-3">{searchError}</p>}
            </div>
            <div className="flex-1 overflow-y-auto max-h-[50vh] p-5 space-y-3 bg-zinc-950">
              {searchResults.length === 0 && !isSearching && !searchError && (
                <div className="text-center py-12 text-zinc-500 flex flex-col items-center">
                  <Search className="w-12 h-12 mb-4 opacity-20" />
                  <p>Cole a URL para encontrar o anúncio.</p>
                </div>
              )}
              {searchResults.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl hover:border-zinc-700 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-zinc-800 rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
                      {item.thumbnail ? <img src={item.thumbnail} alt="thumb" className="w-full h-full object-cover" /> : <ImageIcon className="w-5 h-5 text-zinc-600" />}
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-white line-clamp-1">{item.title}</h4>
                      <div className="flex items-center gap-3 text-xs text-zinc-500 mt-1">
                        <span className="flex items-center gap-1"><Store className="w-3 h-3" /> {item.seller_name}</span>
                        <span className="text-emerald-400 font-medium text-sm">R$ {item.price?.toFixed(2).replace('.', ',')}</span>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => handleFollowAd(item)} className="shrink-0 px-3 py-1.5 bg-zinc-800 hover:bg-blue-600 hover:text-white text-zinc-300 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors border border-zinc-700 hover:border-blue-500">
                    <BookmarkPlus className="w-4 h-4" />
                    Adicionar
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
