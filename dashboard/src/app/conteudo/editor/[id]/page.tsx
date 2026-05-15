'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchPostDetails, updatePostInSupabase, duplicatePostAsDraft, ContentPost, PostDetailsPayload, Account } from '@/services/supabase-service';
import { ScriptStudio } from '@/components/studio/script-studio';
import { Loader2, ArrowLeft, Save, Play, Sparkles, Film, Bot } from 'lucide-react';
import { useProductionQueue } from '@/store/production-queue';
import { supabase } from '@/lib/supabase';


export default function TimelineEditorPage() {
  const { id } = useParams();
  const router = useRouter();
  const [details, setDetails] = useState<PostDetailsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const { generateAssets, renderAllScenes, compileFinalVideo, isProcessing } = useProductionQueue();
  const [automationState, setAutomationState] = useState<'idle' | 'waiting_assets' | 'waiting_scenes'>('idle');

  useEffect(() => {
    const loadAccounts = async () => {
      const { data } = await supabase.from('contas').select('*');
      setAccounts((data as Account[]) || []);
    };
    loadAccounts();
  }, []);
  
  // Use a ref to avoid closure staleness in setInterval
  const isProcessingRef = useRef(isProcessing);
  useEffect(() => {
    isProcessingRef.current = isProcessing;
    console.log(`[Editor] isProcessing changed: ${isProcessing}`);
  }, [isProcessing]);

  const refreshAssets = useCallback(async (source: string) => {
    console.log(`[Editor] 🔄 Refreshing assets triggered by: ${source} at ${new Date().toLocaleTimeString()}`);
    try {
      const data = await fetchPostDetails(id as string);
      console.log(`[Editor] ✅ New details fetched:`, {
        imgs: data.imagens.length,
        auds: data.audios.length,
        vids: data.videos_cenas?.length,
        final: data.videos.length
      });
      setDetails(data);
    } catch (err) {
      console.error(`[Editor] ❌ Error refreshing assets:`, err);
    }
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        const data = await fetchPostDetails(id as string);
        setDetails(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    load();

    // --- REALTIME SUBSCRIPTIONS ---
    console.log(`[Editor] Subscribing to realtime updates for post ${id}`);
    
    const postChannel = supabase
      .channel(`post_sync_${id}`)
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'posts', 
        filter: `id_post=eq.${id}` 
      }, (payload) => {
        console.log('[Realtime] Post Table Update:', payload);
        setDetails((prev) => {
          if (!prev) return prev;
          return { ...prev, post: payload.new as ContentPost };
        });
      })
      .subscribe((status) => {
        console.log(`[Realtime] Post channel status: ${status}`);
      });

    // Subscribe to scene assets with client-side filtering fallback
    const assetsChannel = supabase
      .channel(`assets_sync_${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'imagens' }, (p) => {
        const targetId = (p.new as { id_post: string })?.id_post || (p.old as { id_post: string })?.id_post;
        if (targetId === id) refreshAssets('imagens_event');
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'audios' }, (p) => {
        const targetId = (p.new as { id_post: string })?.id_post || (p.old as { id_post: string })?.id_post;
        if (targetId === id) refreshAssets('audios_event');
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'videos_cenas' }, (p) => {
        const targetId = (p.new as { id_post: string })?.id_post || (p.old as { id_post: string })?.id_post;
        if (targetId === id) refreshAssets('videos_cenas_event');
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'videos' }, (p) => {
        const targetId = (p.new as { id_post: string })?.id_post || (p.old as { id_post: string })?.id_post;
        if (targetId === id) refreshAssets('final_video_event');
      })
      .subscribe((status) => {
        console.log(`[Realtime] Assets channel status: ${status}`);
      });

    return () => { 
      console.log(`[Editor] Cleaning up realtime for ${id}`);
      supabase.removeChannel(postChannel); 
      supabase.removeChannel(assetsChannel);
    };
  }, [id, refreshAssets]);

  // --- POLLING FALLBACK (Separate effect to handle isProcessing updates safely) ---
  useEffect(() => {
    if (!id) return;

    let extendedPollingCounter = 0;
    const pollingInterval = setInterval(() => {
      // Poll if actively processing OR for 30 seconds after it finishes
      if (isProcessingRef.current) {
        extendedPollingCounter = 10; // Reset to 10 iterations (30s)
        console.log('[Editor] Polling assets during production...');
        refreshAssets('polling_active_production');
      } else if (extendedPollingCounter > 0) {
        extendedPollingCounter--;
        console.log(`[Editor] Polling assets (EXTENDED MODE - ${extendedPollingCounter} left)...`);
        refreshAssets('polling_extended');
      }
    }, 3000); // More aggressive polling (3s)

    return () => clearInterval(pollingInterval);
  }, [id, refreshAssets]);

  // --- SEQUENTIAL AUTOMATION LOGIC ---
  useEffect(() => {
    if (automationState === 'idle' || !details || !details.post?.roteiro_gerado) return;

    const script = JSON.parse(details.post.roteiro_gerado);
    const scenes = script.cenas || [];

    if (automationState === 'waiting_assets') {
      const hasAllAssets = scenes.every((scene: { numero: number | string }) => {
        const hasImg = details.imagens.some(img => Number(img.numero_cena) === Number(scene.numero));
        const hasAud = details.audios.some(aud => Number(aud.numero_cena) === Number(scene.numero));
        return hasImg && hasAud;
      });

      if (hasAllAssets && !isProcessingRef.current) {
        setAutomationState('waiting_scenes');
        alert('Assets gerados com sucesso! Iniciando renderização das cenas restantes...');
        
        const scenesToRender = scenes.filter((scene: { numero: number | string }) => {
          return !details.videos_cenas?.some(v => Number(v.numero_cena) === Number(scene.numero));
        });

        if (scenesToRender.length > 0) {
          renderAllScenes(id as string, scenesToRender, details.imagens, details.audios).catch(err => {
             console.error(err);
             setAutomationState('idle');
             alert('Erro ao iniciar renderização na automação.');
          });
        }
      }
    } else if (automationState === 'waiting_scenes') {
      const hasAllVideos = scenes.every((scene: { numero: number | string }) => {
        return details.videos_cenas?.some(v => Number(v.numero_cena) === Number(scene.numero));
      });

      if (hasAllVideos && !isProcessingRef.current) {
        setAutomationState('idle');
        const proceed = confirm('Todas as cenas foram renderizadas! Deseja compilar o vídeo final agora?');
        if (proceed) {
          const urls = (details.videos_cenas || [])
            .sort((a, b) => a.numero_cena - b.numero_cena)
            .map(v => v.video_url);
          compileFinalVideo(id as string, urls).catch(err => {
             console.error(err);
             alert('Erro ao iniciar compilação.');
          });
        }
      }
    }
  }, [details, automationState, id, renderAllScenes, compileFinalVideo]);

  const handleGenerateAssets = async () => {
    if (!details?.post?.roteiro_gerado) return;
    
    const confirmGen = confirm('Isto vai gerar os assets (imagem e áudio) para todas as cenas. Deseja prosseguir?');
    if (!confirmGen) return;

    try {
      const script = JSON.parse(details.post.roteiro_gerado);
      await generateAssets(id as string, script.cenas, script.voice_settings);
    } catch {
      alert('Erro ao iniciar geração de assets.');
    }
  };

  const handleRenderAllScenes = async () => {
    if (!details?.post?.roteiro_gerado) return;
    
    const script = JSON.parse(details.post.roteiro_gerado);
    const scenes = script.cenas;
    
    // Check for missing assets
    const missingAssets = scenes.some((scene: { numero: number | string }) => {
      const hasImg = details.imagens.some(img => Number(img.numero_cena) === Number(scene.numero));
      const hasAud = details.audios.some(aud => Number(aud.numero_cena) === Number(scene.numero));
      return !hasImg || !hasAud;
    });

    if (missingAssets) {
      const shouldGenAssets = confirm('Faltam assets para algumas cenas. Deseja gerar os assets que faltam antes de renderizar as cenas?');
      if (shouldGenAssets) {
        await generateAssets(id as string, scenes, script.voice_settings);
        // We don't chain automatically here because asset generation is async and takes time
        alert('Geração de assets iniciada. Aguarde a conclusão para renderizar as cenas.');
        return;
      }
    } else {
      const confirmRender = confirm('Isto vai renderizar todas as cenas do vídeo. Deseja prosseguir?');
      if (!confirmRender) return;
    }

    try {
      await renderAllScenes(id as string, scenes, details.imagens, details.audios);
    } catch {
      alert('Erro ao iniciar renderização das cenas.');
    }
  };

  const handleRenderFinal = async () => {
    if (!id || !details?.post?.roteiro_gerado) return;
    
    const script = JSON.parse(details.post.roteiro_gerado);
    const scenes = script.cenas;
    
    const hasAllAssets = scenes.every((scene: { numero: number | string }) => {
      const hasImg = details.imagens.some(img => Number(img.numero_cena) === Number(scene.numero));
      const hasAud = details.audios.some(aud => Number(aud.numero_cena) === Number(scene.numero));
      return hasImg && hasAud;
    });

    const hasAllVideos = scenes.every((scene: { numero: number | string }) => {
      return details.videos_cenas?.some(v => Number(v.numero_cena) === Number(scene.numero));
    });

    if (!hasAllAssets) {
      const proceed = confirm('Existem assets pendentes. O sistema irá gerar os assets ausentes, renderizar as cenas restantes e compilar o vídeo final. Prosseguir?');
      if (proceed) {
        const scenesWithMissingAssets = scenes.filter((scene: { numero: number | string }) => {
          const hasImg = details.imagens.some(img => Number(img.numero_cena) === Number(scene.numero));
          const hasAud = details.audios.some(aud => Number(aud.numero_cena) === Number(scene.numero));
          return !(hasImg && hasAud);
        });
        
        setAutomationState('waiting_assets');
        await generateAssets(id as string, scenesWithMissingAssets, script.voice_settings);
        return;
      }
      return;
    }

    if (!hasAllVideos) {
      const proceed = confirm('Algumas cenas ainda não foram renderizadas. O sistema irá renderizar as pendentes e compilar o vídeo. Prosseguir?');
      if (proceed) {
        const scenesToRender = scenes.filter((scene: { numero: number | string }) => {
          return !details.videos_cenas?.some(v => Number(v.numero_cena) === Number(scene.numero));
        });

        setAutomationState('waiting_scenes');
        await renderAllScenes(id as string, scenesToRender, details.imagens, details.audios);
        return;
      }
      return;
    }

    const urls = (details.videos_cenas || [])
      .sort((a, b) => a.numero_cena - b.numero_cena)
      .map(v => v.video_url);
    
    if (urls.length === 0) {
      alert('Nenhum fragmento de vídeo encontrado para compilar.');
      return;
    }
    
    const confirmCompile = confirm('Tudo pronto! Deseja iniciar a compilação do vídeo master final?');
    if (!confirmCompile) return;

    await compileFinalVideo(id as string, urls);
  };

  const handlePublish = async (id_conta?: string) => {
    if (!id) return;
    
    if (!id_conta) {
      alert("Por favor, selecione uma conta para publicar.");
      return;
    }

    const confirmPublish = confirm("Deseja enviar este post para a linha de publicação?");
    if (!confirmPublish) return;

    try {
      const response = await fetch('https://n8n.sfaisolutions.com/webhook/81b0dbd8-a5cb-4e78-ad11-e0b025ab25f5', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer RqsEZoRFwm6zW8Rs'
        },
        body: JSON.stringify({ 
          id_post: id,
          id_conta: id_conta,
          action: 'publish_post'
        }),
      });

      if (response.ok) {
        alert("Post enviado para publicação com sucesso!");
      } else {
        throw new Error("Erro ao publicar");
      }
    } catch (err) {
      console.error(err);
      alert("Falha ao disparar o webhook de publicação.");
    }
  };

  const handleSave = async (updatedJson?: string) => {
    if (!id || !details) return;
    setIsSaving(true);
    try {
      const jsonToSave = updatedJson || details.post?.roteiro_gerado || '{}';
      
      // Update multiple columns: roteiro, titulo and tema
      await updatePostInSupabase(id as string, { 
        roteiro_gerado: jsonToSave,
        titulo_post: details.post?.titulo_post,
        tema_post: details.post?.tema_post
      });

      console.log('[Editor] ✅ Post updated successfully (JSON + Metadata)');
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar o post.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDuplicateToArchitect = async () => {
    if (!id) return;
    const proceed = confirm('Deseja criar um novo rascunho em branco para gerar uma nova versão com o Arquiteto? O post atual continuará salvo na sua biblioteca intacto.');
    if (!proceed) return;

    setIsDuplicating(true);
    try {
      const newId = await duplicatePostAsDraft(id as string);
      router.push(`/conteudo/chat?id_post=${newId}`);
    } catch (err) {
      console.error(err);
      alert('Erro ao criar rascunho.');
    } finally {
      setIsDuplicating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen space-y-4 bg-zinc-950 text-white">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
        <p className="text-zinc-500 font-black uppercase tracking-widest text-xs text-center">
          Iniciando Estúdio de Produção...
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-zinc-950 text-zinc-100 overflow-hidden">
      {/* Top Navigation / Toolbar */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-xl">
        <div className="flex items-center gap-6 flex-1">
          <button onClick={() => router.push('/conteudo')} className="p-2 hover:bg-zinc-800 rounded-full transition-colors text-zinc-400">
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <button 
            onClick={handleDuplicateToArchitect}
            disabled={isDuplicating || isProcessing}
            className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
            title="Voltar para o Arquiteto e gerar uma nova versão"
          >
            {isDuplicating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Bot className="w-3.5 h-3.5" />}
            Voltar p/ Arquiteto
          </button>

          <div className="flex flex-col min-w-0 flex-1 max-w-2xl">
            <div className="flex items-center gap-3">
              <input 
                value={details?.post?.titulo_post || ''}
                onChange={(e) => setDetails(prev => prev ? {
                  ...prev,
                  post: { ...prev.post!, titulo_post: e.target.value }
                } : null)}
                placeholder="Título do Post"
                className="bg-transparent border-none p-0 text-sm font-black uppercase tracking-tighter text-white focus:ring-0 w-full placeholder:text-zinc-700"
              />
            </div>
            <div className="flex items-center gap-2">
              <input 
                value={details?.post?.tema_post || ''}
                onChange={(e) => setDetails(prev => prev ? {
                  ...prev,
                  post: { ...prev.post!, tema_post: e.target.value }
                } : null)}
                placeholder="Tema ou Briefing"
                className="bg-transparent border-none p-0 text-[10px] font-mono text-zinc-500 focus:ring-0 w-full placeholder:text-zinc-800"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={handleGenerateAssets}
            disabled={isProcessing}
            className="flex items-center gap-2 px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Assets
          </button>
          
          <button 
            onClick={handleRenderAllScenes}
            disabled={isProcessing}
            className="flex items-center gap-2 px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
          >
            <Film className="w-3.5 h-3.5 text-indigo-500" />
            Renderizar
          </button>

          <button 
            onClick={() => handleSave()}
            disabled={isSaving || !details?.post}
            className="flex items-center gap-2 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Salvar Alterações
          </button>

          <button 
            onClick={handleRenderFinal}
            disabled={isProcessing}
            className="flex items-center gap-2 px-4 py-1.5 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-500 border border-emerald-500/20 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
          >
            {isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            Compilar
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 overflow-hidden relative">
        {details?.post && (
          <ScriptStudio
            key={`studio-${id}-${details.imagens.length}-${details.audios.length}-${details.videos_cenas?.length}-${details.videos.length}`}
            rawJson={details.post.roteiro_gerado}
            post={details.post}
            imagens={details.imagens}
            audios={details.audios}
            videos_cenas={details.videos_cenas}
            videos={details.videos}
            accounts={accounts}
            onPublish={handlePublish}
            onSave={(json) => {              // Local update only, persistence happens on Save button
              setDetails((prev) => {
                if (!prev || !prev.post) return prev;
                return {
                  ...prev,
                  post: { ...prev.post, roteiro_gerado: json }
                };
              });
            }}
          />
        )}
      </main>

      {/* Footer Info */}
      <footer className="px-6 py-2 border-t border-zinc-900 bg-black text-[9px] font-bold text-zinc-600 uppercase tracking-[0.2em] flex justify-between">
        <span>Cocreator Studio Engine</span>
        <span>{details?.post?.id_conta || 'Default Account'}</span>
      </footer>
    </div>
  );
}
