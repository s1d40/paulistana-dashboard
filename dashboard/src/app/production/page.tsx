'use client';

import { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { usePresetStore, SystemMessageSession } from '@/store/presetStore';
import { 
  PlayCircle, AlertCircle, Loader2, CheckCircle2, 
  PenTool, Sparkles, Package, Clock, Settings2, 
  Lock, Unlock, ChevronRight, ChevronDown, ShieldCheck,
  Music, Image as ImageIcon, Video
} from 'lucide-react';
import ChatPanel from '@/components/chat-panel';
import PresetSelector from '@/components/preset-selector';
import PromptEditor from '@/components/prompt-editor';
import AccountSelector from '@/components/account-selector';
import ProductSelector from '@/components/product-selector';
import { fetchProducts, fetchContentPosts, fetchTable, GID_VIDEOS, GID_IMAGENS, GID_AUDIOS, Product, Account, Client, PostImage, PostAudio, PostVideo } from '@/services/supabase-service';
import clsx from 'clsx';

interface ProductionItem {
  uuid: string;
  produto: string;
  slug: string;
  status: 'Aguardando' | 'Processando' | 'Pronto' | 'Erro';
  videoUrl?: string;
  images: string[];
  audios: string[];
}

export default function ProductionStudioPage() {
  const { presets, activePresetId, updatePreset } = usePresetStore();
  
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'initializing' | 'running' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [productionItems, setProductionItems] = useState<ProductionItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  
  // Single Production (Sandbox) State
  const [chatInput, setChatInput] = useState('');
  const [currentSandboxProduct, setCurrentSandboxProduct] = useState<Product | null>(null);
  const [currentSandboxUuid, setCurrentSandboxUuid] = useState<string | null>(null);
  const [isSingleLoading, setIsSingleLoading] = useState(false);

  // UI States
  const [showConfig, setShowConfig] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);

  // Publishing Context
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const activePreset = presets.find((p) => p.id === activePresetId);
  const lastPromptPresetIdRef = useRef(activePresetId);

  // Sincronizar input do chat quando o preset mudar
  useEffect(() => {
    if (activePresetId !== lastPromptPresetIdRef.current) {
      setChatInput(activePreset?.prompt || '');
      lastPromptPresetIdRef.current = activePresetId;
    }
  }, [activePresetId, activePreset?.prompt]);

  // Estabilizar o handler de seleção para evitar loops
  const handleAccountSelect = useCallback((acc: Account, cli: Client | null) => {
    setSelectedAccount(acc);
    setSelectedClient(cli);
  }, []);

  // Carregar lista de produtos para a esteira
  useEffect(() => {
    fetchProducts().then(setProducts);
  }, []);

  // Consolidar todas as sessões em um único system message
  const consolidatedSystemMessage = useMemo(() => {
    if (!activePreset || !activePreset.sessions) return '';
    return activePreset.sessions
      .map(s => `### ${s.title}\n${s.content}`)
      .join('\n\n');
  }, [activePreset]);

  const handleUpdateSession = (sessionId: string, updates: Partial<SystemMessageSession>) => {
    if (!activePreset || !activePreset.sessions) return;
    const newSessions = activePreset.sessions.map(s => 
      s.id === sessionId ? { ...s, ...updates } : s
    );
    updatePreset(activePreset.id, { sessions: newSessions });
  };

  const handleProductSelect = (product: Product) => {
    if (!activePreset) return;
    
    const postUuid = crypto.randomUUID();
    setCurrentSandboxProduct(product);
    setCurrentSandboxUuid(postUuid);
    
    // Substituir placeholders: [PRODUTO], [SLUG], [ID_POST], [NARRATIVA], [VISUAL]
    let newPrompt = activePreset.prompt;
    newPrompt = newPrompt.replace(/\[PRODUTO\]/gi, product.Produto);
    newPrompt = newPrompt.replace(/\[SLUG\]/gi, product.slug_imagem_real);
    newPrompt = newPrompt.replace(/\[ID_POST\]/gi, postUuid);
    newPrompt = newPrompt.replace(/\[UUID\]/gi, postUuid);
    newPrompt = newPrompt.replace(/\[NOME DO PRODUTO\]/gi, product.Produto);
    newPrompt = newPrompt.replace(/\[NOME\]/gi, product.Produto);
    
    // Incluir restrições se existirem
    newPrompt = newPrompt.replace(/\[NARRATIVA\]/gi, product.Restricao_Narrativa || 'Nenhuma');
    newPrompt = newPrompt.replace(/\[VISUAL\]/gi, product.Restricao_Visual || 'Nenhuma');

    setChatInput(newPrompt);
  };

  // --- REAL-TIME POLLING LOGIC ---
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (productionItems.length > 0 && (status === 'running' || status === 'success')) {
      interval = setInterval(async () => {
        try {
          // Buscar todos os posts, imagens, áudios e vídeos finais
          const [allPosts, allImages, allAudios, allVideos] = await Promise.all([
            fetchContentPosts(),
            fetchTable<PostImage>(GID_IMAGENS),
            fetchTable<PostAudio>(GID_AUDIOS),
            fetchTable<PostVideo>(GID_VIDEOS)
          ]);

          setProductionItems(prevItems => prevItems.map(item => {
            const livePost = allPosts.find(p => p.id_post === item.uuid);
            const liveImages = allImages.filter(img => img.id_post === item.uuid && (img.image_url || img.url_imagem_fundo));
            const liveAudios = allAudios.filter(audio => audio.id_post === item.uuid && audio.audio_url);
            const liveVideo = allVideos.find(v => v.id_post === item.uuid);

            let newStatus: ProductionItem['status'] = item.status;
            
            if (liveVideo) {
              newStatus = 'Pronto';
            } else if (livePost || liveImages.length > 0 || liveAudios.length > 0) {
              newStatus = 'Processando';
            }

            return { 
              ...item, 
              status: newStatus,
              videoUrl: liveVideo?.video_final_url,
              images: liveImages.map(img => img.image_url || img.url_imagem_fundo || ''),
              audios: liveAudios.map(audio => audio.audio_url || '')
            };
          }));
        } catch (err) {
          console.error('Erro no polling de produção:', err);
        }
      }, 5000); // Polling a cada 5 segundos
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [productionItems.length, status]);

  const handleSingleTrigger = async () => {
    if (!activePreset || !currentSandboxProduct || !selectedAccount || !currentSandboxUuid) return;

    setIsSingleLoading(true);
    
    const item: ProductionItem = { 
      uuid: currentSandboxUuid, 
      produto: currentSandboxProduct.Produto,
      slug: currentSandboxProduct.slug_imagem_real,
      status: 'Aguardando',
      images: [],
      audios: []
    };

    // Adicionar ao tracker imediatamente (no topo)
    setProductionItems(prev => [item, ...prev]);

    try {
      // 1. Inicializar no Sheets (Reserva de ID)
      const initRes = await fetch('/api/production', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'initialize',
          items: [item],
          presetName: activePreset.name,
          id_conta: selectedAccount.id_conta
        }),
      });

      if (!initRes.ok) throw new Error('Falha ao inicializar registros no banco.');

      // 2. Disparo para o n8n
      const res = await fetch('/api/production', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'single_production',
          presetId: activePreset.id,
          presetName: activePreset.name,
          systemMessage: consolidatedSystemMessage,
          prompt: chatInput,
          id_conta: selectedAccount.id_conta,
          chat_id: selectedClient?.chat_id || '',
          items: [item]
        }),
      });

      if (!res.ok) throw new Error('Erro ao comunicar com a esteira n8n.');

      // Iniciar monitoramento global se estiver idle
      if (status === 'idle') setStatus('success');
      
      // Limpar seleção sandbox para permitir novo post
      setCurrentSandboxProduct(null);
      setCurrentSandboxUuid(null);
      setChatInput(activePreset.prompt);

    } catch (error) {
      console.error(error);
      alert('Erro ao iniciar produção individual.');
    } finally {
      setIsSingleLoading(false);
    }
  };

  const addSession = () => {
    if (!activePreset) return;
    const newSession: SystemMessageSession = {
      id: crypto.randomUUID(),
      title: 'Nova Sessão',
      content: '',
      isEditable: true,
      isEssential: false
    };
    const currentSessions = activePreset.sessions || [];
    updatePreset(activePreset.id, { sessions: [...currentSessions, newSession] });
    setEditingSessionId(newSession.id);
  };

  const removeSession = (sessionId: string) => {
    if (!activePreset || !activePreset.sessions) return;
    const session = activePreset.sessions.find(s => s.id === sessionId);
    if (!session || session.isEssential) return;

    if (confirm('Tem certeza que deseja remover esta sessão?')) {
      updatePreset(activePreset.id, { 
        sessions: activePreset.sessions.filter(s => s.id !== sessionId) 
      });
      if (editingSessionId === sessionId) setEditingSessionId(null);
    }
  };

  const toggleSessionLock = (sessionId: string) => {
    if (!activePreset || !activePreset.sessions) return;
    const session = activePreset.sessions.find(s => s.id === sessionId);
    if (!session || session.isEssential) return; 

    const newSessions = activePreset.sessions.map(s => 
      s.id === sessionId ? { ...s, isEditable: !s.isEditable } : s
    );
    updatePreset(activePreset.id, { sessions: newSessions });
  };

  const handleStartProduction = async () => {
    if (!activePreset || products.length === 0 || !selectedAccount) return;

    setIsLoading(true);
    setStatus('initializing');
    setErrorMessage('');

    // 1. Gerar UUIDs locais
    const items: ProductionItem[] = products.map(p => ({
      uuid: crypto.randomUUID(),
      produto: p.Produto,
      slug: p.slug_imagem_real,
      status: 'Aguardando',
      images: [],
      audios: []
    }));
    setProductionItems(items);

    try {
      // 2. Pré-Reserva no Sheets
      const initRes = await fetch('/api/production', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'initialize',
          items,
          presetName: activePreset.name,
          id_conta: selectedAccount.id_conta
        }),
      });

      if (!initRes.ok) throw new Error('Falha ao inicializar registros no banco.');

      // 3. Disparo para o n8n
      setStatus('running');
      const res = await fetch('/api/production', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'mass_production',
          presetId: activePreset.id,
          presetName: activePreset.name,
          systemMessage: consolidatedSystemMessage,
          prompt: activePreset.prompt,
          id_conta: selectedAccount.id_conta,
          chat_id: selectedClient?.chat_id || '',
          items: items 
        }),
      });

      if (!res.ok) throw new Error('Erro ao comunicar com a esteira n8n.');

      setStatus('success');
    } catch (error: unknown) {
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Erro desconhecido');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex-1 bg-zinc-50 dark:bg-zinc-950 h-screen flex flex-col overflow-hidden">
      
      {/* Studio Header */}
      <div className="px-6 py-4 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-600 rounded-lg">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-zinc-900 dark:text-white uppercase italic">
              Production Studio <span className="text-indigo-600">v2</span>
            </h1>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
              Controle Total da Inteligência Criativa
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowConfig(!showConfig)}
            className={clsx(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
              showConfig 
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" 
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200"
            )}
          >
            <Settings2 className={clsx("w-4 h-4", showConfig && "animate-spin-slow")} />
            Configurar Agente
          </button>
          
          <div className="h-8 w-px bg-zinc-200 dark:border-zinc-800" />
          
          <div className="flex flex-col items-end">
             <span className="text-[10px] font-black text-zinc-400 uppercase">Status Global</span>
             <span className="text-xs font-bold text-zinc-600 dark:text-zinc-300">{products.length} Ativos Carregados</span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Left Sidebar: Controls & Session Editor */}
        <div className={clsx(
          "bg-zinc-50 dark:bg-zinc-900/50 border-r border-zinc-200 dark:border-zinc-800 flex flex-col overflow-hidden transition-all duration-500 ease-in-out z-10",
          showConfig ? "w-[500px]" : "w-[400px]"
        )}>
          <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
            
            {showConfig ? (
              /* FULL SESSION EDITOR MODE */
              <section className="space-y-6 animate-in fade-in slide-in-from-left-4">
                <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-4">
                   <h2 className="text-sm font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
                     <Settings2 className="w-4 h-4" /> Configuração Detalhada
                   </h2>
                   <button onClick={() => setShowConfig(false)} className="text-[10px] font-bold text-zinc-400 hover:text-zinc-900">Fechar</button>
                </div>

                <PresetSelector />

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-black uppercase text-zinc-400 tracking-tighter">Sessões do Preset Ativo</p>
                    <button 
                      onClick={addSession}
                      className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest px-2 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-md hover:bg-indigo-100 transition-all"
                    >
                      <Sparkles className="w-3 h-3" /> Add Sessão
                    </button>
                  </div>
                  
                  {activePreset?.sessions?.map((session) => (
                    <div 
                      key={session.id}
                      className={clsx(
                        "rounded-xl border transition-all overflow-hidden",
                        editingSessionId === session.id 
                          ? "border-indigo-500 ring-4 ring-indigo-500/5 shadow-xl" 
                          : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950"
                      )}
                    >
                      <div className={clsx(
                        "px-3 py-2 flex items-center justify-between border-b",
                        session.isEssential ? "bg-zinc-100 dark:bg-zinc-900" : "bg-white dark:bg-zinc-950"
                      )}>
                        <div className="flex items-center gap-2 flex-1">
                          {session.isEssential ? <Lock className="w-3 h-3 text-amber-500" /> : <Unlock className="w-3 h-3 text-zinc-400" />}
                          <input 
                            type="text"
                            value={session.title}
                            readOnly={session.isEssential}
                            onChange={(e) => handleUpdateSession(session.id, { title: e.target.value })}
                            className="bg-transparent border-none outline-none text-[10px] font-black uppercase tracking-widest text-zinc-600 dark:text-zinc-400 w-full focus:text-indigo-600"
                          />
                        </div>
                        <div className="flex items-center gap-1">
                          {!session.isEssential && (
                            <button 
                              onClick={() => removeSession(session.id)}
                              className="p-1 text-zinc-300 hover:text-red-500 transition-colors"
                              title="Remover Sessão"
                            >
                              <AlertCircle className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button 
                            onClick={() => setEditingSessionId(editingSessionId === session.id ? null : session.id)}
                            className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors"
                          >
                            {editingSessionId === session.id ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                      
                      {editingSessionId === session.id && (
                        <div className="p-3 animate-in fade-in slide-in-from-top-1 duration-200">
                           <textarea
                             value={session.content}
                             onChange={(e) => handleUpdateSession(session.id, { content: e.target.value })}
                             readOnly={session.isEssential && !session.isEditable}
                             className={clsx(
                               "w-full h-48 bg-zinc-50 dark:bg-zinc-900 border-none outline-none font-mono text-[10px] p-2 rounded-lg resize-none",
                               session.isEssential && !session.isEditable && "opacity-80"
                             )}
                           />
                           {!session.isEssential && (
                             <div className="mt-2 flex justify-end">
                               <button 
                                 onClick={() => toggleSessionLock(session.id)}
                                 className="text-[8px] font-black uppercase tracking-widest text-indigo-500 hover:underline"
                               >
                                 {session.isEditable ? 'Bloquear Edição' : 'Habilitar Edição'}
                               </button>
                             </div>
                           )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            ) : (
              /* STANDARD PRODUCTION MODE */
              <>
                <section className="space-y-6">
                   <AccountSelector onSelect={handleAccountSelect} />
                   <PresetSelector />
                   <PromptEditor />
                </section>

                {/* Progress Tracker (Visible after starting) */}
                {productionItems.length > 0 && (
                  <section className="space-y-4 animate-in slide-in-from-left-4">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                        Progresso da Campanha
                      </label>
                      <span className="text-[10px] font-bold text-zinc-400">{productionItems.length} itens</span>
                    </div>
                    <div className="space-y-2 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                      {productionItems.map((item) => (
                        <div key={item.uuid} className="p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg space-y-3 shadow-sm transition-all">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={clsx(
                                "p-1.5 rounded border",
                                item.status === 'Pronto' ? "bg-emerald-50 border-emerald-100 dark:bg-emerald-900/20" : "bg-zinc-50 border-zinc-100 dark:bg-zinc-950"
                              )}>
                                 <Package className={clsx("w-3 h-3", item.status === 'Pronto' ? "text-emerald-500" : "text-zinc-400")} />
                              </div>
                              <div className="min-w-0">
                                <p className="text-[10px] font-bold text-zinc-900 dark:text-white truncate">{item.produto}</p>
                                <p className="text-[8px] font-mono text-zinc-400">#{item.uuid.substring(0,8)}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5">
                              {item.status === 'Pronto' ? (
                                <a 
                                  href={item.videoUrl} 
                                  target="_blank" 
                                  rel="noreferrer"
                                  className="flex items-center gap-1 text-[8px] font-black uppercase text-emerald-600 hover:underline"
                                >
                                  Ver Vídeo <ChevronRight className="w-2 h-2" />
                                </a>
                              ) : (
                                <Clock className={clsx(
                                  "w-2.5 h-2.5 animate-pulse",
                                  item.status === 'Processando' ? "text-indigo-500" : "text-amber-500"
                                )} />
                              )}
                            </div>
                          </div>

                          {/* ASSET INDICATORS */}
                          <div className="flex items-center gap-2 pt-1 border-t border-zinc-50 dark:border-zinc-800">
                             <div className={clsx(
                               "flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-tighter transition-colors",
                               (item.images?.length ?? 0) > 0 ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20" : "bg-zinc-100 text-zinc-300 dark:bg-zinc-800"
                             )}>
                               <ImageIcon className="w-2.5 h-2.5" />
                               {(item.images?.length ?? 0) > 0 ? `${item.images?.length} Imgs` : 'Img'}
                             </div>
                             <div className={clsx(
                               "flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-tighter transition-colors",
                               (item.audios?.length ?? 0) > 0 ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20" : "bg-zinc-100 text-zinc-300 dark:bg-zinc-800"
                             )}>
                               <Music className="w-2.5 h-2.5" />
                               {(item.audios?.length ?? 0) > 0 ? `${item.audios?.length} Aud` : 'Aud'}
                             </div>
                             {item.status === 'Pronto' && (
                               <div className="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-tighter flex items-center gap-1 animate-in zoom-in">
                                 <Video className="w-2.5 h-2.5" /> Vídeo
                               </div>
                             )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Technical Context Preview */}
                <section className="space-y-3 opacity-60 grayscale hover:opacity-100 hover:grayscale-0 transition-all">
                   <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                     Memória do Agente (Consolidada)
                   </label>
                   <div className="p-4 bg-zinc-900 rounded-xl border border-zinc-800 shadow-inner group">
                      <div className="max-h-24 overflow-y-auto custom-scrollbar">
                        <code className="text-[9px] text-zinc-500 font-mono whitespace-pre-wrap">
                          {consolidatedSystemMessage || 'Nenhum preset selecionado.'}
                        </code>
                      </div>
                   </div>
                </section>
              </>
            )}

          </div>

          {/* Action Footer */}
          <div className="p-6 bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800">
            <button
              onClick={handleStartProduction}
              disabled={isLoading || !activePreset || products.length === 0 || !selectedAccount}
              className={`w-full relative group overflow-hidden px-6 py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-2xl transition-all flex items-center justify-center gap-3 ${
                isLoading 
                  ? 'bg-zinc-400 dark:bg-zinc-700 cursor-not-allowed' 
                  : !activePreset || !selectedAccount
                    ? 'bg-zinc-100 text-zinc-400 cursor-not-allowed'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white hover:-translate-y-1 hover:shadow-emerald-500/40'
              }`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {status === 'initializing' ? 'Inicializando...' : 'Processando...'}
                </>
              ) : (
                <>
                  <PlayCircle className="w-5 h-5" />
                  Iniciar Produção Full
                </>
              )}
            </button>
            {status === 'success' && (
              <div className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-950 rounded-xl border border-emerald-100 dark:border-emerald-800 flex items-center gap-2 text-emerald-700 dark:text-emerald-400 animate-in slide-in-from-bottom-1">
                 <CheckCircle2 className="w-4 h-4" />
                 <span className="text-[10px] font-bold uppercase">Workflows disparados com sucesso!</span>
              </div>
            )}
            {status === 'error' && (
              <div className="mt-4 p-3 bg-red-50 dark:bg-red-950 rounded-xl border border-red-100 dark:border-red-800 flex items-center gap-2 text-red-700 dark:text-red-400 animate-in slide-in-from-bottom-1">
                 <AlertCircle className="w-4 h-4" />
                 <span className="text-[10px] font-bold uppercase truncate">{errorMessage}</span>
              </div>
            )}
          </div>
        </div>

        {/* Main Content: Chat Sandbox */}
        <div className="flex-1 bg-white dark:bg-zinc-950 flex flex-col overflow-hidden relative">
          {!activePreset ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-12 space-y-4">
               <Sparkles className="w-16 h-16 text-zinc-200 dark:text-zinc-800 animate-pulse" />
               <h3 className="text-xl font-bold text-zinc-400 uppercase tracking-widest italic">Estúdio Criativo</h3>
               <p className="text-sm text-zinc-500 max-w-xs">
                 O coração da proodução. Selecione um preset e conta para começar a orquestrar.
               </p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col overflow-hidden">
               
               {/* UNIT PRODUCTION TRIGGER SECTION (DIRECTOR MODE) */}
               <div className="p-6 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 space-y-6 shadow-sm z-10">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h4 className="text-xs font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
                        <Package className="w-4 h-4" /> Produção Individual (Unidade)
                      </h4>
                      <p className="text-[10px] text-zinc-500 font-medium italic">Gera 1 vídeo usando o webhook especializado de produção unitária.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[8px] font-black uppercase bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 px-2 py-1 rounded-full border border-indigo-100 dark:border-indigo-800">
                        Fluxo Direto
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <ProductSelector 
                        products={products} 
                        onSelect={handleProductSelect} 
                      />
                    </div>
                    <button
                      onClick={handleSingleTrigger}
                      disabled={isSingleLoading || !currentSandboxProduct || !selectedAccount}
                      className={clsx(
                        "w-full px-6 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-xl",
                        isSingleLoading
                          ? "bg-zinc-200 text-zinc-400 cursor-not-allowed"
                          : !currentSandboxProduct
                            ? "bg-zinc-50 text-zinc-300 cursor-not-allowed border border-dashed border-zinc-200"
                            : "bg-indigo-600 hover:bg-indigo-700 text-white hover:-translate-y-1 active:scale-95 shadow-indigo-600/20"
                      )}
                    >
                      {isSingleLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Reservando ID...
                        </>
                      ) : (
                        <>
                          <PlayCircle className="w-4 h-4" />
                          Disparar Unidade
                        </>
                      )}
                    </button>
                  </div>
                  
                  {currentSandboxProduct && (
                    <div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-950 rounded-xl border border-zinc-100 dark:border-zinc-800 animate-in slide-in-from-top-2">
                       <div className="flex items-center gap-6">
                         <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-600">
                           <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> ID Pronto: <span className="font-mono text-indigo-500">{currentSandboxUuid?.substring(0,13)}...</span>
                         </div>
                         <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-600">
                           <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" /> Canal: {selectedAccount?.nome_conta}
                         </div>
                       </div>
                       <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-tighter">* Ao disparar, o registro será criado no Sheets automaticamente.</p>
                    </div>
                  )}
               </div>
               
               {/* CHAT SANDBOX (COLLAPSIBLE OR COMPACT) */}
               <div className="flex-1 overflow-hidden relative border-t-4 border-zinc-100 dark:border-zinc-800">
                <div className="absolute top-0 left-0 right-0 bg-zinc-50 dark:bg-zinc-900 py-1 flex justify-center z-20">
                   <div className="w-12 h-1 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
                </div>
                <ChatPanel 
                  title={`Chat Sandbox: ${activePreset.name}`}
                  description="Interface de teste e refinamento de roteiro individual."
                  apiEndpoint="/api/chat/roteirista"
                  icon={<PenTool className="w-5 h-5 text-indigo-500" />}
                  systemMessage={`${consolidatedSystemMessage}\n\n[CONTEXTO DE PUBLICAÇÃO]\nID Conta: ${selectedAccount?.id_conta}\nChat ID: ${selectedClient?.chat_id}`}
                  initialPrompt={activePreset.prompt}
                  inputValue={chatInput}
                  onInputChange={setChatInput}
                />
               </div>
            </div>
          )}
        </div>

      </div>
    </main>
  );
}
