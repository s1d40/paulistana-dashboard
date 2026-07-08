'use client';
export const dynamic = 'force-dynamic';

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
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Clear save timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

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

  // Keep a ref of details to avoid stale closure in realtime listeners
  const detailsRef = useRef(details);
  useEffect(() => {
    detailsRef.current = details;
  }, [details]);

  const extendedPollingCounterRef = useRef(0);

  const refreshAssets = useCallback(async (source: string) => {
    console.log(`[Editor] 🔄 Refreshing assets triggered by: ${source} at ${new Date().toLocaleTimeString()}`);
    
    // Reset extended polling counter to 100 iterations (5 minutes / 300 seconds) on any manual/event action
    if (source !== 'polling_extended' && source !== 'polling_active_production') {
      console.log('[Editor] 🚀 Resetting extended polling counter to 100 (5 minutes of active polling)...');
      extendedPollingCounterRef.current = 100;
    }

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
        const oldImg = p.old as { id_imagem?: string; id_post?: string };
        const newImg = p.new as { id_post?: string };
        const targetId = newImg?.id_post || oldImg?.id_post;
        if (targetId === id) {
          refreshAssets('imagens_event');
        } else if (p.eventType === 'DELETE' && oldImg?.id_imagem) {
          const currentImgs = detailsRef.current?.imagens || [];
          const wasDeleted = currentImgs.some(img => (img as any).id_imagem === oldImg.id_imagem);
          if (wasDeleted) refreshAssets('imagens_event_delete');
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'audios' }, (p) => {
        const oldAud = p.old as { id_audio?: string; id_post?: string };
        const newAud = p.new as { id_post?: string };
        const targetId = newAud?.id_post || oldAud?.id_post;
        if (targetId === id) {
          refreshAssets('audios_event');
        } else if (p.eventType === 'DELETE' && oldAud?.id_audio) {
          const currentAuds = detailsRef.current?.audios || [];
          const wasDeleted = currentAuds.some(aud => aud.id_audio === oldAud.id_audio);
          if (wasDeleted) refreshAssets('audios_event_delete');
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'videos_cenas' }, (p) => {
        const oldVC = p.old as { id?: string; id_post?: string };
        const newVC = p.new as { id_post?: string };
        const targetId = newVC?.id_post || oldVC?.id_post;
        if (targetId === id) {
          refreshAssets('videos_cenas_event');
        } else if (p.eventType === 'DELETE' && oldVC?.id) {
          const currentVCs = detailsRef.current?.videos_cenas || [];
          const wasDeleted = currentVCs.some(vc => vc.id === oldVC.id);
          if (wasDeleted) refreshAssets('videos_cenas_event_delete');
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'videos' }, (p) => {
        const oldVid = p.old as { id_video_final?: string; id_post?: string };
        const newVid = p.new as { id_post?: string };
        const targetId = newVid?.id_post || oldVid?.id_post;
        if (targetId === id) {
          refreshAssets('final_video_event');
        } else if (p.eventType === 'DELETE' && oldVid?.id_video_final) {
          const currentVids = detailsRef.current?.videos || [];
          const wasDeleted = currentVids.some(v => v.id_video_final === oldVid.id_video_final);
          if (wasDeleted) refreshAssets('final_video_event_delete');
        }
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

    const pollingInterval = setInterval(() => {
      // Poll if actively processing OR for 30 seconds after it finishes
      if (isProcessingRef.current) {
        extendedPollingCounterRef.current = 10; // Reset to 10 iterations (30s)
        console.log('[Editor] Polling assets during production...');
        refreshAssets('polling_active_production');
      } else if (extendedPollingCounterRef.current > 0) {
        extendedPollingCounterRef.current--;
        console.log(`[Editor] Polling assets (EXTENDED MODE - ${extendedPollingCounterRef.current} left)...`);
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
          const urls = scenes
            .map((scene: { numero: number }) => {
              const v = details.videos_cenas?.find(vc => Number(vc.numero_cena) === Number(scene.numero));
              return v?.video_url;
            })
            .filter(Boolean) as string[];
          compileFinalVideo(id as string, urls).catch(err => {
             console.error(err);
             alert('Erro ao iniciar compilação.');
          });
        }
      }
    }
  }, [details, automationState, id, renderAllScenes, compileFinalVideo]);

  const invalidateFinalVideo = async () => {
    if (id) {
      const { error } = await supabase.from('videos').delete().eq('id_post', id as string);
      if (error) console.error('[Editor] Error deleting final video:', error);
    }
  };

  const handleGenerateAssets = async () => {
    if (!details?.post?.roteiro_gerado) return;
    
    const confirmGen = confirm('Isto vai gerar os assets (imagem e áudio) para todas as cenas. Deseja prosseguir?');
    if (!confirmGen) return;

    try {
      await invalidateFinalVideo();
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
        await invalidateFinalVideo();
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
      await invalidateFinalVideo();
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

    const urls = scenes
      .map((scene: { numero: number }) => {
        const v = details.videos_cenas?.find(vc => Number(vc.numero_cena) === Number(scene.numero));
        return v?.video_url;
      })
      .filter(Boolean) as string[];
    
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
      const response = await fetch('/api/content/publish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postId: id,
          accountId: id_conta,
          platform: 'all'
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

  const handleSchedule = async (id_conta: string, date: string) => {
    if (!id) return;
    if (!id_conta) {
      alert("Por favor, selecione uma conta para agendar.");
      return;
    }
    if (!date) {
      alert("Por favor, selecione uma data e horário.");
      return;
    }

    const confirmSchedule = confirm(`Deseja agendar este post para ${new Date(date).toLocaleString()}?`);
    if (!confirmSchedule) return;

    try {
      const { error } = await supabase
        .from('posts')
        .update({
          agendado: date,
          status: 'Agendado'
        })
        .eq('id_post', id);

      if (!error) {
        alert("Post agendado com sucesso! O robô publicará na data configurada.");
        window.location.reload();
      } else {
        throw error;
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao agendar o post.");
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
    
    // Se o post ainda não tem roteiro (está em branco/draft inicial), apenas volte para o chat
    if (!details?.post?.roteiro_gerado || details.post.roteiro_gerado.trim() === '' || details.post.roteiro_gerado === '{}') {
      router.push(`/conteudo/chat?id_post=${id}`);
      return;
    }

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
            onSchedule={handleSchedule}
            onRefresh={() => refreshAssets('manual_delete')}
            onSave={(json) => {
              // Update local state immediately for snappy UI responsiveness
              setDetails((prev) => {
                if (!prev || !prev.post) return prev;
                return {
                  ...prev,
                  post: { ...prev.post, roteiro_gerado: json }
                };
              });

              // Debounce Supabase persistence to prevent overloading database while typing
              if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
              }
              saveTimeoutRef.current = setTimeout(async () => {
                console.log('[Editor] 💾 Auto-saving script to database...');
                try {
                  await updatePostInSupabase(id as string, { 
                    roteiro_gerado: json
                  });
                  console.log('[Editor] 💾 Auto-saved successfully!');
                } catch (err) {
                  console.error('[Editor] ❌ Auto-save failed:', err);
                }
              }, 1000);
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
