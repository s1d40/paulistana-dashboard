'use client';
export const dynamic = 'force-dynamic';

import { useState, useMemo, Suspense, useEffect } from 'react';
import { FileText, Clock, CheckCircle2, ExternalLink, RefreshCcw, Loader2, PlayCircle, Plus, Share2, Sparkles, Layout, Video, Image as ImageIcon, Trash2 } from 'lucide-react';
import { ContentPost, deletePostFromSupabase } from '@/services/supabase-service';
import clsx from 'clsx';
import PostDetailModal from './components/post-detail-modal';
import { useQuery } from '@tanstack/react-query';
import { useContentFilters } from '@/hooks/use-content-filters';
import FiltersBar from './components/filters-bar';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

interface ParsedRoteiro {
  tipo: string;
  tema: string;
  gancho: string;
  cenasCount: number;
  hasCenas: boolean;
  isJson: boolean;
  plainText: string;
}

function parseRoteiro(roteiroRaw?: string): ParsedRoteiro {
  const result: ParsedRoteiro = {
    tipo: '',
    tema: '',
    gancho: '',
    cenasCount: 0,
    hasCenas: false,
    isJson: false,
    plainText: roteiroRaw || 'Nenhum roteiro gerado.'
  };

  if (!roteiroRaw || roteiroRaw.trim() === '' || roteiroRaw === '{}') {
    return result;
  }

  try {
    const parsed = JSON.parse(roteiroRaw);
    result.isJson = true;
    result.tipo = parsed.tipo_post || parsed.tipo || '';
    result.tema = parsed.tema || '';
    
    // Gancho extraction
    result.gancho = parsed.gancho || parsed.gancho_narrativo || parsed.hook || '';
    
    const cenas = parsed.cenas || parsed.roteiro || [];
    if (Array.isArray(cenas)) {
      result.cenasCount = cenas.length;
      result.hasCenas = cenas.length > 0;
      if (!result.gancho && cenas.length > 0) {
        const firstScene = cenas[0];
        result.gancho = firstScene.texto_narrado || firstScene.narracao || firstScene.texto_na_imagem || firstScene.caption || '';
      }
    }
  } catch (e) {
    result.isJson = false;
    result.plainText = roteiroRaw;
  }

  return result;
}

interface StatusTheme {
  color: string;
  text: string;
  border: string;
  borderHover: string;
  bg: string;
  glow: string;
  badgeText: string;
  pulse: boolean;
}

function getStatusTheme(status: string = 'Pendente'): StatusTheme {
  const s = status.toLowerCase().replace('_', ' ');
  
  if (s === 'postado' || s === 'publicado' || s === 'ok') {
    return {
      color: '#10b981',
      text: 'text-emerald-400',
      border: 'border-emerald-500/20',
      borderHover: 'hover:border-emerald-500/50',
      bg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
      glow: 'hover:shadow-emerald-500/10 shadow-emerald-500/5',
      badgeText: 'Publicado',
      pulse: false
    };
  }
  
  if (s === 'erro' || s === 'falha') {
    return {
      color: '#ef4444',
      text: 'text-red-400',
      border: 'border-red-500/20',
      borderHover: 'hover:border-red-500/50',
      bg: 'bg-red-500/10 border-red-500/20 text-red-400',
      glow: 'hover:shadow-red-500/10 shadow-red-500/5',
      badgeText: 'Erro',
      pulse: false
    };
  }
  
  if (
    s === 'gerando' || 
    s === 'processando' || 
    s === 'renderizando' || 
    s === 'testando' || 
    s.includes('gerar') ||
    s.includes('worker')
  ) {
    return {
      color: '#6366f1',
      text: 'text-indigo-400',
      border: 'border-indigo-500/20',
      borderHover: 'hover:border-indigo-500/50',
      bg: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400 animate-pulse',
      glow: 'hover:shadow-indigo-500/10 shadow-indigo-500/5',
      badgeText: status,
      pulse: true
    };
  }
  
  if (s.includes('revisão') || s.includes('revisar') || s === 'aprovado') {
    return {
      color: '#0ea5e9',
      text: 'text-sky-400',
      border: 'border-sky-500/20',
      borderHover: 'hover:border-sky-500/50',
      bg: 'bg-sky-500/10 border-sky-500/20 text-sky-400',
      glow: 'hover:shadow-sky-500/10 shadow-sky-500/5',
      badgeText: 'Aguardando Revisão',
      pulse: false
    };
  }

  return {
    color: '#f97316',
    text: 'text-orange-400',
    border: 'border-orange-500/20',
    borderHover: 'hover:border-orange-500/50',
    bg: 'bg-orange-500/10 border-orange-500/20 text-orange-400',
    glow: 'hover:shadow-orange-500/10 shadow-orange-500/5',
    badgeText: status || 'Pendente',
    pulse: false
  };
}

