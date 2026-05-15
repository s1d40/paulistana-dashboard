'use client';

import { useState, useRef, useEffect, Suspense, useCallback } from 'react';
import { 
  Send, Loader2, User, Bot, ArrowLeft, ChevronDown, Edit3, 
  Lock, RotateCcw, Play, Database, Save, GripHorizontal,
  BrainCircuit, Wand2, Terminal, RefreshCcw
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { updatePresetInSupabase, fetchPresetById } from '@/services/supabase-service';
import { usePresetStore, SystemMessageSession, ContentType } from '@/store/presetStore';
import { supabase } from '@/lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';
import clsx from 'clsx';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const DEFAULT_ARCHITECT_PROMPT = `# AGENTE ARQUITETO E DIRETOR CRIATIVO (MASTER)

## 1. FUNÇÃO
Sua função é configurar a "Espinha Dorsal" de produção (Cockpit) e definir a identidade do post através de diálogo com o usuário. Você é o Diretor Criativo e o Copywriter inicial.

## 2. MANDATOS OBRIGATÓRIOS
- **Identificação do Post:** Assim que o tema for definido, use a ferramenta 'Definir_Metadados_Post' para gravar o título, o tema e as captions (legenda) no banco de dados.
- **Dinâmica Visual:** Instrua o Roteirista a variar animações (zoom_in, zoom_out, pan, etc).
- **Estética Definida:** Estabeleça um estilo visual claro no card de Estética.

## 3. FERRAMENTAS
- **Definir_Metadados_Post**: (id_post, titulo, tema, captions). **Uso obrigatório** para batizar o conteúdo.
- **Atualizar_Card**: (session_id, new_content). Para mudar persona, estética ou narração.
- **Ajustar_Parametros_Globais**: (model, temperature).
- **Gerenciar_Sessoes_Customizadas**: Para adicionar campos extras.

## 4. PROCEDIMENTO
- Entenda o pedido do usuário.
- **Defina os metadados do post imediatamente.**
- Proponha melhorias criativas e grave-as nos cards.
- Confirme que o post está configurado e pronto para a IA Roteirista.
`;

function ChatContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const track = searchParams.get('track') || 'video';
  const idPost = searchParams.get('id_post');
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const { initializePresets, createDraftPreset } = usePresetStore();
  
  const [mounted, setMounted] = useState(false);
  const [sessionId] = useState(() => idPost || (typeof crypto !== 'undefined' ? crypto.randomUUID() : 'id-' + Date.now()));
  const activePresetId = idPost || sessionId;

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState<string | null>(null);

  // --- POST METADATA ---
  const [postTitle, setPostTitle] = useState<string>('');

  // --- SCRIPTWRITER (PRODUCTION) DNA ---
  const [localSessions, setLocalSessions] = useState<SystemMessageSession[]>([]);
  const [localPrompt, setLocalPrompt] = useState('');
  const [localModel, setLocalModel] = useState('gpt-5.4');
  const [localTemp, setLocalTemp] = useState(0.7);

  // --- COCREATOR (ARCHITECT) DNA ---
  const [arcModel, setArcModel] = useState('models/gemini-3.1-pro-preview');
  const [arcPrompt, setArcPrompt] = useState(DEFAULT_ARCHITECT_PROMPT);
  const [useRealProducts, setUseRealProducts] = useState(false);
  const [isArcSidebarOpen, setIsArcSidebarOpen] = useState(false);

  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);

  // Vertical Resizing Logic for Cockpit
  const [cockpitHeight, setCockpitHeight] = useState(320); 
  const isResizing = useRef(false);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing.current) return;
    const newHeight = Math.min(Math.max(e.clientY - 80, 60), 600);
    setCockpitHeight(newHeight);
  }, []);

  const stopResizing = useCallback(() => {
    isResizing.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.body.style.cursor = 'default';
  }, [handleMouseMove]);

  useEffect(() => {
    const handleMouseUp = () => {
      if (isResizing.current) {
        stopResizing();
      }
    };
    document.addEventListener('mouseup', handleMouseUp);
    return () => document.removeEventListener('mouseup', handleMouseUp);
  }, [stopResizing]);

  const startResizing = () => {
    isResizing.current = true;
    document.addEventListener('mousemove', handleMouseMove);
    document.body.style.cursor = 'row-resize';
  };

  const hasCreatedDraft = useRef(false);

  // 0. INITIAL SETUP
  useEffect(() => {
    const setup = async () => {
      if (hasCreatedDraft.current) return;
      hasCreatedDraft.current = true;
      setMounted(true);
      
      const params = new URLSearchParams(window.location.search);
      const urlIdPost = params.get('id_post');
      const finalId = urlIdPost || sessionId;
      
      console.log('[Cocreator] 🛠️ Setting up Live Session:', finalId);
      
      // 1. Garantir que o registro existe no banco (Upsert)
      // Se já existe, o createDraftPreset apenas retorna o ID existente
      const confirmedId = await createDraftPreset(track as ContentType, finalId);
      
      // 2. Buscar o estado atual do banco para o liveConfig
      const freshData = await fetchPresetById(confirmedId || finalId);
      if (freshData) {
        const config = (freshData.config as Record<string, unknown>) || {};
        const sessions = (freshData.sessions || []) as SystemMessageSession[];
        
        setLocalSessions(sessions);
        setLocalPrompt((config.prompt as string) || '');
        setLocalModel((config.model as string) || 'gpt-5.4');
        setLocalTemp((config.temperature as number) ?? 0.7);
      }

      // 2.1 Buscar metadados iniciais do post
      const { data: postData } = await supabase
        .from('posts')
        .select('titulo_post, captions, id_conta')
        .eq('id_post', confirmedId || finalId)
        .maybeSingle();
      
      if (postData) {
        setPostTitle(postData.titulo_post || '');
        if (postData.id_conta) {
          (window as Window & { _current_id_conta?: string })._current_id_conta = postData.id_conta;
        }
      }

      // 3. Sync URL se o id_post mudou ou não existia
      if (urlIdPost !== confirmedId && confirmedId) {
        const newParams = new URLSearchParams(window.location.search);
        newParams.set('id_post', confirmedId);
        window.history.replaceState(null, '', `${window.location.pathname}?${newParams.toString()}`);
      }
    };
    setup();
  }, [track, sessionId, createDraftPreset]);

  const editingRef = useRef<string | null>(null);
  const isSettingsModified = useRef(false); // Track if user touched settings locally

  useEffect(() => {
    editingRef.current = editingSessionId;
  }, [editingSessionId]);

  // 1. STABLE REALTIME SUBSCRIPTION
  useEffect(() => {
    if (!activePresetId || !mounted) return;

    console.log('[Realtime] 📡 Subscribing to Live Record:', activePresetId);
    
    const channel = supabase
      .channel(`live-config-${activePresetId}`)
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'content_presets',
        filter: `id=eq.${activePresetId}`
      }, async (payload) => {
        console.log('[Realtime] ⚡ Update detected for Preset!', payload);
        
        const freshData = payload.new as Record<string, unknown>;
        if (freshData) {
          const sessions = (freshData.sessions || []) as SystemMessageSession[];
          const config = (freshData.config as Record<string, unknown>) || {};
          
          console.log('[Realtime] 📦 Config received:', config);

          // 1.1 Sync Sessions (Only if not editing a specific card)
          if (!editingRef.current) {
            setLocalSessions(sessions);
          } else {
            console.log('[Realtime] ⏳ Sessions sync deferred: User is editing card', editingRef.current);
          }

          // 1.2 Sync Global Settings (Always sync unless user is specifically typing in them right now)
          if (!isSettingsModified.current) {
            console.log('[Realtime] 🔄 Syncing Global Settings (Prompt/Model/Temp)...');
            if (config.prompt !== undefined) setLocalPrompt((config.prompt as string) || '');
            if (config.model) setLocalModel(config.model as string);
            if (config.temperature !== undefined) setLocalTemp(config.temperature as number);
          } else {
            console.log('[Realtime] ✋ Local settings modification in progress, skipping auto-sync');
          }
        }
      })
      .subscribe((status) => {
        console.log(`[Realtime] Preset Subscription status for ${activePresetId}:`, status);
      });

    return () => {
      console.log('[Realtime] 🔌 Unsubscribing Preset from:', activePresetId);
      supabase.removeChannel(channel);
    };
  }, [activePresetId, mounted]);

  // 1.1 POST METADATA REALTIME
  useEffect(() => {
    if (!activePresetId || !mounted) return;

    console.log('[Realtime] 📡 Subscribing to Post Metadata:', activePresetId);

    const channel = supabase
      .channel(`live-post-${activePresetId}`)
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'posts',
        filter: `id_post=eq.${activePresetId}`
      }, (payload) => {
        console.log('[Realtime] ⚡ Update detected for Post Metadata!', payload);
        const freshData = payload.new as Record<string, unknown>;
        if (freshData) {
          setPostTitle((freshData.titulo_post as string) || '');
        }
      })
      .subscribe((status) => {
        console.log(`[Realtime] Post Metadata status for ${activePresetId}:`, status);
      });

    return () => {
      console.log('[Realtime] 🔌 Unsubscribing Metadata from:', activePresetId);
      supabase.removeChannel(channel);
    };
  }, [activePresetId, mounted]);

  // 2. MANUAL REFRESH LOGIC
  const handleManualRefresh = async () => {
    console.log('[Cocreator] Manual Refresh Triggered...');
    const freshData = await fetchPresetById(activePresetId);
    if (freshData) {
      const sessions = (freshData.sessions || []) as SystemMessageSession[];
      const config = (freshData.config as Record<string, unknown>) || {};
      setLocalSessions(sessions);
      setLocalPrompt((config.prompt as string) || '');
      setLocalModel((config.model as string) || 'gpt-5.4');
      setLocalTemp((config.temperature as number) ?? 0.7);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading || !activePresetId) return;

    const userMsg = input.trim();
    setInput('');
    const newMessages: Message[] = [...messages, { role: 'user', content: userMsg }];
    setMessages(newMessages);
    setLoading(true);

    try {
      // Identity Separation: Sending Architect identity + Scriptwriter State
      const response = await fetch('/api/chat/director', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: newMessages,
          track,
          active_preset_id: activePresetId, 
          session_id: sessionId,
          current_sessions: localSessions,
          prompt: localPrompt, // Scriptwriter Global Prompt
          model: localModel, // Scriptwriter Model
          temperature: localTemp,
          
          // ARCHITECT IDENTITY OVERRIDE
          architect_model: arcModel,
          architect_prompt: arcPrompt,
          use_real_products: useRealProducts
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Falha no Agente');
      }
      
      const data = await response.json();
      
      if (data.tool_call === 'generate_script') {
         setMessages(prev => [...prev, { role: 'assistant', content: '✨ Roteiro gerado com sucesso! Redirecionando...' }]);
         handleFinalizeProduction();
         return;
      }

      setMessages(prev => [...prev, { role: 'assistant', content: data.content }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Erro na comunicação.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateLocalSession = (id: string, content: string) => {
    setLocalSessions(prev => prev.map(s => s.id === id ? { ...s, content } : s));
  };

  const handleSaveSessionToDb = async (sessionId: string) => {
    const session = localSessions.find(s => s.id === sessionId);
    if (!session || !activePresetId) return;

    setIsSaving(sessionId);
    try {
      const { data: currentData } = await supabase
        .from('content_presets')
        .select('sessions')
        .eq('id', activePresetId)
        .single();

      const updatedSessions = (currentData?.sessions || []).map((s: SystemMessageSession) => 
        s.id === sessionId ? { ...s, content: session.content } : s
      );
      
      await updatePresetInSupabase(activePresetId, { sessions: updatedSessions });
      await handleManualRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(null);
      setEditingSessionId(null);
    }
  };

  const handleSaveSettingsToDb = async () => {
   if (!activePresetId) return;
   setIsSaving('settings');
   try {
     await updatePresetInSupabase(activePresetId, {
       config: {
         prompt: localPrompt,
         model: localModel,
         temperature: localTemp
       }
     });
     isSettingsModified.current = false;
     await handleManualRefresh();
   } catch (err) {
     console.error(err);
   } finally {
     setIsSaving(null);
   }
  };

  const handleFinalizeProduction = async () => {
    if (!activePresetId) return;
    setIsGenerating(true);
    try {
      const systemMessage = localSessions.map(s => `### ${s.title}\n${s.content}`).join('\n\n');
      
      const response = await fetch('/api/chat/roteirista', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_prompt: messages[messages.length - 1]?.content || 'Gere o vídeo com base no cockpit.',
          system_message: systemMessage,
          config: {
            model: localModel,
            temperature: localTemp,
            prompt: localPrompt
          }
        }),
      });

      if (!response.ok) throw new Error('Erro na geração');
      const { script: generatedScript } = await response.json();
      
      // Reutiliza o idPost (Sessão) se existir, senão gera um novo
      const finalId = idPost || (typeof crypto !== 'undefined' ? crypto.randomUUID() : Date.now().toString());
      
      const prodRes = await fetch('/api/production', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'init_post',
          id_post: finalId,
          tema_post: generatedScript.tema || 'Novo Vídeo',
          titulo_post: postTitle || generatedScript.titulo_otimizado || 'Sem Título',
          roteiro_gerado: JSON.stringify(generatedScript),
          status: 'Aguardando Revisão',
          id_conta: (window as Window & { _current_id_conta?: string })._current_id_conta || 'b3f9c2d1-7e84-4a56-9d2b-1f8e3c6a4b90' 
        }),
      });

      if (!prodRes.ok) {
        const errData = await prodRes.json();
        throw new Error(errData.error || 'Erro ao registrar post no banco.');
      }

      router.push(`/conteudo/editor/${finalId}`);
    } catch (err) {
      console.error(err);
      alert('Erro ao finalizar produção.');
    } finally {
      setIsGenerating(false);
    }
  };

  const resetChat = () => {
    setMessages([]);
    initializePresets();
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  if (!mounted) return <div className="h-screen bg-zinc-950 flex items-center justify-center"><Loader2 className="w-8 h-8 text-indigo-500 animate-spin" /></div>;

  return (
    <div className="flex flex-col h-screen bg-zinc-950 font-sans overflow-hidden text-zinc-300">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-4 bg-zinc-900/50 border-b border-zinc-800/50 z-20 gap-8 backdrop-blur-md">
        <div className="flex items-center gap-8 flex-1 min-w-0">
          <div className="flex items-center gap-4 shrink-0">
            <button onClick={() => router.back()} className="p-2 hover:bg-zinc-800 rounded-full text-zinc-500 transition-colors"><ArrowLeft className="w-5 h-5" /></button>
            <h1 className="text-lg font-black text-white uppercase tracking-tighter flex items-center gap-2">
              Cocreator <span className="text-indigo-500">Studio</span>
            </h1>
          </div>
          <div className="flex-1 max-w-xl">
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500/80 mb-0.5">
                {postTitle ? 'Post Identificado' : 'Aguardando Briefing'}
              </span>
              <h2 className="text-sm font-bold text-white truncate">
                {postTitle || 'Novo Conteúdo'}
              </h2>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={resetChat} className="p-2 hover:bg-zinc-800 text-zinc-500 hover:text-red-400 rounded-lg transition-all" title="Limpar Chat"><RotateCcw className="w-5 h-5" /></button>
          <button onClick={handleManualRefresh} className="p-2 hover:bg-zinc-800 text-zinc-500 hover:text-indigo-400 rounded-lg transition-all" title="Forçar Re-Sincronia"><RefreshCcw className="w-5 h-5" /></button>
          
          <button onClick={() => handleFinalizeProduction()} disabled={isGenerating || messages.length === 0} className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-500/20 transition-all active:scale-95">
            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />} Gerar Roteiro
          </button>
        </div>
      </header>

      {/* SCRIPTWRITER DNA (Cockpit) */}
      <section 
        style={{ height: `${cockpitHeight}px` }}
        className="w-full bg-zinc-950 border-b border-zinc-800/50 overflow-x-auto custom-scrollbar scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent py-4 px-8 flex gap-4 shadow-2xl relative z-10 transition-[height] duration-75 ease-out"
      >
        <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-4 w-[340px] shrink-0 flex flex-col gap-3 group/settings relative backdrop-blur-sm">
          <div className="flex items-center justify-between">
             <div className="flex items-center gap-2">
               <div className="p-1.5 bg-indigo-500/20 text-indigo-400 rounded-lg"><Wand2 className="w-3 h-3" /></div>
               <h4 className="text-[10px] font-black uppercase text-zinc-200 tracking-wider">Scriptwriter DNA</h4>
             </div>
             <button onClick={handleSaveSettingsToDb} disabled={isSaving === 'settings'} className="p-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-indigo-400 hover:bg-zinc-800 transition-all disabled:opacity-50">
                {isSaving === 'settings' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
             </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[8px] font-black text-zinc-500 uppercase tracking-tighter">Model (Output)</label>
              <select 
                value={localModel} 
                onChange={(e) => {
                  setLocalModel(e.target.value);
                  isSettingsModified.current = true;
                }} 
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-1.5 text-[9px] font-bold text-zinc-300 outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="gpt-5.4">GPT-5.4 (Turbo)</option>
                <option value="claude-sonnet-4-6">Claude 4.6</option>
                <option value="models/gemini-3.1-pro-preview">Gemini 3.1 Pro</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[8px] font-black text-zinc-500 uppercase tracking-tighter">Entropy: {localTemp}</label>
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.1" 
                value={localTemp} 
                onChange={(e) => {
                  setLocalTemp(parseFloat(e.target.value));
                  isSettingsModified.current = true;
                }} 
                className="w-full accent-indigo-500 h-1 bg-zinc-800 rounded-full appearance-none cursor-pointer mt-2" 
              />
            </div>
          </div>
          <div className="space-y-1.5 flex-1 flex flex-col min-h-0 pt-1 border-t border-zinc-800/50">
            <label className="text-[8px] font-black text-zinc-500 uppercase tracking-tighter">Global Prompt (Directives)</label>
            <textarea 
              value={localPrompt} 
              onChange={(e) => {
                setLocalPrompt(e.target.value);
                isSettingsModified.current = true;
              }} 
              className="w-full flex-1 bg-zinc-900 border border-zinc-800 rounded-xl p-2 text-[9px] font-mono leading-relaxed text-zinc-400 outline-none resize-none focus:ring-1 focus:ring-indigo-500" 
              placeholder="Production guidelines..." 
            />
          </div>
        </div>

        {(localSessions || []).map((session) => {
          const isExpanded = expandedSessionId === session.id;
          const isEditing = editingSessionId === session.id;
          return (
            <div 
              key={session.id} 
              className={clsx(
                "rounded-2xl border transition-all duration-500 flex flex-col p-4 shadow-sm shrink-0 relative overflow-hidden group/card", 
                isExpanded 
                  ? "w-[480px] border-indigo-500/50 bg-zinc-900 shadow-2xl shadow-indigo-500/10" 
                  : "w-56 border-zinc-800/80 bg-zinc-900/40 hover:bg-zinc-900 hover:border-zinc-700/50"
              )}
            >
              <div className="flex justify-between items-center mb-3">
                <div 
                  className="flex items-center gap-2 overflow-hidden cursor-pointer" 
                  onClick={() => setExpandedSessionId(isExpanded ? null : session.id)}
                >
                   <div className={clsx(
                     "p-1.5 rounded-lg transition-colors", 
                     isExpanded ? "bg-indigo-500/20 text-indigo-400" : "bg-zinc-800 text-zinc-500 group-hover/card:bg-zinc-700"
                   )}>
                     {session.isEssential ? <Lock className="w-3 h-3" /> : <Edit3 className="w-3 h-3" />}
                   </div>
                   <h4 className={clsx(
                     "text-[10px] font-black uppercase truncate tracking-wider transition-colors",
                     isExpanded ? "text-white" : "text-zinc-400 group-hover/card:text-zinc-200"
                   )}>
                     {session.title}
                   </h4>
                </div>
                <div className="flex items-center gap-1">
                  {!session.isEssential && !isEditing && isExpanded && (
                    <button onClick={() => setEditingSessionId(session.id)} className="p-1.5 hover:bg-zinc-800 text-zinc-400 rounded-lg transition-colors"><Edit3 className="w-3 h-3" /></button>
                  )}
                  <button onClick={() => setExpandedSessionId(isExpanded ? null : session.id)} className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-500 transition-colors">
                    <ChevronDown className={clsx("w-3 h-3 transition-transform duration-300", isExpanded && "rotate-180 text-indigo-400")} />
                  </button>
                </div>
              </div>

              {!isExpanded && (
                <div 
                  className="relative flex-1 cursor-pointer group/text" 
                  onClick={() => setExpandedSessionId(session.id)}
                >
                  <p className="text-[10px] text-zinc-500 group-hover/card:text-zinc-400 leading-[1.4] italic font-medium transition-colors line-clamp-6">
                    {session.content || "Defina as diretrizes..."}
                  </p>
                  <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-zinc-950/80 to-transparent pointer-events-none group-hover/card:from-zinc-900/80" />
                </div>
              )}

              {isExpanded && (
                <div className="mt-2 space-y-3 flex-1 flex flex-col min-h-0 animate-in fade-in slide-in-from-top-2 duration-300">
                  {isEditing ? (
                    <div className="space-y-3 flex-1 flex flex-col">
                       <textarea 
                        value={session.content} 
                        onChange={(e) => handleUpdateLocalSession(session.id, e.target.value)} 
                        className="w-full flex-1 bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-[10px] font-mono leading-relaxed text-zinc-300 outline-none focus:ring-1 focus:ring-indigo-500 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent" 
                        autoFocus 
                       />
                       <div className="flex gap-2 shrink-0">
                          <button onClick={() => setEditingSessionId(null)} className="flex-1 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-[9px] font-black uppercase rounded-lg transition-colors">Cancelar</button>
                          <button onClick={() => handleSaveSessionToDb(session.id)} disabled={isSaving === session.id} className="flex-[2] py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-[9px] font-black uppercase rounded-lg flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50">
                            {isSaving === session.id ? <Loader2 className="w-2 h-2 animate-spin" /> : <Database className="w-2 h-2" />} Persistir
                          </button>
                       </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex-1 bg-zinc-950 border border-zinc-800/50 p-4 rounded-xl overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
                        <p className="text-[10px] text-zinc-400 leading-relaxed italic whitespace-pre-wrap selection:bg-indigo-500/30">
                          {session.content || "Nenhuma diretriz definida."}
                        </p>
                      </div>
                      {!session.isEssential && (
                        <button onClick={() => setEditingSessionId(session.id)} className="w-full py-2.5 rounded-xl border border-dashed border-zinc-800 text-zinc-500 text-[9px] font-black uppercase hover:bg-zinc-800/50 hover:border-zinc-700 transition-all flex items-center justify-center gap-2">
                          <Edit3 className="w-3 h-3" /> Refinar Diretrizes
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </section>

      <div onMouseDown={startResizing} className="h-1.5 w-full bg-zinc-900 hover:bg-indigo-500/50 cursor-row-resize flex items-center justify-center transition-colors group/resizer z-20">
        <div className="w-12 h-1 bg-zinc-800 group-hover/resizer:bg-indigo-400 rounded-full flex items-center justify-center"><GripHorizontal className="w-3 h-3 text-zinc-600 group-hover/resizer:text-indigo-300" /></div>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        <aside className={clsx(
          "bg-zinc-900/30 border-r border-zinc-800/50 flex flex-col gap-6 overflow-y-auto custom-scrollbar scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent shrink-0 transition-all duration-300 ease-in-out relative z-20",
          isArcSidebarOpen ? "w-80 p-6 opacity-100" : "w-0 p-0 opacity-0 pointer-events-none"
        )}>
          <div className="space-y-5">
            <div className="flex items-center gap-2 text-indigo-400">
              <div className="p-1.5 bg-indigo-500/20 rounded-lg"><BrainCircuit className="w-4 h-4" /></div>
              <h2 className="text-[11px] font-black uppercase tracking-widest text-zinc-100">Configuração de Produção</h2>
            </div>
            <div className="space-y-2">
              <label className="text-[8px] font-black text-zinc-500 uppercase tracking-tighter flex items-center gap-1">Modelo do Arquiteto</label>
              <select value={arcModel} onChange={(e) => setArcModel(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-[10px] font-bold text-zinc-200 outline-none focus:ring-1 focus:ring-indigo-500 transition-all appearance-none cursor-pointer shadow-lg shadow-black/40">
                <option value="gpt-5.4">GPT-5.4 (Orchestrator)</option>
                <option value="claude-sonnet-4-6">Claude 4.6 (Stylist)</option>
                <option value="models/gemini-3.1-pro-preview">Gemini 3.1 Pro (Architect)</option>
              </select>
            </div>

            <div className="pt-2">
              <label className="flex items-center justify-between p-4 bg-zinc-950 border border-zinc-800 rounded-2xl cursor-pointer group hover:border-indigo-500/50 transition-all shadow-lg">
                <div className="flex items-center gap-3">
                  <div className={clsx(
                    "p-2 rounded-lg transition-colors",
                    useRealProducts ? "bg-emerald-500/20 text-emerald-400" : "bg-zinc-800 text-zinc-500"
                  )}>
                    <Database className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase text-zinc-200 tracking-tight">Produtos Reais</span>
                    <span className="text-[8px] font-medium text-zinc-500">Usar slugs da DB</span>
                  </div>
                </div>
                <input 
                  type="checkbox" 
                  checked={useRealProducts} 
                  onChange={(e) => setUseRealProducts(e.target.checked)}
                  className="hidden" 
                />
                <div className={clsx(
                  "w-8 h-4 rounded-full relative transition-all duration-300",
                  useRealProducts ? "bg-emerald-500" : "bg-zinc-800"
                )}>
                  <div className={clsx(
                    "absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all duration-300 shadow-sm",
                    useRealProducts ? "left-4.5" : "left-0.5"
                  )} />
                </div>
              </label>
            </div>
          </div>
          <div className="flex-1 flex flex-col gap-2 min-h-0">
            <label className="text-[8px] font-black text-zinc-500 uppercase tracking-tighter flex items-center justify-between">
              Instruções de Identidade
              <Terminal className="w-3 h-3 text-indigo-500/40" />
            </label>
            <textarea value={arcPrompt} onChange={(e) => setArcPrompt(e.target.value)} className="w-full flex-1 bg-zinc-950 border border-zinc-800 rounded-2xl p-4 text-[10px] font-mono leading-relaxed text-zinc-400 outline-none resize-none focus:ring-1 focus:ring-indigo-500 transition-all shadow-inner" placeholder="Architect identity..." />
          </div>
          <div className="p-3 bg-indigo-500/5 rounded-xl border border-indigo-500/10">
             <p className="text-[9px] text-indigo-300 leading-relaxed font-medium">Estas instruções definem o comportamento do Agente na manipulação dos parâmetros do Cockpit.</p>
          </div>
        </aside>

        <button
          onClick={() => setIsArcSidebarOpen(!isArcSidebarOpen)}
          className={clsx(
            "absolute left-0 top-1/2 -translate-y-1/2 z-30 p-1.5 bg-zinc-900 border border-zinc-800 rounded-r-xl text-indigo-400 hover:bg-zinc-800 transition-all shadow-2xl",
            isArcSidebarOpen ? "translate-x-80" : "translate-x-0"
          )}
          title={isArcSidebarOpen ? "Esconder DNA" : "Ajustar DNA do Arquiteto"}
        >
          <BrainCircuit className={clsx("w-4 h-4 transition-transform duration-500", isArcSidebarOpen && "rotate-180")} />
        </button>

        <div className="flex-1 flex flex-col relative bg-zinc-950">
          <div className="flex-1 overflow-y-auto p-6 md:p-12 space-y-8 custom-scrollbar scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent" ref={scrollRef}>
            <div className="max-w-4xl mx-auto space-y-8">
              {messages.length === 0 ? (
                <div className="h-[40vh] flex flex-col items-center justify-center text-center space-y-6 opacity-40">
                  <div className="w-20 h-20 bg-zinc-900 rounded-[2rem] flex items-center justify-center shadow-2xl border border-zinc-800 transition-all"><Bot className="w-10 h-10 text-indigo-500" /></div>
                  <div className="space-y-2">
                    <p className="text-xs font-black uppercase tracking-[0.3em] text-white">Cocreator Active</p>
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Ajuste o cockpit acima ou defina uma visão.</p>
                  </div>
                </div>
              ) : (
                messages.map((m, i) => (
                  <div key={i} className={clsx("flex items-start gap-4 animate-in slide-in-from-bottom-2 duration-400", m.role === 'user' ? "flex-row-reverse" : "flex-row")}>
                    <div className={clsx("w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-2xl border transition-all", m.role === 'user' ? "bg-zinc-900 border-zinc-800 text-zinc-500" : "bg-indigo-600 border-indigo-500 text-white")}>
                      {m.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                    </div>
                    <div className={clsx("max-w-[85%] p-5 rounded-[1.5rem] shadow-2xl leading-relaxed text-sm transition-all", m.role === 'user' ? "bg-indigo-600 text-white rounded-tr-none shadow-indigo-600/20 font-semibold whitespace-pre-wrap" : "bg-zinc-900 text-zinc-300 border border-zinc-800 rounded-tl-none font-medium")}>
                      {m.role === 'user' ? m.content : (
                        <div className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-p:mb-4 last:prose-p:mb-0 prose-strong:text-white prose-strong:font-black prose-ul:list-disc prose-ul:pl-4 prose-li:mb-1 prose-headings:text-white prose-headings:font-black prose-headings:uppercase prose-headings:tracking-tighter prose-code:bg-zinc-800 prose-code:px-1 prose-code:rounded prose-code:text-indigo-400">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
              {loading && <div className="flex items-center gap-3 text-indigo-500/60 animate-pulse px-4"><div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" /><span className="text-[9px] font-black uppercase tracking-[0.4em]">Cocreator processando...</span></div>}
            </div>
          </div>

          <footer className="p-6 bg-zinc-950 border-t border-zinc-800/50 shadow-2xl">
            <form onSubmit={sendMessage} className="max-w-4xl mx-auto relative group flex gap-3">
              <input value={input} onChange={(e) => setInput(e.target.value)} disabled={loading} placeholder={loading ? "Otimizando estratégia..." : "Defina seu vídeo ou peça uma análise criativa..."} className="flex-1 bg-zinc-900/50 border border-zinc-800 rounded-2xl py-4 px-6 text-sm text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all shadow-inner font-medium disabled:opacity-50" />
              <button type="submit" disabled={!input.trim() || loading} className={clsx("px-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl shadow-xl shadow-indigo-600/30 transition-all active:scale-95 flex items-center justify-center border border-indigo-500/50", (input.trim() && !loading) ? "opacity-100" : "opacity-30")}>
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </button>
            </form>
          </footer>
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return <Suspense fallback={null}><ChatContent /></Suspense>;
}
