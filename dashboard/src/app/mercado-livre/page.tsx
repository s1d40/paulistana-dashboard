"use client";
export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react';
import { fetchMLCampaigns, fetchBlingPedidos } from '@/services/supabase-service';
import { PackageOpen, TrendingUp, DollarSign, Activity, Search, Target, History, Clock, Radar, Zap, Truck, Tag, ChevronDown, RefreshCw, MapPin, ShieldCheck, ArrowDownToLine, Building2, Bot, BrainCircuit, X, Star, Download, Sparkles, Flame, LineChart as LineChartIcon, Plus } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

export default function MercadoLivreDashboard() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [categoryId, setCategoryId] = useState('');
  
  const ML_CATEGORIES = [
    { id: 'MLB247521', name: 'Chás e Ervas' },
    { id: 'MLB269723', name: 'Frutas Secas e Desidratadas' },
    { id: 'MLB272151', name: 'Castanhas e Amendoins' },
    { id: 'MLB269724', name: 'Sementes (Chia, Linhaça, etc)' },
    { id: 'MLB271071', name: 'Snacks Salgados' },
    { id: 'MLB439587', name: 'Açúcar e Adoçantes Naturais' },
    { id: 'MLB1403', name: 'Alimentos e Bebidas (Geral)' }
  ];

  const [spyResults, setSpyResults] = useState<any[]>([]);
  const [spyHistory, setSpyHistory] = useState<any[]>([]);
  const [spyLoading, setSpyLoading] = useState(false);
  const [spyError, setSpyError] = useState('');
  
  // Modos: 'realtime' | 'history' | 'radar' | 'insights' | 'watchlist' | 'trends' | 'funnel'
  const [viewMode, setViewMode] = useState<'realtime' | 'history' | 'radar' | 'insights' | 'watchlist' | 'trends' | 'funnel'>('radar');
  const [insightsData, setInsightsData] = useState<any[]>([]);
  const [insightsLoading, setInsightsLoading] = useState(false);

  // Pilar 1: Funil de Conversão
  const [funnelData, setFunnelData] = useState<any[]>([]);
  const [funnelLoading, setFunnelLoading] = useState(false);

  // Pilar 3: Trends & SEO IA
  const [trendsData, setTrendsData] = useState<any[]>([]);
  const [trendsLoading, setTrendsLoading] = useState(false);
  const [trendsOffset, setTrendsOffset] = useState(0);
  const [trendsTopTerms, setTrendsTopTerms] = useState<string[]>([]);

  // Histórico na Watchlist
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<any>(null);
  
  // Filtros do Insights
  const [insightsSearch, setInsightsSearch] = useState('');
  const [insightsNiche, setInsightsNiche] = useState('');
  const [insightsLimit, setInsightsLimit] = useState(10);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Review Sniper Modal
  const [sniperItem, setSniperItem] = useState<any>(null);
  const [sniperData, setSniperData] = useState<any[]>([]);
  const [sniperLoading, setSniperLoading] = useState(false);
  
  const [watchlistData, setWatchlistData] = useState<any[]>([]);
  const [watchlistLoading, setWatchlistLoading] = useState(false);
  const [watchlistSearch, setWatchlistSearch] = useState('');
  
  const [radarL1CategoryId, setRadarL1CategoryId] = useState('');
  const [radarL3CategoryId, setRadarL3CategoryId] = useState('');
  const radarCategoryId = radarL3CategoryId || radarL1CategoryId;
  const [trendsCategoryId, setTrendsCategoryId] = useState('');
  const [radarResults, setRadarResults] = useState<any[]>([]);
  const [radarLoading, setRadarLoading] = useState(false);
  const [radarLimit, setRadarLimit] = useState<number>(10);
  const [radarSearchTerm, setRadarSearchTerm] = useState('');
  const [radarSort, setRadarSort] = useState('relevance');
  const [radarFilterFull, setRadarFilterFull] = useState(true);

  const [mlCategoriesL1, setMlCategoriesL1] = useState<{id: string, name: string}[]>([]);

  useEffect(() => {
    fetch('/api/ml-spy/categories')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setMlCategoriesL1(data);
      })
      .catch(err => console.error("Erro ao buscar L1:", err));
  }, []);
  const [radarOffset, setRadarOffset] = useState(0);
  
  // Seleção de Concorrentes para Sinergia (Pilar 3)
  const [selectedRadarItems, setSelectedRadarItems] = useState<any[]>([]);

  // Pilar 2: Mineração Profunda (Copy & Reviews)
  const [analyzingItem, setAnalyzingItem] = useState<any>(null);
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Pilar 4: Comparador e Lista de Vigia
  const [myProducts, setMyProducts] = useState<any[]>([]);
  const [myProductsLoading, setMyProductsLoading] = useState(false);
  const [selectedMyProduct, setSelectedMyProduct] = useState<any>(null);

  const handleAnalyzeItem = async (item: any) => {
    setAnalyzingItem(item);
    setIsAnalyzing(true);
    setAnalysisData(null);
    try {
      const res = await fetch('/api/ml-spy/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item_id: item.id, item_title: item.title })
      });
      const data = await res.json();
      setAnalysisData(data);
    } catch (e) {
      console.error(e);
      alert('Erro ao analisar o anúncio.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleViewHistory = async (itemId: string, itemTitle: string) => {
    setSelectedHistoryItem({ id: itemId, title: itemTitle });
    setHistoryLoading(true);
    try {
      const res = await fetch(`/api/ml-spy/watchlist/history?item_id=${itemId}`);
      const data = await res.json();
      setHistoryData(data.history || []);
    } catch (e) {
      console.error(e);
      alert('Erro ao buscar histórico.');
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleMineWeaknesses = async (item: any) => {
    setSniperItem(item);
    setSniperLoading(true);
    setSniperData([]);
    try {
      const id = item.id || item.product_id || item.item_id;
      const res = await fetch(`/api/ml-spy/reviews?item_id=${id}`);
      const data = await res.json();
      const badReviews = (data.reviews || []).filter((r: any) => r.rate <= 3);
      setSniperData(badReviews);
    } catch (e) {
      console.error(e);
      alert('Erro ao minerar fraquezas.');
    } finally {
      setSniperLoading(false);
    }
  };

  const toggleSelection = (item: any) => {
    setSelectedRadarItems(prev => {
      if (prev.find(i => i.id === item.id)) {
        return prev.filter(i => i.id !== item.id);
      }
      return [...prev, item];
    });
  };

  const sendToArchitect = () => {
    if (selectedRadarItems.length === 0) return;
    localStorage.setItem('ml_competitors', JSON.stringify(selectedRadarItems));
    window.location.href = '/conteudo/chat'; // force full reload to pick up localstorage in chat page early effect
  };

  const exportToCSV = () => {
    if (radarResults.length === 0) return;
    const headers = ['Rank', 'ID', 'Titulo', 'Marca', 'Categoria', 'Preco', 'Preco_Original', 'Desconto_Pct', 'Avaliacao', 'Qtd_Avaliacoes', 'Vendas_Estimadas', 'Faturamento_Estimado', 'Frete_Gratis', 'FULL', 'Localizacao', 'Garantia', 'Link'];
    const csvContent = [
      headers.join(','),
      ...radarResults.map(item => {
        return [
          item.rank,
          item.id,
          `"${item.title.replace(/"/g, '""')}"`,
          `"${item.brand}"`,
          `"${item.seller_category}"`,
          item.price,
          item.original_price || item.price,
          item.discount_percentage || 0,
          item.rating_average || 0,
          item.reviews_count || 0,
          item.estimated_sales || 0,
          item.estimated_revenue || 0,
          item.shipping?.free_shipping ? 'Sim' : 'Nao',
          item.shipping?.tags?.includes('fulfillment') ? 'Sim' : 'Nao',
          `"${item.location}"`,
          `"${item.warranty}"`,
          item.permalink
        ].join(',');
      })
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `radar_concorrencia_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const loadTrendsSuggestions = async (offset = 0) => {
    setTrendsLoading(true);
    try {
      const res = await fetch(`/api/ml-spy/trends-suggestions?offset=${offset}&limit=5`);
      const data = await res.json();
      if (data.results) {
        setTrendsData(prev => offset === 0 ? data.results : [...prev, ...data.results]);
        setTrendsOffset(data.nextOffset || (offset + 5));
        if (data.results[0] && data.results[0].topTrends) {
          setTrendsTopTerms(data.results[0].topTrends);
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setTrendsLoading(false);
    }
  };

  const sendToWatchlist = async () => {
    if (selectedRadarItems.length === 0) return;
    try {
      const res = await fetch('/api/ml-spy/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: selectedRadarItems,
          my_product_id: selectedMyProduct ? selectedMyProduct.id : null
        })
      });
      const data = await res.json();
      if (res.ok) {
        alert('Concorrentes adicionados à Lista de Vigia com sucesso! O monitoramento diário foi ativado e amanhã já teremos os primeiros gráficos.');
        setSelectedRadarItems([]); // Clear selection after adding
        // Auto-refetch to update UI
        fetch('/api/ml-spy/watchlist').then(r => r.json()).then(d => { if(d.results) setWatchlistData(d.results) });
      } else {
        alert('Erro ao adicionar à Lista de Vigia: ' + data.error);
      }
    } catch (error) {
      alert('Falha na conexão com o servidor.');
    }
  };

  useEffect(() => {
    async function loadData() {
      const [campData, pedData] = await Promise.all([
        fetchMLCampaigns(),
        fetchBlingPedidos()
      ]);
      setCampaigns(campData || []);
      setPedidos(pedData || []);
      setLoading(false);
    }
    loadData();
  }, []);

  // Busca do Radar Direto no Frontend (Bypass WAF)
  const fetchRadarData = async (limit: number = radarLimit, term: string = radarSearchTerm, sort: string = radarSort, offset: number = radarOffset) => {
    if (!term && !radarCategoryId) return; // Só bloqueia se nao tiver os dois
    setRadarLoading(true);
    if (term && offset === 0) setMyProductsLoading(true);

    try {
      if (term && offset === 0) {
        fetch(`/api/ml-spy/my-items?q=${encodeURIComponent(term)}`)
          .then(res => res.json())
          .then(data => {
            if (data.results) {
              setMyProducts(data.results);
              if (data.results.length > 0) setSelectedMyProduct(data.results[0]);
              else setSelectedMyProduct(null);
            }
          })
          .finally(() => setMyProductsLoading(false));
      } else if (!term && offset === 0) {
        setMyProducts([]);
        setSelectedMyProduct(null);
      }

      // 1. Chama a nossa API que faz o trabalho sujo (lê os produtos e itens direto da API do ML com Token)
      const catQuery = radarCategoryId ? `&category=${radarCategoryId}` : '';
      const fullQuery = `&full=${radarFilterFull}`;
      const res = await fetch(`/api/ml-spy?limit=${limit}&offset=${offset}&q=${encodeURIComponent(term)}&sort=${sort}${catQuery}${fullQuery}`);
      const data = await res.json();
      
      if (data.results && data.results.length > 0) {
        if (offset > 0) {
          setRadarResults(prev => {
            const newResults = [...prev];
            data.results.forEach((newItem: any) => {
              if (!newResults.find(r => r.id === newItem.id)) {
                newResults.push(newItem);
              }
            });
            return newResults;
          });
        } else {
          setRadarResults(data.results);
        }
      } else {
        if (offset === 0) setRadarResults([]);
        if (data.error) console.error("API Error:", data.error);
      }
    } catch (e) {
      console.error("Erro ao buscar dados reais da concorrencia:", e);
      setRadarResults([]);
    } finally {
      setRadarLoading(false);
    }
  };

  useEffect(() => {
    if (viewMode === 'insights' && insightsData.length === 0) {
      setInsightsLoading(true);
      fetch('/api/ml-spy/cache')
        .then(res => res.json())
        .then(data => setInsightsData(data.results || []))
        .finally(() => setInsightsLoading(false));
    } else if (viewMode === 'funnel' && funnelData.length === 0) {
      setFunnelLoading(true);
      fetch('/api/ml-spy/funnel')
        .then(res => res.json())
        .then(data => setFunnelData(data.results || []))
        .catch(err => console.error(err))
        .finally(() => setFunnelLoading(false));
    } else if (viewMode === 'trends' && trendsData.length === 0) {
      loadTrendsSuggestions(0);
    } else if (viewMode === 'watchlist' && watchlistData.length === 0) {
      setWatchlistLoading(true);
      fetch('/api/ml-spy/watchlist')
        .then(res => res.json())
        .then(data => {
          if (data.results) setWatchlistData(data.results);
        })
        .catch(e => console.error(e))
        .finally(() => setWatchlistLoading(false));
    }
  }, [viewMode, insightsData.length, watchlistData.length]);

  useEffect(() => {
    if (viewMode === 'radar') {
      fetchRadarData(radarLimit, radarSearchTerm, radarSort, radarOffset);
    }
  }, [radarCategoryId, viewMode, radarLimit, radarSort, radarFilterFull, radarOffset]);


  const handleSpySearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!categoryId) return;
    
    setSpyLoading(true);
    setSpyError('');
    setSpyResults([]);
    setSpyHistory([]);

    try {
      if (viewMode === 'history') {
        const res = await fetch(`/api/ml-spy-history?category=${categoryId}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setSpyHistory(data.results || []);
      } else if (viewMode === 'realtime') {
        const res = await fetch(`/api/ml-spy?category=${categoryId}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setSpyResults(data.results || []);
      }
    } catch (err: any) {
      setSpyError(err.message);
    } finally {
      setSpyLoading(false);
    }
  };

  useEffect(() => {
    if (categoryId && viewMode !== 'radar') {
      handleSpySearch();
    }
  }, [viewMode]);

  const totalPedidos = pedidos.length;
  const receitaPedidos = pedidos.reduce((acc, p) => acc + (Number(p.total) || 0), 0);
  
  const metricsOverview = campaigns.reduce((acc, c) => {
    const metrics = c.metrics_summary || {};
    acc.cost += Number(metrics.cost || 0);
    acc.impressions += Number(metrics.prints || 0);
    acc.clicks += Number(metrics.clicks || 0);
    acc.revenue += Number(metrics.total_amount || 0);
    return acc;
  }, { cost: 0, impressions: 0, clicks: 0, revenue: 0 });

  const globalRoas = metricsOverview.cost > 0 
    ? (metricsOverview.revenue / metricsOverview.cost).toFixed(2) 
    : "0.00";

  const getKeywordCloud = () => {
    if (!radarResults || radarResults.length === 0) return [];
    const stopWords = ['de', 'a', 'o', 'que', 'e', 'do', 'da', 'em', 'um', 'para', 'com', 'não', 'uma', 'os', 'no', 'se', 'na', 'por', 'mais', 'as', 'dos', 'como', 'mas', 'foi', 'ao', 'ele', 'das', 'tem', 'à', 'seu', 'sua', 'ou', 'ser', 'quando', 'muito', 'há', 'nos', 'já', 'está', 'eu', 'também', 'só', 'pelo', 'pela', 'até', 'isso', 'ela', 'entre', 'era', 'depois', 'sem', 'mesmo', 'aos', 'ter', 'seus', 'quem', 'nas', 'me', 'esse', 'eles', 'estão', 'você', 'tinha', 'foram', 'essa', 'num', 'nem', 'suas', 'meu', 'às', 'minha', 'têm', 'numa', 'pelos', 'elas', 'havia', 'seja', 'qual', 'será', 'nós', 'tenho', 'lhe', 'deles', 'essas', 'esses', 'pelas', 'este', 'fosse', 'dele', 'tu', 'te', 'vocês', 'vos', 'lhes', 'meus', 'minhas', 'teu', 'tua', 'teus', 'tuas', 'nosso', 'nossa', 'nossos', 'nossas', 'dela', 'delas', 'esta', 'estes', 'estas', 'aquele', 'aquela', 'aqueles', 'aquelas', 'isto', 'aquilo', 'estou', 'estamos', 'estive', 'estivemos', 'estiveram', 'estava', 'estávamos', 'estavam', 'estivera', 'estivéramos', 'esteja', 'estejamos', 'estejam', 'estivesse', 'estivéssemos', 'estivessem', 'estiver', 'estivermos', 'estiverem', 'hei', 'há', 'havemos', 'hão', 'houve', 'houvemos', 'houveram', 'houvera', 'houvéramos', 'haja', 'hajamos', 'hajam', 'houvesse', 'houvéssemos', 'houvessem', 'houver', 'houvermos', 'houverem', 'houverei', 'houverá', 'houveremos', 'houverão', 'houveria', 'houveríamos', 'houveriam', 'sou', 'somos', 'são', 'era', 'éramos', 'eram', 'fui', 'foi', 'fomos', 'foram', 'fora', 'fôramos', 'seja', 'sejamos', 'sejam', 'fosse', 'fôssemos', 'fossem', 'for', 'formos', 'forem', 'serei', 'será', 'seremos', 'serão', 'seria', 'seríamos', 'seriam', 'tenho', 'tem', 'temos', 'tém', 'tinha', 'tínhamos', 'tinham', 'tive', 'teve', 'tivemos', 'tiveram', 'tivera', 'tivéramos', 'tenha', 'tenhamos', 'tenham', 'tivesse', 'tivéssemos', 'tivessem', 'tiver', 'tivermos', 'tiverem', 'terei', 'terá', 'teremos', 'terão', 'teria', 'teríamos', 'teriam', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', 'g', 'kg', 'ml', 'unidades', 'unidade', 'un', 'pct', 'premium', 'natural', 'puro', 'pura', 'pó', 'kit', 'pote', 'sabor', 'mg', 'com', 'sem', 'em', 'da', 'de', 'do'];
    
    const wordCounts: Record<string, number> = {};
    
    radarResults.forEach(item => {
      const words = item.title.toLowerCase().replace(/[^\w\sà-ú]/gi, '').split(/\s+/);
      words.forEach((word: string) => {
        if (word.length > 2 && !stopWords.includes(word)) {
          wordCounts[word] = (wordCounts[word] || 0) + 1;
        }
      });
    });

    return Object.entries(wordCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
  };

  return (
    <div className="p-4 md:p-8 w-full min-h-full bg-slate-950 text-slate-100">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-white mb-2">Market Intelligence</h1>
          <p className="text-slate-400">Integração Mercado Livre Ads e Vendas Bling</p>
        </div>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-slate-800 rounded-2xl"></div>)}
          </div>
          <div className="h-96 bg-slate-800 rounded-2xl"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-br from-indigo-900/40 to-slate-900 border border-indigo-500/20 rounded-2xl p-6 relative overflow-hidden group hover:border-indigo-500/40 transition-colors">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <DollarSign size={48} />
              </div>
              <p className="text-sm text-indigo-300 mb-2 font-medium">Investimento Ads</p>
              <p className="text-3xl font-bold text-white">R$ {metricsOverview.cost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>

            <div className="bg-gradient-to-br from-emerald-900/40 to-slate-900 border border-emerald-500/20 rounded-2xl p-6 relative overflow-hidden group hover:border-emerald-500/40 transition-colors">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <TrendingUp size={48} />
              </div>
              <p className="text-sm text-emerald-300 mb-2 font-medium">Receita Ads</p>
              <p className="text-3xl font-bold text-white">R$ {metricsOverview.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>

            <div className="bg-gradient-to-br from-amber-900/40 to-slate-900 border border-amber-500/20 rounded-2xl p-6 relative overflow-hidden group hover:border-amber-500/40 transition-colors">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Activity size={48} />
              </div>
              <p className="text-sm text-amber-300 mb-2 font-medium">ROAS Global</p>
              <p className="text-3xl font-bold text-white">{globalRoas}x</p>
            </div>

            <div className="bg-gradient-to-br from-cyan-900/40 to-slate-900 border border-cyan-500/20 rounded-2xl p-6 relative overflow-hidden group hover:border-cyan-500/40 transition-colors">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <PackageOpen size={48} />
              </div>
              <p className="text-sm text-cyan-300 mb-2 font-medium">Vendas ERP (Bling)</p>
              <p className="text-3xl font-bold text-white">R$ {receitaPedidos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              <p className="text-xs text-cyan-400 mt-1">{totalPedidos} pedidos recentes</p>
            </div>
          </div>

          {/* Nova Seção: Inteligência e Radar */}
          <div className="mb-8 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
              <div className="flex items-center gap-3">
                <Target className="text-rose-500" />
                <h2 className="text-xl font-bold text-white">Inteligência Competitiva</h2>
              </div>
              
              <div className="flex flex-wrap md:flex-nowrap bg-slate-950/80 backdrop-blur-md rounded-xl p-1.5 border border-slate-800/60 shadow-inner gap-1">
                <button 
                  onClick={() => setViewMode('radar')}
                  className={`flex-1 md:flex-none px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2.5 transition-all duration-300 ${viewMode === 'radar' ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-[0_0_15px_rgba(245,158,11,0.3)]' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}
                >
                  <Radar className="w-4 h-4" /> Radar
                </button>
                <button 
                  onClick={() => setViewMode('history')}
                  className={`flex-1 md:flex-none px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2.5 transition-all duration-300 ${viewMode === 'history' ? 'bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-[0_0_15px_rgba(243,62,118,0.3)]' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}
                >
                  <History className="w-4 h-4" /> Ranking
                </button>
                <button 
                  onClick={() => setViewMode('insights')}
                  className={`flex-1 md:flex-none px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2.5 transition-all duration-300 ${viewMode === 'insights' ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.3)]' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}
                >
                  <BrainCircuit className="w-4 h-4" /> Insights
                </button>
                <button 
                  onClick={() => setViewMode('watchlist')}
                  className={`flex-1 md:flex-none px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2.5 transition-all duration-300 ${viewMode === 'watchlist' ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}
                >
                  <Star className="w-4 h-4" /> Vigia
                </button>
                <button 
                  onClick={() => setViewMode('trends')}
                  className={`flex-1 md:flex-none px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2.5 transition-all duration-300 ${viewMode === 'trends' ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-[0_0_15px_rgba(249,115,22,0.3)]' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}
                >
                  <Flame className="w-4 h-4" /> Trends
                </button>
                <button 
                  onClick={() => setViewMode('funnel')}
                  className={`flex-1 md:flex-none px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2.5 transition-all duration-300 ${viewMode === 'funnel' ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-[0_0_15px_rgba(59,130,246,0.3)]' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}
                >
                  <LineChartIcon className="w-4 h-4" /> Funil (Pilar 1)
                </button>
              </div>
            </div>
            <div className="p-6">
                {/* RADAR PAULISTANA VIEW */}
              {viewMode === 'funnel' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <LineChartIcon className="w-5 h-5 text-blue-400" />
                        Funil de Conversão
                      </h2>
                      <p className="text-sm text-slate-400 mt-1">
                        Análise de Visitas vs Vendas dos últimos 30 dias para identificar piores conversores.
                      </p>
                    </div>
                  </div>

                  {funnelLoading ? (
                    <div className="flex flex-col items-center justify-center py-32 text-blue-400 bg-slate-900/50 rounded-2xl border border-slate-800">
                      <div className="relative w-16 h-16 mb-4">
                        <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
                      </div>
                      <span className="font-semibold text-lg">Mapeando Tráfego e Vendas no Mercado Livre...</span>
                      <p className="text-sm text-slate-500 mt-2">Isso pode levar alguns segundos dependendo da quantidade de anúncios.</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {funnelData.length > 0 && (
                        <div className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 shadow-xl">
                          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-6 flex items-center gap-2">
                            <Activity className="w-4 h-4 text-rose-500" /> TOP 5 Alertas Vermelhos (Mais Tráfego, Menos Venda)
                          </h3>
                          <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={funnelData.slice(0, 5)} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                <XAxis dataKey="title" stroke="#64748b" fontSize={10} tickFormatter={(val) => val.substring(0, 15) + '...'} />
                                <YAxis yAxisId="left" stroke="#60a5fa" fontSize={10} />
                                <YAxis yAxisId="right" orientation="right" stroke="#34d399" fontSize={10} />
                                <Tooltip 
                                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                                  itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                                />
                                <Legend wrapperStyle={{ fontSize: '12px' }} />
                                <Bar yAxisId="left" dataKey="visits_30d" name="Visitas (30d)" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={30} />
                                <Bar yAxisId="right" dataKey="sold_quantity" name="Vendas Totais" fill="#10b981" radius={[4, 4, 0, 0]} barSize={30} />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
                        {funnelData.map((item, idx) => {
                          const isDanger = idx < 5;
                          return (
                            <div key={item.id} className={`bg-slate-900 p-5 rounded-2xl border ${isDanger ? 'border-rose-500/40 shadow-[0_0_20px_rgba(244,63,94,0.1)]' : 'border-slate-800'} flex flex-col gap-4 relative group hover:-translate-y-1 transition-all duration-300`}>
                              
                              <div className="flex gap-4 items-start">
                                <div className="relative">
                                  <img src={item.thumbnail} alt="" className="w-24 h-24 object-cover rounded-xl shadow-lg border border-slate-700/50" />
                                  <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-slate-950 border border-slate-800 text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap text-slate-300 font-mono">
                                    {item.id}
                                  </div>
                                </div>
                                <div className="flex-1 min-w-0 pt-1">
                                  <h3 className="text-sm font-bold text-white line-clamp-2 leading-tight" title={item.title}>{item.title}</h3>
                                  <p className="text-xs font-semibold text-emerald-400 mt-2 flex items-center gap-1">
                                    <DollarSign className="w-3 h-3" /> {item.price.toFixed(2)}
                                  </p>
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-3 mt-2">
                                <div className="bg-slate-950/50 rounded-xl p-3 border border-slate-800/50">
                                  <div className="flex justify-between items-center mb-1">
                                    <span className="text-xs text-slate-400 flex items-center gap-1"><Search className="w-3 h-3 text-blue-400" /> Visitas</span>
                                    <span className="text-sm font-black text-white">{item.visits_30d}</span>
                                  </div>
                                  <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2">
                                    <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${Math.min(100, (item.visits_30d / 500) * 100)}%` }}></div>
                                  </div>
                                </div>
                                
                                <div className="bg-slate-950/50 rounded-xl p-3 border border-slate-800/50">
                                  <div className="flex justify-between items-center mb-1">
                                    <span className="text-xs text-slate-400 flex items-center gap-1"><PackageOpen className="w-3 h-3 text-emerald-400" /> Vendas</span>
                                    <span className="text-sm font-black text-white">{item.sold_quantity}</span>
                                  </div>
                                  <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2">
                                    <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${Math.min(100, (item.sold_quantity / 100) * 100)}%` }}></div>
                                  </div>
                                </div>
                              </div>

                              <div className="mt-2 flex items-center justify-between border-t border-slate-800 pt-4">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-slate-400">Saúde:</span>
                                  <span className={`text-xs font-black px-2 py-1 rounded-md ${item.health === 100 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                                    {item.health}%
                                  </span>
                                </div>
                                {isDanger ? (
                                  <span className="flex items-center gap-1 text-[11px] font-bold text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-full border border-rose-500/20">
                                    <ArrowDownToLine className="w-3 h-3" /> Fuga de Vendas
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1 text-[11px] font-bold text-slate-400 bg-slate-800 px-2.5 py-1 rounded-full">
                                    <ShieldCheck className="w-3 h-3 text-emerald-500" /> Otimizado
                                  </span>
                                )}
                              </div>
                              
                            </div>
                          );
                        })}
                      </div>
                      
                      {funnelData.length === 0 && (
                        <div className="text-center py-12 text-slate-400">
                          Nenhum dado encontrado para o funil.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {viewMode === 'radar' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {/* BARRA DE PESQUISA AVANÇADA */}
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-6">
                    <form 
                      onSubmit={(e) => { e.preventDefault(); setRadarOffset(0); fetchRadarData(radarLimit, radarSearchTerm, radarSort, 0); }}
                      className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-4 items-end"
                    >
                      <div className="xl:col-span-4 w-full">
                        <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Termo de Busca Livre</label>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                          <input
                            type="text"
                            placeholder="Ex: Chá Verde, Castanha..."
                            value={radarSearchTerm}
                            onChange={(e) => setRadarSearchTerm(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                          />
                        </div>
                      </div>

                      <div className="xl:col-span-2 w-full">
                        <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Departamento (L1)</label>
                        <select
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white font-medium focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all cursor-pointer"
                          value={radarL1CategoryId}
                          onChange={(e) => { setRadarLimit(10); setRadarL1CategoryId(e.target.value); }}
                        >
                          <option value="">🌎 Global (Todas)</option>
                          {mlCategoriesL1.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="xl:col-span-2 w-full">
                        <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Nicho (L3)</label>
                        <select
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white font-medium focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all cursor-pointer"
                          value={radarL3CategoryId}
                          onChange={(e) => { setRadarLimit(10); setRadarL3CategoryId(e.target.value); }}
                        >
                          <option value="">Nenhum Nicho Específico</option>
                          {ML_CATEGORIES.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="xl:col-span-2 w-full">
                        <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Ordenação</label>
                        <select
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white font-medium focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all cursor-pointer"
                          value={radarSort}
                          onChange={(e) => { setRadarSort(e.target.value); setRadarOffset(0); }}
                        >
                          <option value="relevance">Mais Relevantes (Padrão)</option>
                          <option value="price_asc">Menor Preço</option>
                          <option value="price_desc">Maior Preço</option>
                        </select>
                      </div>

                      <div className="xl:col-span-2 w-full flex flex-col gap-3">
                        <div className="w-full flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 cursor-pointer hover:border-emerald-500 transition-all" onClick={() => { setRadarFilterFull(!radarFilterFull); setRadarOffset(0); }}>
                           <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors shrink-0 ${radarFilterFull ? 'bg-emerald-500 border-emerald-500 text-emerald-950' : 'border-slate-600 text-transparent'}`}>
                              <svg viewBox="0 0 24 24" fill="none" className="w-3 h-3" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                           </div>
                           <span className="text-xs font-medium text-white flex items-center gap-1"><Zap className="w-3 h-3 text-emerald-500" /> FULL</span>
                        </div>
                        <button
                          type="submit"
                          disabled={radarLoading}
                          className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          <RefreshCw className={`w-4 h-4 ${radarLoading ? 'animate-spin' : ''}`} />
                          Buscar
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* TOP METRICS / ESTATÍSTICAS */}
                  {radarResults.length > 0 && (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500">
                            <DollarSign className="w-6 h-6" />
                          </div>
                          <div>
                            <p className="text-xs text-slate-400 font-medium">Preço Médio (Top {radarResults.length})</p>
                            <p className="text-xl font-bold text-white">R$ {(radarResults.reduce((acc, r) => acc + r.price, 0) / radarResults.length).toFixed(2)}</p>
                          </div>
                        </div>
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                            <Zap className="w-6 h-6" />
                          </div>
                          <div>
                            <p className="text-xs text-slate-400 font-medium">Dominância de FULL</p>
                            <p className="text-xl font-bold text-white">{Math.round((radarResults.filter(r => r.shipping?.tags?.includes('fulfillment')).length / radarResults.length) * 100)}%</p>
                          </div>
                        </div>
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                            <Truck className="w-6 h-6" />
                          </div>
                          <div>
                            <p className="text-xs text-slate-400 font-medium">Oferece Frete Grátis</p>
                            <p className="text-xl font-bold text-white">{Math.round((radarResults.filter(r => r.shipping?.free_shipping).length / radarResults.length) * 100)}%</p>
                          </div>
                        </div>
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-center gap-2">
                          <p className="text-xs text-slate-400 font-medium uppercase text-center mb-1">Ações / Amostragem</p>
                          <div className="flex justify-center gap-2">
                            <div className="flex bg-slate-950 rounded-lg border border-slate-800 p-1 w-fit">
                              {[10, 25, 50].map((num) => (
                                <button
                                  key={num}
                                  onClick={() => { setRadarLimit(num); setRadarOffset(0); fetchRadarData(num, radarSearchTerm, radarSort, 0); }}
                                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${radarLimit === num ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'}`}
                                >
                                  Top {num}
                                </button>
                              ))}
                            </div>
                            <button onClick={exportToCSV} className="bg-slate-950 rounded-lg border border-slate-800 px-3 flex items-center gap-2 hover:border-amber-500 hover:text-amber-400 transition-colors text-slate-400 text-xs font-bold" title="Exportar resultados para Excel (CSV)">
                              <Download className="w-4 h-4" /> CSV
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* MEU PRODUTO DE REFERENCIA */}
                      {myProducts.length > 0 && (
                        <div className="bg-slate-900 border border-amber-500/50 rounded-2xl p-4 mb-6 flex flex-col md:flex-row items-center gap-4 animate-in fade-in">
                          <div className="flex items-center gap-3 shrink-0">
                            <div className="w-10 h-10 bg-amber-500/10 rounded-full flex items-center justify-center">
                              <Target className="w-5 h-5 text-amber-500" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-white">Seu Anúncio (Referência)</p>
                              <p className="text-xs text-slate-400">Comparando preços contra:</p>
                            </div>
                          </div>
                          <div className="flex-1 w-full">
                            <select 
                              className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-sm text-white focus:outline-none focus:border-amber-500"
                              value={selectedMyProduct?.id || ''}
                              onChange={(e) => {
                                const p = myProducts.find(x => x.id === e.target.value);
                                if (p) setSelectedMyProduct(p);
                              }}
                            >
                              {myProducts.map(p => (
                                <option key={p.id} value={p.id}>{p.title} - R$ {p.price.toFixed(2)}</option>
                              ))}
                            </select>
                          </div>
                          {selectedMyProduct && (
                            <div className="shrink-0 flex items-center gap-4 bg-slate-950 px-4 py-2 rounded-xl border border-slate-800">
                              <img src={selectedMyProduct.thumbnail} alt="thumb" className="w-8 h-8 rounded bg-white p-0.5 object-contain" />
                              <div className="text-right">
                                 <p className="text-xs text-slate-400">Seu Preço</p>
                                 <p className="text-lg font-black text-amber-400">R$ {selectedMyProduct.price.toFixed(2)}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Pilar 1: Nuvem de Palavras-Chave (SEO) */}
                      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-6 flex flex-col md:flex-row items-center gap-4">
                         <div className="flex items-center gap-2 shrink-0 md:w-1/4">
                           <Tag className="w-5 h-5 text-purple-500" />
                           <div>
                             <p className="text-sm font-bold text-white">Nuvem de SEO</p>
                             <p className="text-xs text-slate-400">Termos mais usados na 1ª página</p>
                           </div>
                         </div>
                         <div className="flex-1 flex flex-wrap gap-2">
                            {getKeywordCloud().map(([word, count]) => (
                               <div key={word} className="flex items-center gap-1.5 bg-slate-950 border border-purple-500/20 rounded-full px-3 py-1">
                                  <span className="text-sm font-black text-purple-300">{word}</span>
                                  <span className="text-[10px] bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded-full font-bold">{count}x</span>
                               </div>
                            ))}
                         </div>
                      </div>
                    </>
                  )}

                  {/* CARDS DETALHADOS (CLONE NUBIMETRICS) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {radarResults.map((item, index) => {
                      const isFull = item.shipping?.tags?.includes('fulfillment');
                      const isFreeShipping = item.shipping?.free_shipping;
                      const isCatalog = !!item.catalog_product_id;
                      const isSelected = selectedRadarItems.some(i => i.id === item.id);

                      return (
                        <div key={item.id} className={`bg-slate-900 border ${isSelected ? 'border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]' : 'border-slate-800'} rounded-2xl overflow-hidden hover:border-amber-500/50 transition-all flex flex-col relative`}>
                          {/* Checkbox Pilar 3 */}
                          <div className="absolute top-3 left-3 z-20">
                            <button onClick={() => toggleSelection(item)} className={`w-6 h-6 rounded flex items-center justify-center border transition-all ${isSelected ? 'bg-amber-500 border-amber-500 text-amber-950' : 'bg-slate-800/80 border-slate-600 text-transparent hover:border-amber-500/50 backdrop-blur-sm'}`}>
                               <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                            </button>
                          </div>

                          {/* Top Tag */}
                          <div className="absolute top-0 right-0 bg-amber-500 text-amber-950 font-black px-4 py-1 rounded-bl-2xl z-10 text-sm">
                            #{item.rank}
                          </div>

                          <div className="flex p-4 gap-4 border-b border-slate-800/50">
                            <div className="w-24 h-24 bg-white rounded-xl flex items-center justify-center p-2 shrink-0 ml-4 mt-2">
                              {item.thumbnail ? (
                                <img src={item.thumbnail.replace('-I.jpg', '-O.jpg')} alt={item.title} className="max-w-full max-h-full object-contain" />
                              ) : (
                                <div className="text-slate-500 text-xs">Sem Foto</div>
                              )}
                            </div>
                            
                            <div className="flex-1 min-w-0 mt-4">
                              <p className="text-slate-200 text-sm font-medium line-clamp-2 mb-1" title={item.title}>{item.title}</p>
                              <div className="flex items-center gap-2 mb-2">
                                <span className="px-2 py-0.5 bg-slate-800 text-slate-300 text-xs rounded-full border border-slate-700">{item.brand || 'Genérico'}</span>
                                {item.discount_percentage > 0 && (
                                  <span className="px-2 py-0.5 bg-rose-500/10 text-rose-400 text-xs font-bold rounded-full border border-rose-500/20">-{item.discount_percentage}% OFF</span>
                                )}
                              </div>
                              <div className="flex items-baseline gap-2">
                                <p className="text-2xl font-black text-white">R$ {item.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                {item.original_price && item.original_price > item.price && (
                                  <p className="text-xs text-slate-500 line-through">R$ {item.original_price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                )}
                              </div>
                              {selectedMyProduct && (
                                <div className="mt-1">
                                  {item.price > selectedMyProduct.price ? (
                                    <span className="inline-block px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold rounded-full border border-emerald-500/20">
                                      Você está R$ {(item.price - selectedMyProduct.price).toFixed(2)} mais barato
                                    </span>
                                  ) : item.price < selectedMyProduct.price ? (
                                    <span className="inline-block px-2 py-0.5 bg-rose-500/10 text-rose-400 text-[10px] font-bold rounded-full border border-rose-500/20">
                                      Você está R$ {(selectedMyProduct.price - item.price).toFixed(2)} mais caro
                                    </span>
                                  ) : (
                                    <span className="inline-block px-2 py-0.5 bg-slate-800 text-slate-400 text-[10px] font-bold rounded-full border border-slate-700">
                                      Mesmo preço
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                            
                            {/* INTELIGÊNCIA DE VENDAS */}
                            {(item.reviews_count > 0 || item.estimated_sales > 0) && (
                              <div className="mt-3 pt-3 border-t border-slate-800/50 flex flex-col gap-2">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-1">
                                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                                    <span className="text-xs font-bold text-white">{item.rating_average?.toFixed(1) || '0.0'}</span>
                                    <span className="text-[10px] text-slate-500">({item.reviews_count})</span>
                                  </div>
                                  <div className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20" title="Vendas Estimadas (Baseado nas avaliações)">
                                    ~{item.estimated_sales} vendas
                                  </div>
                                </div>
                                <div className="bg-slate-950/50 p-2 rounded-lg border border-slate-800 flex items-center justify-between">
                                  <span className="text-[10px] text-slate-400 font-bold uppercase">Fat. Estimado</span>
                                  <span className="text-xs font-black text-emerald-400">
                                    R$ {(item.estimated_revenue || 0).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                                  </span>
                                </div>
                              </div>
                            )}

                          </div>

                          <div className="p-4 grid grid-cols-2 gap-3 bg-slate-950/50 flex-1">
                            {/* Localização e Logística */}
                            <div className="flex items-start gap-2">
                              <MapPin className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
                              <div>
                                <p className="text-xs text-slate-500 font-medium">Origem</p>
                                <p className="text-xs text-slate-300 line-clamp-1" title={item.location}>{item.location}</p>
                              </div>
                            </div>
                            <div className="flex items-start gap-2">
                              <ShieldCheck className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
                              <div>
                                <p className="text-xs text-slate-500 font-medium">Garantia</p>
                                <p className="text-xs text-slate-300 line-clamp-1" title={item.warranty}>{item.warranty}</p>
                              </div>
                            </div>
                            <div className="flex items-start gap-2 col-span-2 mt-2">
                              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider shrink-0 mt-0.5">CAT:</span>
                              <p className="text-xs text-amber-400 line-clamp-1 font-medium" title={item.seller_category}>{item.seller_category || 'Não informada'}</p>
                            </div>
                            <div className="flex items-start gap-2 col-span-2 mt-2">
                              <Building2 className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
                              <div className="flex flex-wrap gap-2">
                                {isFull && <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-500/20">⚡ FULL</span>}
                                {isFreeShipping && <span className="bg-indigo-500/10 text-indigo-400 text-[10px] font-bold px-2 py-0.5 rounded border border-indigo-500/20">🚚 FRETE GRÁTIS</span>}
                                {isCatalog && <span className="bg-purple-500/10 text-purple-400 text-[10px] font-bold px-2 py-0.5 rounded border border-purple-500/20">🏷️ CATÁLOGO</span>}
                                {!isFull && !isFreeShipping && !isCatalog && <span className="bg-slate-800 text-slate-400 text-[10px] font-bold px-2 py-0.5 rounded border border-slate-700">ORGÂNICO PADRÃO</span>}
                              </div>
                            </div>
                          </div>

                          <div className="p-3 border-t border-slate-800/50 bg-slate-900 grid grid-cols-4 gap-2">
                             <button onClick={() => handleMineWeaknesses(item)} className="flex items-center justify-center gap-2 py-2 text-[10px] sm:text-xs font-bold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 rounded-lg transition-colors" title="Minerar Ponto Fraco (Reviews de 1-3 estrelas)">
                              <Target className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Sniper</span>
                             </button>
                             <button onClick={() => handleAnalyzeItem(item)} className="flex items-center justify-center gap-2 py-2 text-[10px] sm:text-xs font-bold text-purple-400 bg-purple-500/10 hover:bg-purple-500/20 rounded-lg transition-colors">
                              {isAnalyzing && analyzingItem?.id === item.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <BrainCircuit className="w-3.5 h-3.5" />} 
                              <span className="hidden sm:inline">Destrinchar</span>
                            </button>
                            <a href={`https://lista.mercadolivre.com.br/_CustId_${item.seller_id}`} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 py-2 text-[10px] sm:text-xs font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors">
                              <Target className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Loja</span>
                            </a>
                            <a href={item.permalink} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 py-2 text-[10px] sm:text-xs font-bold text-amber-500 bg-amber-500/10 hover:bg-amber-500/20 rounded-lg transition-colors">
                              <ArrowDownToLine className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Anúncio</span>
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  {radarResults.length > 0 && radarResults.length % radarLimit === 0 && (
                    <div className="mt-8 flex justify-center">
                      <button 
                        onClick={() => {
                          const newOffset = radarOffset + radarLimit;
                          setRadarOffset(newOffset);
                        }}
                        disabled={radarLoading}
                        className="px-8 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg border border-slate-700"
                      >
                        {radarLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ArrowDownToLine className="w-4 h-4" />}
                        {radarLoading ? "Buscando..." : "Carregar Mais Produtos"}
                      </button>
                    </div>
                  )}

                  {radarResults.length === 0 && !radarLoading && (
                    <div className="text-center py-12 text-slate-500">Nenhum resultado encontrado para esta categoria.</div>
                  )}

                  {/* FLOATING ACTION BAR PARA SINERGIA */}
                  {selectedRadarItems.length > 0 && (
                    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur-xl border border-amber-500/30 p-4 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] z-50 flex items-center gap-6 animate-in slide-in-from-bottom-10 fade-in duration-300">
                       <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center border border-amber-500/30">
                             <span className="text-amber-500 font-black">{selectedRadarItems.length}</span>
                          </div>
                          <div>
                             <p className="text-white font-bold text-sm">Concorrentes Selecionados</p>
                             <p className="text-slate-400 text-xs">Prontos para engenharia reversa</p>
                          </div>
                       </div>
                       <button onClick={() => setSelectedRadarItems([])} className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-400 font-bold uppercase tracking-widest text-xs rounded-xl shadow-lg border border-slate-700 flex items-center gap-2 transition-all hover:text-white active:scale-95">
                          <X className="w-4 h-4" /> Limpar
                       </button>
                       <div className="h-8 w-px bg-slate-700"></div>
                       <button onClick={sendToArchitect} className="px-6 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-black uppercase tracking-widest text-xs rounded-xl shadow-lg flex items-center gap-2 transition-all hover:scale-105 active:scale-95">
                          <Bot className="w-4 h-4" /> Enviar para Arquiteto
                       </button>
                       <button onClick={sendToWatchlist} className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 font-black uppercase tracking-widest text-xs rounded-xl shadow-lg border border-slate-700 flex items-center gap-2 transition-all hover:scale-105 active:scale-95">
                          <Activity className="w-4 h-4" /> Vigiar Concorrentes
                       </button>
                    </div>
                  )}
                </div>
              )}

              {/* TRENDS VIEW */}
              {viewMode === 'trends' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 p-0 lg:p-6">
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Flame className="w-5 h-5 text-orange-500" />
                        Otimizador IA + Mercado Livre Trends
                      </h2>
                      <p className="text-sm text-slate-400 mt-1">
                        Cruzando seus produtos mais vendidos com os termos mais buscados hoje na categoria de Alimentos.
                      </p>
                    </div>
                  </div>

                  {trendsTopTerms.length > 0 && (
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex gap-3 overflow-x-auto custom-scrollbar whitespace-nowrap">
                       <span className="text-xs font-bold text-orange-500 uppercase tracking-wider flex items-center gap-1">
                         🔥 Em Alta Hoje:
                       </span>
                       {trendsTopTerms.map(t => (
                         <span key={t} className="text-xs font-semibold bg-slate-950 text-slate-300 px-3 py-1 rounded-full border border-slate-800">
                           {t}
                         </span>
                       ))}
                    </div>
                  )}

                  <div className="space-y-4">
                    {trendsData.map((item, idx) => (
                      <div key={`${item.id}-${idx}`} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row gap-5 items-start">
                        <div className="w-full md:w-1/3 border-r border-slate-800/50 pr-5">
                          <p className="text-[10px] text-slate-500 font-mono mb-1">{item.id} • {item.sold} vendas</p>
                          <h4 className="text-sm font-semibold text-slate-300 mb-2 line-clamp-3">
                            {item.title}
                          </h4>
                          <p className="text-sm font-bold text-emerald-400">R$ {item.price.toFixed(2)}</p>
                        </div>
                        <div className="w-full md:w-2/3">
                          <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4 mb-3">
                            <p className="text-xs text-orange-400 font-bold mb-1 uppercase tracking-wider flex items-center gap-1">
                              <Sparkles className="w-3 h-3" /> Sugestão da IA
                            </p>
                            <p className="text-sm font-bold text-white mb-2">
                              {item.suggestedTitle}
                            </p>
                            <p className="text-xs text-slate-400 italic border-t border-orange-500/10 pt-2">
                              " {item.reason} "
                            </p>
                          </div>
                          <button className="text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-lg transition-colors flex items-center gap-2">
                            Copiar Título Sugerido
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {trendsLoading && (
                    <div className="flex flex-col items-center justify-center py-12 text-orange-500 bg-slate-900/50 rounded-2xl border border-slate-800 border-dashed">
                      <div className="relative w-12 h-12 mb-4">
                        <div className="absolute inset-0 border-4 border-orange-500/20 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-orange-500 rounded-full border-t-transparent animate-spin"></div>
                      </div>
                      <span className="font-semibold">Otimizando anúncios com Inteligência Artificial...</span>
                    </div>
                  )}

                  {!trendsLoading && trendsData.length > 0 && (
                     <div className="flex justify-center pt-4">
                       <button 
                         onClick={() => loadTrendsSuggestions(trendsOffset)}
                         className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm rounded-xl transition-colors flex items-center gap-2 border border-slate-700"
                       >
                         <Plus className="w-4 h-4" /> Analisar Próximos 5 Anúncios
                       </button>
                     </div>
                  )}
                </div>
              )}

              {/* HISTORICO VIEW */}
              {viewMode === 'history' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <form onSubmit={handleSpySearch} className="flex gap-4 mb-8">
                    <div className="relative flex-1 max-w-md">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
                      <select 
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all cursor-pointer"
                        value={categoryId}
                        onChange={(e) => setCategoryId(e.target.value)}
                      >
                        <option value="">🌎 Todas as Categorias (Amplo)</option>
                        {ML_CATEGORIES.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>
                    <button 
                      type="submit" 
                      disabled={spyLoading || !categoryId}
                      className="px-6 py-3 rounded-xl font-medium text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 transition-colors"
                    >
                      {spyLoading ? "Buscando..." : "Ver Gráficos"}
                    </button>
                  </form>

                  {spyHistory.length === 0 && !spyLoading && categoryId ? (
                    <div className="text-center py-12 bg-slate-900/50 rounded-2xl border border-slate-800 border-dashed">
                      <Clock className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                      <h3 className="text-lg font-bold text-white mb-2">Sem histórico disponível</h3>
                      <p className="text-slate-400 max-w-md mx-auto">
                        Ainda não temos fotografias armazenadas para esta categoria.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                      {spyHistory.map((item) => (
                        <div key={item.product_id} className="bg-slate-950 border border-slate-800 rounded-xl p-6 flex flex-col md:flex-row gap-6">
                          <div className="w-full md:w-1/3 flex flex-col justify-between">
                            <div>
                              <div className="bg-white rounded-lg p-2 mb-4 w-24 h-24 flex items-center justify-center">
                                <img src={item.thumbnail.replace('-I.jpg', '-O.jpg')} alt={item.title} className="max-w-full max-h-full object-contain" />
                              </div>
                              <p className="text-slate-300 text-sm line-clamp-3 mb-2" title={item.title}>
                                {item.title}
                              </p>
                              <a href={item.permalink} target="_blank" className="text-rose-400 text-xs hover:underline">Ver Anúncio</a>
                            </div>
                            <div className="mt-4 pt-4 border-t border-slate-800">
                              <p className="text-xs text-slate-500">Amostras: {item.data.length} dias</p>
                            </div>
                          </div>
                          
                          <div className="w-full md:w-2/3 h-64 min-h-[250px]">
                            <ResponsiveContainer width="100%" height="100%" minHeight={250}>
                              <LineChart data={item.data}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickFormatter={(val) => new Date(val).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} />
                                <YAxis yAxisId="left" reversed={true} stroke="#fb7185" fontSize={10} domain={[1, 50]} label={{ value: 'Rank', angle: -90, position: 'insideLeft', fill: '#fb7185', fontSize: 10 }} />
                                <Tooltip 
                                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', fontSize: '12px' }}
                                  formatter={(value: any, name: any) => [name === 'rank' ? `#${value}` : `R$ ${value}`, name === 'rank' ? 'Posição' : 'Preço']}
                                />
                                <Legend wrapperStyle={{ fontSize: '10px' }}/>
                                <Line yAxisId="left" type="monotone" dataKey="rank" name="rank" stroke="#fb7185" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* INSIGHTS EM MASSA VIEW */}
              {viewMode === 'watchlist' && (
                <div className="p-6">
                  <div className="mb-6 flex justify-between items-center">
                    <div>
                      <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <Star className="w-5 h-5 text-emerald-500" /> Lista de Vigia Ativa
                      </h3>
                      <p className="text-sm text-slate-400">Anúncios que o robô monitora o preço e ranking diariamente.</p>
                    </div>
                  </div>

                  <div className="mb-6 relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Buscar na lista por título ou ID..."
                      value={watchlistSearch}
                      onChange={(e) => setWatchlistSearch(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                    />
                  </div>

                  {watchlistLoading ? (
                    <div className="text-center py-12">
                      <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin mx-auto mb-4" />
                      <p className="text-slate-400">Carregando lista de vigia...</p>
                    </div>
                  ) : watchlistData.length === 0 ? (
                    <div className="text-center py-12 bg-slate-900/50 rounded-2xl border border-slate-800 border-dashed">
                      <Star className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                      <h3 className="text-lg font-bold text-white mb-2">Sua lista está vazia</h3>
                      <p className="text-slate-400 max-w-md mx-auto">
                        Use a aba "Radar Paulistana", selecione os anúncios da concorrência e clique no botão "Acompanhar" para adicioná-los aqui.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                      {watchlistData
                        .filter(item => 
                          item.title.toLowerCase().includes(watchlistSearch.toLowerCase()) || 
                          item.product_id.toLowerCase().includes(watchlistSearch.toLowerCase())
                        )
                        .map((item) => (
                        <div key={item.product_id} className="bg-slate-950 border border-emerald-500/20 rounded-xl p-4 flex gap-4 hover:border-emerald-500/50 transition-colors">
                          <div className="w-20 h-20 bg-white rounded-lg p-1 shrink-0 flex items-center justify-center">
                            <img src={item.thumbnail} alt={item.title} className="max-w-full max-h-full object-contain" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-white line-clamp-2 mb-1" title={item.title}>
                              {item.title}
                            </h4>
                            <p className="text-xs text-slate-500 mb-2">ID: {item.product_id}</p>
                            {item.current_price && (
                              <p className="text-sm font-bold text-emerald-400 mb-2">R$ {item.current_price.toFixed(2)}</p>
                            )}
                            <div className="flex flex-wrap items-center gap-3">
                              <a href={item.permalink} target="_blank" rel="noreferrer" className="text-emerald-400 text-xs hover:underline inline-flex items-center gap-1">
                                Ver Meli <ArrowDownToLine className="w-3 h-3 -rotate-90" />
                              </a>
                              {item.seller_id && (
                                <a href={`https://perfil.mercadolivre.com.br/seller_id/${item.seller_id}`} target="_blank" rel="noreferrer" className="text-blue-400 text-xs hover:underline inline-flex items-center gap-1">
                                  Perfil Vendedor
                                </a>
                              )}
                              <button onClick={() => handleViewHistory(item.product_id, item.title)} className="text-indigo-400 text-xs hover:underline inline-flex items-center gap-1">
                                <LineChartIcon className="w-3 h-3" /> Gráfico
                              </button>
                              <button onClick={() => handleMineWeaknesses(item)} className="text-rose-400 text-xs hover:underline inline-flex items-center gap-1">
                                <Target className="w-3 h-3" /> Minerar Reclamação
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {viewMode === 'insights' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="bg-gradient-to-r from-purple-900/40 to-slate-900 border border-purple-500/30 rounded-2xl p-6 mb-8 flex flex-col md:flex-row items-center gap-6">
                    <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center shrink-0 border border-purple-500/30">
                      <BrainCircuit className="w-8 h-8 text-purple-400" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-white">Cache de Mineração em Massa</h2>
                      <p className="text-slate-400 mt-1">Este é o resultado do robô autônomo que varreu os 12 principais nichos do Empório (Azeites, Castanhas, Doces, etc).</p>
                    </div>
                  </div>

                  {insightsLoading ? (
                    <div className="flex justify-center py-20"><RefreshCw className="w-8 h-8 animate-spin text-purple-500" /></div>
                  ) : insightsData.length === 0 ? (
                    <div className="text-center py-20 text-slate-500">Nenhum dado em cache. Execute o script de mineração.</div>
                  ) : (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                          <h3 className="text-white font-bold mb-4">Faturamento Estimado por Nicho (Top 8)</h3>
                          <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart 
                                data={Object.values(insightsData.reduce((acc: any, item) => {
                                  const niche = item['Termo de Busca'];
                                  if (!acc[niche]) acc[niche] = { name: niche, revenue: 0, count: 0, priceSum: 0 };
                                  acc[niche].revenue += Number(item['Faturamento Estimado (R$)']) || 0;
                                  acc[niche].count += 1;
                                  acc[niche].priceSum += Number(item['Preco (R$)']) || 0;
                                  return acc;
                                }, {})).sort((a: any, b: any) => b.revenue - a.revenue).slice(0, 8)} 
                                layout="vertical" margin={{ left: 10, right: 20 }}
                              >
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                                <XAxis type="number" stroke="#64748b" tickFormatter={(val) => `R$${(val/1000).toFixed(0)}k`} />
                                <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={9} width={100} />
                                <Tooltip 
                                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }}
                                  formatter={(val: any) => [`R$ ${Number(val).toLocaleString('pt-BR')}`, 'Faturamento']}
                                />
                                <Bar dataKey="revenue" fill="#a855f7" radius={[0, 4, 4, 0]} />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>

                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                          <h3 className="text-white font-bold mb-4">Preço Médio por Nicho</h3>
                          <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart 
                                data={Object.values(insightsData.reduce((acc: any, item) => {
                                  const niche = item['Termo de Busca'];
                                  if (!acc[niche]) acc[niche] = { name: niche, count: 0, priceSum: 0 };
                                  acc[niche].count += 1;
                                  acc[niche].priceSum += Number(item['Preco (R$)']) || 0;
                                  return acc;
                                }, {})).map((n: any) => ({ ...n, avgPrice: n.priceSum / n.count })).sort((a: any, b: any) => b.avgPrice - a.avgPrice).slice(0, 10)} 
                                margin={{ top: 20 }}
                              >
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                <XAxis dataKey="name" stroke="#64748b" fontSize={9} tick={{ width: 60 }} interval={0} angle={-45} textAnchor="end" height={60} />
                                <YAxis stroke="#64748b" tickFormatter={(val) => `R$${val}`} />
                                <Tooltip 
                                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }}
                                  formatter={(val: any) => [`R$ ${Number(val).toFixed(2)}`, 'Preço Médio']}
                                />
                                <Bar dataKey="avgPrice" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col items-center">
                          <h3 className="text-white font-bold w-full text-left mb-4">Dominância de Logística</h3>
                          <div className="h-48 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie 
                                  data={[
                                    { name: 'FULL', value: insightsData.filter(i => i.FULL === 'Sim').length },
                                    { name: 'Orgânico', value: insightsData.filter(i => i.FULL !== 'Sim').length }
                                  ]} 
                                  cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value"
                                >
                                  {[{name: 'FULL'}, {name: 'Orgânico'}].map((entry, index) => <Cell key={`cell-${index}`} fill={['#10b981', '#334155'][index % 2]} />)}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }} />
                                <Legend />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                        </div>

                        <div className="col-span-2 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col h-[500px]">
                          <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex flex-col sm:flex-row justify-between gap-4">
                            <h3 className="text-white font-bold whitespace-nowrap pt-2">Ranking de Concorrentes</h3>
                            <div className="flex gap-2 w-full sm:w-auto">
                              <select 
                                className="bg-slate-950 border border-slate-700 text-xs text-white rounded-lg px-2 py-1 focus:outline-none"
                                value={insightsNiche}
                                onChange={e => setInsightsNiche(e.target.value)}
                              >
                                <option value="">Todos os Nichos</option>
                                {Array.from(new Set(insightsData.map((i: any) => i['Termo de Busca']).filter(Boolean))).map((niche: any) => (
                                  <option key={niche} value={niche}>{niche}</option>
                                ))}
                              </select>
                              <div className="relative w-full sm:w-48">
                                <Search className="w-3 h-3 absolute left-2 top-2.5 text-slate-400" />
                                <input 
                                  type="text" 
                                  placeholder="Buscar produto..."
                                  className="w-full bg-slate-950 border border-slate-700 text-xs text-white rounded-lg pl-7 pr-2 py-2 focus:outline-none"
                                  value={insightsSearch}
                                  onChange={e => setInsightsSearch(e.target.value)}
                                />
                              </div>
                            </div>
                          </div>
                          <div className="overflow-y-auto custom-scrollbar flex-1">
                            <table className="w-full text-left border-collapse whitespace-nowrap">
                              <thead className="text-xs uppercase text-slate-500 bg-slate-950/50 sticky top-0 backdrop-blur-sm z-10">
                                <tr>
                                  <th className="p-3 font-semibold">Anúncio</th>
                                  <th className="p-3 font-semibold">Nicho</th>
                                  <th className="p-3 text-right font-semibold">Preço</th>
                                  <th className="p-3 text-right font-semibold">Fat. Estimado</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-800/50">
                                {[...insightsData]
                                  .filter(p => !insightsNiche || p['Termo de Busca'] === insightsNiche)
                                  .filter(p => !insightsSearch || p.Titulo?.toLowerCase().includes(insightsSearch.toLowerCase()))
                                  .sort((a, b) => (Number(b['Faturamento Estimado (R$)']) || 0) - (Number(a['Faturamento Estimado (R$)']) || 0))
                                  .slice(0, insightsLimit)
                                  .map((p, i) => (
                                  <tr key={i} className="hover:bg-slate-800/40 transition-colors">
                                    <td className="p-3 text-sm text-amber-400 max-w-[200px] sm:max-w-[300px] truncate" title={p.Titulo}>
                                      <a href={p.Link} target="_blank" rel="noreferrer" className="hover:underline">{p.Titulo}</a>
                                    </td>
                                    <td className="p-3 text-xs text-slate-400">
                                      <span className="bg-slate-800 px-2 py-1 rounded-md">{p['Termo de Busca']}</span>
                                    </td>
                                    <td className="p-3 text-sm text-white text-right">R$ {Number(p['Preco (R$)']).toFixed(2)}</td>
                                    <td className="p-3 text-sm font-bold text-emerald-400 text-right">R$ {Number(p['Faturamento Estimado (R$)']).toLocaleString('pt-BR')}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                            {insightsData.length > 0 && insightsLimit < insightsData.length && (
                              <div className="p-4 text-center border-t border-slate-800/50">
                                <button 
                                  onClick={() => setInsightsLimit(prev => prev + 20)}
                                  className="text-xs font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-lg transition-colors"
                                >
                                  Carregar mais resultados
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
              <div className="p-6 border-b border-slate-800">
                <h2 className="text-lg font-bold text-white">Campanhas Ativas</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-400 uppercase bg-slate-900/50">
                    <tr>
                      <th className="px-6 py-4 font-medium">Campanha</th>
                      <th className="px-6 py-4 font-medium">Status</th>
                      <th className="px-6 py-4 font-medium text-right">ACOS Alvo</th>
                      <th className="px-6 py-4 font-medium text-right">ACOS Real</th>
                      <th className="px-6 py-4 font-medium text-right">Gasto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaigns.map((camp) => {
                      const metrics = camp.metrics_summary || {};
                      const realAcos = metrics.acos || 0;
                      return (
                        <tr key={camp.campaign_id} className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors">
                          <td className="px-6 py-4 font-medium text-white">{camp.name}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${camp.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                              {camp.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right text-slate-300">{camp.acos_target}%</td>
                          <td className="px-6 py-4 text-right">
                            <span className={`${realAcos > camp.acos_target ? 'text-rose-400' : 'text-emerald-400'}`}>
                              {Number(realAcos).toFixed(2)}%
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right text-slate-300">
                            R$ {Number(metrics.cost || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
              <div className="p-6 border-b border-slate-800">
                <h2 className="text-lg font-bold text-white">Últimos Pedidos</h2>
              </div>
              <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar">
                {pedidos.slice(0, 10).map((pedido) => (
                  <div key={pedido.id} className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-4 flex justify-between items-center hover:bg-slate-800/50 transition-colors">
                    <div>
                      <p className="font-bold text-white text-sm">Pedido #{pedido.numero}</p>
                      <p className="text-xs text-slate-400 mt-1">
                        {new Date(pedido.data).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-emerald-400">R$ {Number(pedido.total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Modal de Análise Profunda (Pilar 2) */}
          {analyzingItem && analysisData && !isAnalyzing && (
            <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 sm:p-8 animate-in fade-in">
              <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col max-h-full overflow-hidden">
                <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50 shrink-0">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-lg p-1">
                      <img src={analyzingItem.thumbnail} alt="Item" className="w-full h-full object-contain" />
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-white line-clamp-1">{analyzingItem.title}</h2>
                      <p className="text-slate-400 text-xs mt-1">Análise de Persuasão e Dores (Review Mining)</p>
                    </div>
                  </div>
                  <button onClick={() => setAnalyzingItem(null)} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 transition-colors">
                    <X className="w-6 h-6" />
                  </button>
                </div>
                
                <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-slate-950/50">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col items-center justify-center text-center">
                       <p className="text-xs font-medium text-slate-400 mb-1">Avaliação Média</p>
                       <p className="text-3xl font-black text-amber-400">{analysisData.rating_average?.toFixed(1) || '0.0'}</p>
                    </div>
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col items-center justify-center text-center">
                       <p className="text-xs font-medium text-slate-400 mb-1">Total de Reviews</p>
                       <p className="text-3xl font-black text-white">{analysisData.reviews_count || 0}</p>
                    </div>
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col items-center justify-center text-center">
                       <p className="text-xs font-medium text-slate-400 mb-1">Nota de Persuasão (IA)</p>
                       <p className="text-3xl font-black text-purple-400 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400">
                          {analysisData.ai_analysis?.toLowerCase().includes('não foi possível') ? '-' : 'A'}
                       </p>
                    </div>
                  </div>

                  <div className="bg-slate-900 border border-purple-500/30 rounded-2xl p-6 relative overflow-hidden mb-8">
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                      <BrainCircuit size={100} />
                    </div>
                    <div className="flex justify-between items-center mb-4 relative z-10">
                      <h3 className="text-lg font-black text-purple-400 flex items-center gap-2">
                         <BrainCircuit className="w-5 h-5" /> Inteligência de Engenharia Reversa
                      </h3>
                      <button 
                        onClick={async () => {
                          const { supabase } = await import('@/lib/supabase');
                          const title = `[ML] ${analyzingItem.title}`;
                          const desc = `Insights da IA para Roteiro de Vídeo:\n\n${analysisData.ai_analysis}\n\nProduto: ${analyzingItem.title}\nPreço: R$ ${analyzingItem.price}`;
                          
                          const { error } = await supabase.from('mural_ideias').insert([{
                            titulo: title,
                            descricao: desc,
                            status: 'ideia',
                            autor_nome: 'Inteligência de Mercado',
                            cor: 'purple',
                            posicao: 0
                          }]);
                          
                          if (!error) {
                            alert('Ideia enviada para o Mural da Equipe com sucesso! O Arquiteto de Conteúdo já pode transformar isso em um roteiro.');
                            window.location.href = '/board';
                          } else {
                            alert('Erro ao enviar para o mural: ' + error.message);
                          }
                        }}
                        className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold uppercase px-4 py-2 rounded-lg flex items-center gap-2 transition-all shadow-lg shadow-purple-500/20"
                      >
                        <Sparkles className="w-4 h-4" /> Transformar em Vídeo
                      </button>
                    </div>
                    <div className="prose prose-invert max-w-none text-sm text-slate-300 leading-relaxed marker:text-purple-500 prose-strong:text-white relative z-10">
                      {analysisData.ai_analysis ? (
                        <div dangerouslySetInnerHTML={{ __html: analysisData.ai_analysis.replace(/\n/g, '<br />').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                      ) : (
                        <p className="text-slate-500">A IA não retornou uma análise ou está desativada.</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2 border-b border-slate-800 pb-2">
                        Descrição Bruta (Copy do Anúncio)
                      </h3>
                      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 max-h-[300px] overflow-y-auto custom-scrollbar text-xs text-slate-400 whitespace-pre-wrap">
                        {analysisData.description || 'Descrição não disponível.'}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2 border-b border-slate-800 pb-2">
                        Amostragem de Reviews Reais
                      </h3>
                      <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                        {analysisData.raw_reviews?.length > 0 ? (
                          analysisData.raw_reviews.map((r: any, idx: number) => (
                            <div key={idx} className="bg-slate-900 border border-slate-800 rounded-xl p-3">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="flex text-amber-400 text-xs">
                                  {Array.from({length: r.rate}).map((_, i) => <span key={i}>★</span>)}
                                  {Array.from({length: 5 - r.rate}).map((_, i) => <span key={i} className="text-slate-700">★</span>)}
                                </div>
                              </div>
                              <p className="text-xs text-slate-300 italic">"{r.content}"</p>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-slate-500">Nenhum review encontrado na API do ML.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Modal de Histórico */}
          {selectedHistoryItem && (
            <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 sm:p-8 animate-in fade-in">
              <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col max-h-[80vh] overflow-hidden">
                <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50 shrink-0">
                  <h2 className="text-xl font-black text-white flex items-center gap-2"><LineChartIcon className="text-indigo-400" /> Histórico de "Guerra"</h2>
                  <button onClick={() => setSelectedHistoryItem(null)} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 transition-colors"><X className="w-6 h-6" /></button>
                </div>
                <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-slate-950/50">
                  {historyLoading ? (
                    <div className="flex justify-center py-12"><RefreshCw className="w-8 h-8 animate-spin text-indigo-500" /></div>
                  ) : historyData.length === 0 ? (
                    <p className="text-center text-slate-400">Nenhum dado de histórico coletado ainda pelo robô para este produto.</p>
                  ) : (
                    <div className="h-64 min-h-[300px]">
                      <ResponsiveContainer width="100%" height="100%" minHeight={300}>
                        <LineChart data={historyData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                          <XAxis dataKey="collected_at" stroke="#64748b" fontSize={10} tickFormatter={(val) => new Date(val).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} />
                          <YAxis yAxisId="left" reversed={true} stroke="#fb7185" fontSize={10} domain={[1, 'auto']} label={{ value: 'Rank', angle: -90, position: 'insideLeft', fill: '#fb7185', fontSize: 10 }} />
                          <YAxis yAxisId="right" orientation="right" stroke="#34d399" fontSize={10} domain={['auto', 'auto']} label={{ value: 'Preço', angle: -90, position: 'insideRight', fill: '#34d399', fontSize: 10 }} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', fontSize: '12px' }}
                            formatter={(value: any, name: any) => [name === 'price' ? `R$ ${value}` : `#${value}`, name === 'price' ? 'Preço' : 'Posição (Rank)']}
                          />
                          <Legend wrapperStyle={{ fontSize: '10px' }}/>
                          <Line yAxisId="left" type="monotone" dataKey="rank" name="rank" stroke="#fb7185" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                          <Line yAxisId="right" type="monotone" dataKey="price" name="price" stroke="#34d399" strokeWidth={3} dot={{ r: 4 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Modal do Sniper de Reviews */}
          {sniperItem && (
            <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 sm:p-8 animate-in fade-in">
              <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col max-h-[80vh] overflow-hidden">
                <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50 shrink-0">
                  <h2 className="text-xl font-black text-white flex items-center gap-2"><Target className="text-rose-500" /> Review Sniper (Fraquezas)</h2>
                  <button onClick={() => setSniperItem(null)} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 transition-colors"><X className="w-6 h-6" /></button>
                </div>
                <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-slate-950/50">
                  <div className="flex justify-between items-center mb-6">
                     <p className="text-slate-400 text-sm">Reclamações reais dos clientes (1 a 3 estrelas).</p>
                     <button 
                        onClick={async () => {
                          const { supabase } = await import('@/lib/supabase');
                          const title = `[Sniper] Abordar dor: ${sniperItem.title || sniperItem.product_id}`;
                          const text = sniperData.map(r => `"${r.content?.original || r.content}"`).join('\n\n');
                          const desc = `Reclamações do concorrente na plataforma:\n\n${text}\n\nSugestão: Criar roteiro que resolva estes exatos problemas!`;
                          const { error } = await supabase.from('mural_ideias').insert([{ titulo: title, descricao: desc, status: 'ideia', autor_nome: 'Review Sniper', cor: 'rose', posicao: 0 }]);
                          if (!error) { alert('Reclamações enviadas para o Mural de Ideias!'); window.location.href='/board'; } else alert('Erro.');
                        }}
                        disabled={sniperData.length === 0}
                        className="bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-bold uppercase px-4 py-2 rounded-lg flex items-center gap-2"
                     >
                        <Bot className="w-4 h-4" /> Criar Roteiro nas Dores
                     </button>
                  </div>
                  {sniperLoading ? (
                    <div className="flex justify-center py-12"><RefreshCw className="w-8 h-8 animate-spin text-rose-500" /></div>
                  ) : sniperData.length === 0 ? (
                    <p className="text-center text-slate-400 py-12">Nenhuma reclamação útil (abaixo de 4 estrelas) encontrada! Este concorrente deve ser muito bom.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {sniperData.map((r: any, idx: number) => (
                        <div key={idx} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex text-amber-400 text-xs">
                              {Array.from({length: r.rate}).map((_, i) => <span key={i}>★</span>)}
                              {Array.from({length: 5 - r.rate}).map((_, i) => <span key={i} className="text-slate-700">★</span>)}
                            </div>
                            <span className="text-[10px] text-slate-500">{new Date(r.date_created).toLocaleDateString()}</span>
                          </div>
                          <p className="text-sm text-slate-300 italic">"{r.content?.original || r.content}"</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