const fetchPosts = async (): Promise<ContentPost[]> => {
  const response = await fetch('/api/content');
  if (!response.ok) {
    throw new Error('Falha ao carregar conteúdo');
  }
  const data = await response.json();
  return data;
};

function ConteudoContent() {
  const { filters, updateFilters } = useContentFilters();
  const searchParams = useSearchParams();
  const postsPerPage = 12;

  const [activeTab, setActiveTab] = useState<'all' | 'video' | 'carrossel' | 'blog'>('all');

  // Modal de Detalhes
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

  useEffect(() => {
    const id = searchParams.get('id');
    if (id) {
      setSelectedPostId(id);
    }
  }, [searchParams]);

  const [isApproving, setIsApproving] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const { data: allPosts = [], isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['contentPosts'],
    queryFn: fetchPosts,
    refetchOnMount: 'always', // Sempre recarrega ao entrar na página
  });

  const handleRefresh = async () => {
    updateFilters({ page: 1 });
    await refetch();
  };

  const handleApprove = async (postId: string) => {
    if (!postId) return;
    
    setIsApproving(postId);
    try {
      const res = await fetch('/api/content/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId }),
      });

      if (!res.ok) throw new Error('Falha na requisição');
      
      alert('Solicitação de aprovação enviada ao n8n!');
    } catch (error) {
      console.error(error);
      alert('Erro ao enviar solicitação de aprovação.');
    } finally {
      setIsApproving(null);
    }
  };

  const handleRender = async (postId: string) => {
    if (!postId) return;
    
    setIsRendering(postId);
    try {
      const res = await fetch('/api/content/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId }),
      });

      if (!res.ok) throw new Error('Falha na requisição');
      
      alert('Renderização enviada ao n8n! O vídeo ficará pronto em instantes.');
    } catch (error) {
      console.error(error);
      alert('Erro ao enviar solicitação de renderização.');
    } finally {
      setIsRendering(null);
    }
  };

  const handleDelete = async (postId: string) => {
    const confirmDelete = window.confirm('Tem certeza que deseja excluir este post e seus dados associados permanentemente?');
    if (!confirmDelete) return;

    setIsDeleting(postId);
    try {
      await deletePostFromSupabase(postId);
      await refetch();
    } catch (err) {
      console.error(err);
      alert('Erro ao excluir post. Pode haver dependências no banco de dados.');
    } finally {
      setIsDeleting(null);
    }
  };

  // Lógica de Filtragem e Ordenação
  const filteredPosts = useMemo(() => {
    let result = [...allPosts];

    // Busca
    if (filters.searchQuery) {
      const q = filters.searchQuery.toLowerCase();
      result = result.filter(post => 
        post.titulo_post?.toLowerCase().includes(q) ||
        post.tema_post?.toLowerCase().includes(q) ||
        post.id_post?.toLowerCase().includes(q) ||
        post.captions?.toLowerCase().includes(q) ||
        post.roteiro_gerado?.toLowerCase().includes(q)
      );
    }

    // Status
    if (filters.status.length > 0) {
      result = result.filter(post => filters.status.includes(post.status || 'Pendente'));
    }

    // Plataforma / Tipo (Integrando com as novas abas)
    if (activeTab !== 'all') {
      result = result.filter(post => {
        const type = (post.tipo_post || '').toLowerCase();
        if (activeTab === 'video') return type.includes('video') || type.includes('tiktok');
        if (activeTab === 'carrossel') return type.includes('carrossel');
        if (activeTab === 'blog') return type.includes('blog');
        return true;
      });
    }

    if (filters.platform.length > 0) {
      result = result.filter(post => {
        const postPlatforms = (post.tipo_post || 'Instagram').split(',').map(s => s.trim());
        return filters.platform.some(p => postPlatforms.includes(p));
      });
    }

    // Ordenação
    result.sort((a, b) => {
      let valA: string | number = (a[filters.sortBy as keyof ContentPost] as string | number | undefined) || '';
      let valB: string | number = (b[filters.sortBy as keyof ContentPost] as string | number | undefined) || '';

      if (filters.sortBy === 'createdAt') {
        valA = new Date(a.data_criacao || 0).getTime();
        valB = new Date(b.data_criacao || 0).getTime();
      }

      if (filters.sortOrder === 'asc') {
        return valA > valB ? 1 : -1;
      } else {
        return valA < valB ? 1 : -1;
      }
    });

    return result;
  }, [allPosts, filters, activeTab]);

  const paginatedPosts = filteredPosts.slice(
    (filters.page - 1) * postsPerPage,
    filters.page * postsPerPage
  );

  const totalPages = Math.ceil(filteredPosts.length / postsPerPage);

  const loading = isLoading || isFetching;

  return (
    <main className="flex-1 bg-[#0c0a09] min-h-screen relative overflow-x-hidden font-sans selection:bg-orange-500/30">
      {/* Background Decorativo Dusk */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-900/20 blur-[120px] rounded-full opacity-50" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-900/10 blur-[120px] rounded-full opacity-50" />
        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-indigo-900/10 blur-[120px] rounded-full opacity-50" />
      </div>

      <div className="relative max-w-7xl mx-auto p-6 md:p-12 space-y-10">
        
        {/* Header Dusk */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-orange-500 to-purple-600 uppercase italic">
              CONTENT.
            </h1>
            <p className="text-zinc-500 text-lg font-medium max-w-xl">
              Orquestre seu ecossistema digital com <span className="text-zinc-300">Inteligência Artificial</span> e estética premium.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Link 
              href="/conteudo/publicar"
              className="group flex items-center gap-2 px-5 py-3 bg-zinc-900 border border-zinc-800 hover:border-indigo-500/50 text-zinc-400 hover:text-white rounded-2xl transition-all shadow-xl text-xs font-black uppercase tracking-widest"
            >
              <Share2 className="w-4 h-4 text-indigo-500 group-hover:scale-110 transition-transform" />
              Social Hub
            </Link>
            <Link 
              href="/conteudo/novo"
              className="flex items-center gap-2 px-6 py-3 bg-white hover:bg-zinc-200 text-black rounded-2xl transition-all shadow-xl shadow-white/5 text-xs font-black uppercase tracking-widest group"
            >
              <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
              Novo Post
            </Link>
            <button 
              onClick={handleRefresh}
              disabled={loading}
              className="p-3 bg-zinc-900 border border-zinc-800 rounded-2xl hover:bg-zinc-800 transition-all text-zinc-500 hover:text-orange-400 disabled:opacity-50"
            >
              <RefreshCcw className={clsx("w-5 h-5", loading && "animate-spin")} />
            </button>
          </div>
        </div>

        {/* Custom Tabs Navigation */}
        <div className="flex items-center gap-2 p-1.5 bg-zinc-900/50 border border-zinc-800/50 rounded-2xl w-fit backdrop-blur-xl">
          {[
            { id: 'all', label: 'Todos', icon: Layout },
            { id: 'video', label: 'Vídeos', icon: Video },
            { id: 'carrossel', label: 'Carrosséis', icon: ImageIcon },
            { id: 'blog', label: 'Blog', icon: FileText },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as 'all' | 'video' | 'carrossel' | 'blog');
                updateFilters({ page: 1 });
              }}
              className={clsx(
                "flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] transition-all",
                activeTab === tab.id 
                  ? "bg-zinc-800 text-white shadow-lg border border-zinc-700/50" 
                  : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              <tab.icon className={clsx("w-3.5 h-3.5", activeTab === tab.id ? "text-orange-500" : "text-zinc-600")} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Filters Bar Context */}
        <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-3xl p-2 backdrop-blur-sm">
          <FiltersBar />
        </div>

        {/* Status Legend Banner */}
        <div className="bg-zinc-900/40 border border-zinc-800/40 rounded-[2rem] p-5 md:p-6 backdrop-blur-xl flex flex-col lg:flex-row items-center justify-between gap-6 relative overflow-hidden shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 via-transparent to-indigo-500/5 pointer-events-none" />
          <div className="space-y-1 text-center lg:text-left z-10">
            <h4 className="text-xs font-black uppercase tracking-widest text-zinc-400 flex items-center gap-1.5 justify-center lg:justify-start">
              <Sparkles className="w-3.5 h-3.5 text-orange-500 animate-pulse" />
              Legenda de Status
            </h4>
            <p className="text-[10px] text-zinc-500 font-medium">Acompanhe a evolução do seu ecossistema de conteúdo em tempo real.</p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2.5 z-10">
            {[
              { color: 'bg-orange-500 shadow-orange-500/30', label: 'Briefing / Ideia', desc: 'Pendente / IA' },
              { color: 'bg-indigo-500 shadow-indigo-500/30 animate-pulse', label: 'Geração de Mídia', desc: 'Processando...' },
              { color: 'bg-sky-500 shadow-sky-500/30', label: 'Aprovado / Revisão', desc: 'Validação Manual' },
              { color: 'bg-emerald-500 shadow-emerald-500/30', label: 'Publicado', desc: 'Redes Sociais Ativas' },
              { color: 'bg-red-500 shadow-red-500/30', label: 'Falha / Erro', desc: 'Necessita Atenção' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2.5 px-3 py-1.5 bg-zinc-950/40 border border-zinc-800/50 rounded-2xl">
                <div className={`w-2 h-2 rounded-full ${item.color} shadow`} />
                <div className="flex flex-col text-left">
                  <span className="text-[9px] font-black uppercase tracking-wider text-zinc-300">{item.label}</span>
                  <span className="text-[7px] font-mono text-zinc-500 leading-none">{item.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Content Display */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-80 bg-zinc-900/50 border border-zinc-800/50 rounded-[2.5rem] animate-pulse"></div>
            ))}
          </div>
        ) : isError ? (
          <div className="p-12 text-center bg-red-950/20 border border-red-900/50 rounded-[2.5rem]">
            <h3 className="text-xl font-black uppercase tracking-widest text-red-500 mb-2">System Failure</h3>
            <p className="text-red-400/70 text-sm font-medium">{error instanceof Error ? error.message : 'Erro ao carregar ecossistema de conteúdo.'}</p>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="p-20 text-center bg-zinc-900/20 border border-zinc-800/50 rounded-[3rem] backdrop-blur-sm">
            <div className="w-20 h-20 bg-zinc-900 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-zinc-800">
              <FileText className="w-10 h-10 text-zinc-700" />
            </div>
            <h3 className="text-2xl font-black uppercase tracking-tighter text-white mb-2">Vazio Absoluto</h3>
            <p className="text-zinc-500 font-medium">Nenhum registro encontrado nesta frequência.</p>
          </div>
        ) : (
          <div className="space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              {paginatedPosts.map((post, idx) => {
                const status = post.status || 'Pendente';
                const theme = getStatusTheme(status);
                const parsed = parseRoteiro(post.roteiro_gerado);
                
                // Fetch first scene image or first available image
                const firstImage = post.imagens?.find(img => Number(img.numero_cena) === 1) || post.imagens?.[0];
                const imageUrl = firstImage?.image_url || firstImage?.url_imagem_fundo;
                
                const isPosted = status.toLowerCase() === 'postado' || status === 'Publicado';
                const isError = status === 'Erro';
                const isGenerating = theme.pulse;
                
                return (
                  <div 
                    key={post.id_post || idx} 
                    className={clsx(
                      "flex flex-col bg-zinc-900/40 border rounded-[2rem] overflow-hidden transition-all duration-500 group relative backdrop-blur-xl",
                      theme.border,
                      theme.borderHover,
                      "hover:shadow-2xl",
                      theme.glow
                    )}
                  >
                    {/* Status Indicator Bar */}
                    <div className={clsx(
                      "absolute top-0 left-0 right-0 h-1 z-10",
                      isPosted ? "bg-emerald-500" :
                      isError ? "bg-red-500" :
                      isGenerating ? "bg-indigo-500" :
                      status.toLowerCase().includes('revisão') || status.toLowerCase() === 'aprovado' ? "bg-sky-500" :
                      "bg-orange-500"
                    )} />

                    {/* Card Visual Preview Thumbnail */}
                    <div className="relative w-full h-44 overflow-hidden bg-zinc-950/80 border-b border-zinc-800/40 flex-shrink-0">
                      {imageUrl ? (
                        <img 
                          src={imageUrl} 
                          alt={post.titulo_post || post.tema_post || "Content preview"}
                          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 group-hover:brightness-105"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-zinc-950 via-zinc-900 to-indigo-950/20 flex flex-col items-center justify-center gap-2.5 relative group-hover:scale-105 transition-transform duration-700 ease-out">
                          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-orange-500/5 via-transparent to-transparent pointer-events-none" />
                          <div className="p-3 bg-zinc-900/50 border border-zinc-800 rounded-2xl text-zinc-600 group-hover:text-orange-500 group-hover:border-orange-500/20 transition-all duration-300 shadow-inner">
                            <ImageIcon className="w-6 h-6" />
                          </div>
                          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500">
                            {status === 'Aguardando IA' ? 'Aguardando IA...' : 'Briefing / Sem Imagem'}
                          </span>
                        </div>
                      )}

                      {/* Type badge on Image */}
                      {post.tipo_post && (
                        <div className="absolute bottom-3 left-4 flex flex-wrap gap-1.5 z-10">
                          {post.tipo_post.split(',').map(p => (
                            <span key={p} className="text-[8px] font-black uppercase tracking-widest text-zinc-200 bg-black/75 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 shadow-lg">
                              {p.trim()}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Card Header & Post Info */}
                    <div className="px-6 pt-5 pb-2 flex justify-between items-start flex-shrink-0">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[8px] font-black uppercase tracking-[0.2em] text-zinc-600">ID do Conteúdo</span>
                        <span className="text-[10px] font-mono text-zinc-400">
                          #{post.id_post?.substring(0, 8)}
                        </span>
                      </div>
                      
                      <div className={clsx(
                        "flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all",
                        theme.bg
                      )}>
                        {isPosted ? <CheckCircle2 className="w-3 h-3" /> : isGenerating ? <RefreshCcw className="w-3 h-3 animate-spin" /> : <Clock className="w-3 h-3" />}
                        {theme.badgeText.replace('_', ' ')}
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="px-6 py-3 flex-1 flex flex-col gap-3 min-h-[160px]">
                      <h3 className="text-lg font-black text-white leading-snug tracking-tight group-hover:text-orange-400 transition-colors line-clamp-2">
                        {post.titulo_post || post.tema_post || 'Sem título'}
                      </h3>
                      
                      {parsed.isJson ? (
                        <div className="flex-1 flex flex-col gap-3 justify-between">
                          {parsed.gancho ? (
                            <div className="flex flex-col gap-1 bg-zinc-950/40 border border-zinc-800/40 rounded-2xl p-3.5 relative overflow-hidden flex-1 justify-center">
                              <div className="absolute top-0 right-0 p-1.5 text-[7px] font-mono font-black uppercase tracking-widest text-orange-500/20">HOOK</div>
                              <span className="text-[8px] font-black uppercase tracking-wider text-zinc-600">Gancho / Entrada</span>
                              <p className="text-xs text-zinc-300 font-medium leading-relaxed italic line-clamp-2">
                                &quot;{parsed.gancho}&quot;
                              </p>
                            </div>
                          ) : (
                            <div className="flex flex-col gap-1 flex-1 justify-center">
                              <span className="text-[8px] font-black uppercase tracking-wider text-zinc-600">Roteiro</span>
                              <p className="text-xs text-zinc-500 font-medium leading-relaxed italic line-clamp-2">
                                Roteiro gerado sem gancho detectado. Clique em detalhes para ver as cenas.
                              </p>
                            </div>
                          )}

                          {/* Scenes Count Badge */}
                          <div className="flex items-center gap-2 pt-2 border-t border-zinc-800/20">
                            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-950/40 border border-zinc-800/50 rounded-xl">
                              <Video className="w-3 h-3 text-zinc-500" />
                              <span className="text-[8px] font-black uppercase tracking-wider text-zinc-400">
                                {parsed.cenasCount} {parsed.cenasCount === 1 ? 'Cena' : 'Cenas'}
                              </span>
                            </div>
                            
                            {parsed.tipo && (
                              <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest ml-auto">
                                {parsed.tipo}
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="flex-1 flex flex-col gap-1.5 bg-zinc-950/20 border border-zinc-800/20 rounded-2xl p-3.5">
                          <span className="text-[8px] font-black uppercase tracking-wider text-zinc-600">Roteiro / Descrição</span>
                          <p className="text-xs text-zinc-500 line-clamp-3 font-medium leading-relaxed italic">
                            &quot;{parsed.plainText}&quot;
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Card Footer Actions */}
                    <div className="p-5 bg-zinc-950/40 mt-auto border-t border-zinc-800 flex justify-between items-center flex-shrink-0">
                      <div className="flex gap-1.5">
                        <button 
                          className="p-2.5 bg-zinc-900 border border-zinc-800 hover:border-red-500/50 text-zinc-500 hover:text-red-500 rounded-xl transition-all disabled:opacity-50"
                          onClick={() => handleDelete(post.id_post)}
                          disabled={!!isDeleting || !!isApproving || !!isRendering}
                          title="Excluir Post"
                        >
                          {isDeleting === post.id_post ? <RefreshCcw className="w-4 h-4 animate-spin text-red-500" /> : <Trash2 className="w-4 h-4" />}
                        </button>

                        <button 
                          className="p-2.5 bg-zinc-900 border border-zinc-800 hover:border-emerald-500/50 text-zinc-500 hover:text-emerald-500 rounded-xl transition-all disabled:opacity-50"
                          onClick={() => handleApprove(post.id_post)}
                          disabled={!!isDeleting || !!isApproving || !!isRendering}
                          title="Aprovar Briefing"
                        >
                          {isApproving === post.id_post ? <RefreshCcw className="w-4 h-4 animate-spin text-emerald-500" /> : <CheckCircle2 className="w-4 h-4" />}
                        </button>

                        <button 
                          className={clsx(
                            "p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl transition-all disabled:opacity-50",
                            isError ? "hover:border-red-500/50 text-red-500 hover:bg-red-500/10" : "hover:border-indigo-500/50 text-zinc-500 hover:text-indigo-500"
                          )}
                          onClick={() => handleRender(post.id_post)}
                          disabled={!!isDeleting || !!isApproving || !!isRendering}
                          title={isError ? "Tentar Novamente (Erro)" : "Renderizar Vídeo"}
                        >
                          {isRendering === post.id_post ? <RefreshCcw className={clsx("w-4 h-4 animate-spin", isError ? "text-red-500" : "text-indigo-500")} /> : 
                           isError ? <RefreshCcw className="w-4 h-4" /> : <PlayCircle className="w-4 h-4" />}
                        </button>
                      </div>
                      
                      <div className="flex gap-2">
                        <a 
                          href={`/conteudo/editor/${post.id_post}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all group/btn"
                          title="Abrir no Estúdio Criativo"
                        >
                          Estúdio <ExternalLink className="w-3 h-3 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                        </a>
                        <button 
                          className="flex items-center gap-1.5 px-3 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all group/btn"
                          onClick={() => setSelectedPostId(post.id_post)}
                        >
                          Detalhes
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

            </div>
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-12 border-t border-zinc-800/50">
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">
                  Página <span className="text-zinc-300">{filters.page}</span> de <span className="text-zinc-300">{totalPages}</span> — <span className="text-zinc-300">{filteredPosts.length}</span> Entradas
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => updateFilters({ page: Math.max(1, filters.page - 1) })}
                    disabled={filters.page === 1}
                    className="px-6 py-3 bg-zinc-900 border border-zinc-800 rounded-2xl text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white disabled:opacity-20 transition-all"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => updateFilters({ page: Math.min(totalPages, filters.page + 1) })}
                    disabled={filters.page === totalPages}
                    className="px-6 py-3 bg-zinc-900 border border-zinc-800 rounded-2xl text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white disabled:opacity-20 transition-all"
                  >
                    Próxima
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <PostDetailModal 
        postId={selectedPostId || ''} 
        isOpen={!!selectedPostId} 
        onClose={() => setSelectedPostId(null)} 
      />
    </main>
  );
}

export default function ConteudoPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-4" />
        <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Carregando Biblioteca...</p>
      </div>
    }>
      <ConteudoContent />
    </Suspense>
  );
}
