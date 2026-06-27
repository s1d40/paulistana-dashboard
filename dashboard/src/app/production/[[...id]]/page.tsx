'use client';

import { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { usePresetStore, SystemMessageSession } from '@/store/presetStore';
import { useProductionQueue } from '@/store/production-queue';
import { 
  PlayCircle, AlertCircle, Loader2, CheckCircle2, 
  PenTool, Sparkles, Package, Clock, Settings2, 
  Lock, Unlock, ChevronRight, ChevronDown, ChevronLeft, ShieldCheck,
  Music, Image as ImageIcon, Video, Maximize,
  Copy, Download, Share2, Calendar, ExternalLink,
  Layers, Globe, CalendarDays, MoreHorizontal, Type, Smartphone, ListChecks, FolderKanban
} from 'lucide-react';
import ChatPanel from '@/components/chat-panel';
import PresetSelector from '@/components/preset-selector';
import PromptEditor from '@/components/prompt-editor';
import AccountSelector from '@/components/account-selector';
import ProductSelector from '@/components/product-selector';
import { fetchProducts, fetchProductionLists, fetchProductionBatches, createProductionBatch, fetchContentPosts, fetchTable, fetchAccounts, fetchClients, GID_VIDEOS, GID_IMAGENS, GID_AUDIOS, Product, ProductionList, ProductionBatch, Account, Client, PostImage, PostAudio, PostVideo, PostVideoCena } from '@/services/supabase-service';
import clsx from 'clsx';
import { supabase } from '@/lib/supabase';

interface ProductionItem {
  uuid: string;
  produto: string;
  slug: string;
  status: 'Aguardando' | 'Processando' | 'Pronto' | 'Erro';
  videoUrl?: string;
  images: string[];
  audios: string[];
  customPrompt?: string;
  tituloOtimizado?: string;
  captions?: string;
  hashtags?: string;
  status_agendamento?: string;
  data_agendamento?: string;
  
  // Staging Area Flags
  hasScript?: boolean;
  scriptGeneratingStatus?: 'idle' | 'generating' | 'success' | 'error';
  imagesGeneratingStatus?: 'idle' | 'generating' | 'success' | 'error';
  audiosGeneratingStatus?: 'idle' | 'generating' | 'success' | 'error';
  videoGeneratingStatus?: 'idle' | 'generating' | 'success' | 'error';
}

import { useParams, useRouter } from 'next/navigation';

export default function ProductionStudioPage() {
  const params = useParams();
  const router = useRouter();
  const routeId = params?.id?.[0] || null;
  
  const { presets, activePresetId, updatePreset, setActivePreset } = usePresetStore();
  const { generateSceneImage, generateSceneAudio, renderAllScenes, compileFinalVideo } = useProductionQueue();
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'esteira' | 'listas' | 'agendamentos'>('esteira');
  const [processingItems, setProcessingItems] = useState<Set<string>>(new Set());
  
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'initializing' | 'running' | 'success' | 'error'>('idle');
  const [isDashboardView, setIsDashboardView] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [productionItems, setProductionItems] = useState<ProductionItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [productionLists, setProductionLists] = useState<ProductionList[]>([]);
  const [productionBatches, setProductionBatches] = useState<ProductionBatch[]>([]);
  
  const [dataSource, setDataSource] = useState<'products' | 'lists'>('lists');
  const [selectedListId, setSelectedListId] = useState<string>('');
  const [tempSelectedListId, setTempSelectedListId] = useState<string | null>(null);

  // Single Production (Sandbox) State
  const [chatInput, setChatInput] = useState('');
  const [currentSandboxProduct, setCurrentSandboxProduct] = useState<Product | null>(null);
  const [currentSandboxUuid, setCurrentSandboxUuid] = useState<string | null>(null);
  const [isSingleLoading, setIsSingleLoading] = useState(false);

  // UI States
  const [showConfig, setShowConfig] = useState(false);
  const [isChatCollapsed, setIsChatCollapsed] = useState(true);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);

  // Publishing Context
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  // New States for Multi-Platform Publishing & Bulk Scheduling
  const [publishingStatus, setPublishingStatus] = useState<Record<string, Record<string, 'idle' | 'publishing' | 'published' | 'error'>>>({});
  const [bulkInterval, setBulkInterval] = useState<number>(24);
  const [bulkStartDate, setBulkStartDate] = useState<string>(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    return tomorrow.toISOString().substring(0, 16);
  });
  const [activeCardTabs, setActiveCardTabs] = useState<Record<string, 'video' | 'caption' | 'publish' | 'schedule'>>({});

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

  // Carregar lista de produtos e lotes para a esteira
  useEffect(() => {
    fetchProducts().then(setProducts);
    
    Promise.all([
      fetchProductionLists(),
      fetchProductionBatches()
    ]).then(([lists, batches]) => {
      setProductionLists(lists);
      setProductionBatches(batches);
      
      if (routeId) {
        // Tenta encontrar se é um Lote (Batch) já em andamento
        const foundBatch = batches.find(b => b.id === routeId);
        if (foundBatch) {
          const reconstructedItems: ProductionItem[] = foundBatch.items.map(bi => ({
            uuid: bi.uuid,
            produto: bi.produto,
            slug: bi.slug,
            status: 'Aguardando',
            images: [],
            audios: [],
            hasScript: false,
            scriptGeneratingStatus: 'idle',
            imagesGeneratingStatus: 'idle',
            audiosGeneratingStatus: 'idle',
            videoGeneratingStatus: 'idle'
          }));
          setProductionItems(reconstructedItems);
          setIsDashboardView(true);
          setTempSelectedListId(routeId);
          setStatus('success');
          
          if (foundBatch.account_id) {
             Promise.all([fetchAccounts(), fetchClients()]).then(([accs, clis]) => {
                const acc = accs.find(a => a.id_conta === foundBatch.account_id);
                if (acc) {
                   setSelectedAccount(acc);
                   const cli = clis.find(c => c.id_cliente === acc.id_cliente) || null;
                   setSelectedClient(cli);
                }
             });
          }
          if (foundBatch.preset_id) {
             setActivePreset(foundBatch.preset_id);
          }
          // O useEffect de fetchLiveStatus vai sincronizar o status real depois!
        } else {
          // Se não for Lote, tenta encontrar se é uma Lista Base
          const foundList = lists.find(l => l.id === routeId);
          if (foundList) {
            setSelectedListId(foundList.id);
            setTempSelectedListId(foundList.id);
            // Mantém isDashboardView=false para que o usuário clique em Carregar Lista e crie o lote
          }
        }
      }
    });
  }, [routeId]);

  // Consolidar todas as sessões em um único system message
  const consolidatedSystemMessage = useMemo(() => {
    if (!activePreset || !activePreset.sessions) return '';
    return activePreset.sessions
      .map(s => `### ${s.title}\n${s.content}`)
      .join('\n\n');
  }, [activePreset]);

  // Helpers for copy, download, publishing, and scheduling
  const handleCopyText = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    alert(`${type} copiado com sucesso!`);
  };

  const downloadVideo = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename || 'video.mp4';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('Erro ao baixar o vídeo via Blob:', err);
      // Fallback: abrir em nova aba
      window.open(url, '_blank');
    }
  };

  const publishToPlatform = async (postId: string, platform: string) => {
    if (!selectedAccount) {
      alert('Selecione uma conta para publicar.');
      return;
    }
    
    setPublishingStatus(prev => ({
      ...prev,
      [postId]: {
        ...(prev[postId] || {}),
        [platform]: 'publishing'
      }
    }));

    try {
      const res = await fetch('/api/content/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId,
          accountId: selectedAccount.id_conta,
          platform
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erro desconhecido');
      }

      setPublishingStatus(prev => ({
        ...prev,
        [postId]: {
          ...(prev[postId] || {}),
          [platform]: 'published'
        }
      }));
    } catch (err: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) {
      console.error(`Erro ao publicar para ${platform}:`, err);
      setPublishingStatus(prev => ({
        ...prev,
        [postId]: {
          ...(prev[postId] || {}),
          [platform]: 'error'
        }
      }));
      alert(`Erro ao publicar no ${platform}: ${err.message}`);
    }
  };

  const publishToAllPlatforms = async (postId: string) => {
    // Call the unified publishing webhook once with platform: 'all' to avoid duplicate postings
    await publishToPlatform(postId, 'all');
  };

  const handleDownloadAll = async () => {
    const readyItems = productionItems.filter(item => item.status === 'Pronto' && item.videoUrl);
    if (readyItems.length === 0) {
      alert('Nenhum vídeo pronto para baixar.');
      return;
    }
    for (const item of readyItems) {
      if (item.videoUrl) {
        await downloadVideo(item.videoUrl, `video-${item.slug || 'slug'}-${item.uuid.substring(0,8)}.mp4`);
      }
    }
  };

  const handlePublishAll = async () => {
    const readyItems = productionItems.filter(item => item.status === 'Pronto');
    if (readyItems.length === 0) {
      alert('Nenhum vídeo pronto para publicar.');
      return;
    }
    if (confirm(`Deseja publicar em massa ${readyItems.length} posts para todas as redes sociais configuradas?`)) {
      for (const item of readyItems) {
        await publishToAllPlatforms(item.uuid);
      }
    }
  };

  const handleSchedulePost = async (postId: string, dateStr: string) => {
    if (!selectedAccount) {
      alert('Selecione uma conta para agendar.');
      return;
    }
    try {
      // 1. Atualiza banco
      await supabase.from('posts').update({
        data_agendamento: new Date(dateStr).toISOString(),
        status_agendamento: 'Agendado'
      }).eq('id_post', postId);

      setProductionItems(prev => prev.map(item => {
        if (item.uuid === postId) {
          return {
            ...item,
            status_agendamento: 'Agendado',
            data_agendamento: new Date(dateStr).toISOString()
          };
        }
        return item;
      }));

      // 2. Dispara Webhook
      const res = await fetch('/api/content/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId,
          accountId: selectedAccount.id_conta,
          platform: 'all',
          scheduled_for: new Date(dateStr).toISOString()
        })
      });

      if (!res.ok) throw new Error('Webhook falhou');

      alert('Publicação agendada com sucesso e enviada ao n8n!');
    } catch (err) {
      console.error('Erro ao agendar:', err);
      alert('Falha ao agendar post no webhook n8n.');
    }
  };

  const handleBulkSchedule = async () => {
    const readyItems = productionItems.filter(item => item.status === 'Pronto');
    if (readyItems.length === 0) {
      alert('Nenhum vídeo pronto para agendamento em massa.');
      return;
    }
    if (!selectedAccount) {
      alert('Selecione uma conta primeiro.');
      return;
    }

    if (confirm(`Deseja agendar sequencialmente ${readyItems.length} posts a cada ${bulkInterval} horas a partir de ${new Date(bulkStartDate).toLocaleString()}?`)) {
      const currentStart = new Date(bulkStartDate);
      let successCount = 0;
      
      for (let i = 0; i < readyItems.length; i++) {
        const item = readyItems[i];
        const scheduleTime = new Date(currentStart.getTime() + i * bulkInterval * 60 * 60 * 1000);
        
        try {
          await supabase.from('posts').update({
            data_agendamento: scheduleTime.toISOString(),
            status_agendamento: 'Agendado'
          }).eq('id_post', item.uuid);

          setProductionItems(prev => prev.map(pi => pi.uuid === item.uuid ? {
            ...pi,
            status_agendamento: 'Agendado',
            data_agendamento: scheduleTime.toISOString()
          } : pi));

          // Enviar ao n8n
          await fetch('/api/content/publish', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              postId: item.uuid,
              accountId: selectedAccount.id_conta,
              platform: 'all',
              scheduled_for: scheduleTime.toISOString()
            })
          });
          
          successCount++;
        } catch (e) {
          console.error(`Falha no agendamento do post ${item.uuid}`, e);
        }
      }
      
      alert(`Agendamento em massa concluído! ${successCount}/${readyItems.length} enviados com sucesso.`);
    }
  };

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
            
            if (livePost?.status === 'Concluído' || liveVideo) {
              newStatus = 'Pronto';
            } else if (livePost?.status === 'Produzir' || livePost?.status === 'Processando' || processingItems.has(item.uuid)) {
              newStatus = 'Processando';
            } else if (livePost?.status === 'Erro na Produção' && !processingItems.has(item.uuid)) {
              newStatus = 'Erro';
            } else if (livePost) {
              newStatus = 'Aguardando';
            }

            return { 
              ...item, 
              status: newStatus,
              videoUrl: liveVideo?.video_final_url,
              images: liveImages.map(img => img.image_url || img.url_imagem_fundo || ''),
              audios: liveAudios.map(audio => audio.audio_url || ''),
              tituloOtimizado: livePost?.titulo_post || item.tituloOtimizado,
              captions: livePost?.captions || item.captions,
              hashtags: livePost?.hashtags || item.hashtags,
              status_agendamento: livePost?.status_agendamento || item.status_agendamento,
              data_agendamento: livePost?.data_agendamento || item.data_agendamento
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

  const handleSandboxToolSuccess = async (toolName: string) => {
    if (toolName !== 'save_single_script' || !currentSandboxProduct || !currentSandboxUuid) return;

    // Adiciona na fila visualmente
    const item: ProductionItem = { 
      uuid: currentSandboxUuid, 
      produto: currentSandboxProduct.Produto,
      slug: currentSandboxProduct.slug_imagem_real,
      status: 'Processando',
      images: [],
      audios: []
    };
    setProductionItems(prev => [item, ...prev]);
    setIsSingleLoading(true);
    setIsDashboardView(true); // Trigger Monitoring Dashboard

    try {
      // 1. Fetch script from DB that the agent just saved
      const { data, error } = await supabase.from('posts').select('roteiro_gerado').eq('id_post', currentSandboxUuid).single();
      if (error || !data?.roteiro_gerado) throw new Error('Roteiro não encontrado no banco após confirmação da ferramenta.');
      
      let rawScript;
      if (typeof data.roteiro_gerado === 'string') {
        rawScript = JSON.parse(data.roteiro_gerado);
      } else {
        rawScript = data.roteiro_gerado;
      }
      
      const generatedScript = normalizeScript(rawScript);

      // 2. Executar Pipeline de Assets e Renderização com feedback visual
      const finalVideoUrl = await runAssetPipeline(currentSandboxUuid, currentSandboxProduct.Produto, generatedScript.cenas, generatedScript.voice_settings, (type, count) => {
        setProductionItems(prev => prev.map(i => i.uuid === currentSandboxUuid ? { 
          ...i, 
          [type === 'image' ? 'images' : 'audios']: new Array(count).fill('ok') 
        } : i));
      });
      
      // 3. Atualizar Status
      setProductionItems(prev => prev.map(i => i.uuid === currentSandboxUuid ? { ...i, status: 'Pronto', videoUrl: finalVideoUrl } : i));

      // Limpa a seleção para o próximo post
      setCurrentSandboxProduct(null);
      setCurrentSandboxUuid(null);
      setChatInput(activePreset?.prompt || '');
    } catch (err) {
      console.error(err);
      setProductionItems(prev => prev.map(i => i.uuid === currentSandboxUuid ? { ...i, status: 'Erro' } : i));
      alert('Erro na orquestração da produção individual.');
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

  // --- SHARED ORCHESTRATION PIPELINE ---
  const normalizeScript = (rawScript: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) => {
    const script = { ...rawScript };
    if (script.cenas && Array.isArray(script.cenas)) {
      script.cenas = script.cenas.map((cena: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) => {
        const updatedCena = { 
          ...cena,
          id_cena: cena.id_cena || crypto.randomUUID()
        };
        if (!updatedCena.replicate) {
          updatedCena.replicate = {
            model_url: 'https://api.replicate.com/v1/models/google/nano-banana/predictions',
            input: {
              prompt: updatedCena.prompt_visual,
              negative_prompt: updatedCena.prompt_negativo,
              aspect_ratio: '9:16',
              output_format: 'jpg'
            }
          };
        }
        return updatedCena;
      });
    }
    const defaultVoice = {
      model_id: "eleven_multilingual_v2",
      stability: 0.7,
      similarity_boost: 0.75,
      style: 0.15,
      use_speaker_boost: true,
      speed: 1.10
    };
    if (!script.voice_settings) {
      script.voice_settings = defaultVoice;
    }
    return script;
  };

  const runAssetPipeline = async (uuid: string, itemName: string, scenes: any[], voiceSettings: any /* eslint-disable-line @typescript-eslint/no-explicit-any */, onProgress?: (type: 'image' | 'audio', count: number) => void) => {
    // 1. Aguardar Assets (Imagens/Áudios) ficarem prontos via Polling
    let allImages: PostImage[] = [];
    let allAudios: PostAudio[] = [];
    let assetsReady = false;
    let attempts = 0;

    while (!assetsReady && attempts < 60) { // Espera até 5 minutos
      const [imgsRes, audsRes] = await Promise.all([
        supabase.from('imagens').select('*').eq('id_post', uuid),
        supabase.from('audios').select('*').eq('id_post', uuid)
      ]);
      
      allImages = (imgsRes.data || []).filter(img => img.image_url || img.url_imagem_fundo) as PostImage[];
      allAudios = (audsRes.data || []).filter(aud => aud.audio_url) as PostAudio[];

      if (onProgress) {
        onProgress('image', allImages.length);
        onProgress('audio', allAudios.length);
      }

      assetsReady = scenes.every((scene: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) => {
        const hasImg = allImages.some(img => Number(img.numero_cena) === Number(scene.numero));
        const hasAud = allAudios.some(aud => Number(aud.numero_cena) === Number(scene.numero));
        return hasImg && hasAud;
      });

      if (!assetsReady) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        attempts++;
      }
    }

    if (!assetsReady) {
      throw new Error(`Timeout: Imagens ou Áudios demoraram muito para gerar. Tente renderizar o vídeo novamente mais tarde para ${itemName}.`);
    }

    // 2. Renderizar Cenas Individuais
    await renderAllScenes(uuid, scenes, allImages, allAudios);

    // 3. Esperar Cenas Renderizadas
    let scenesReady = false;
    attempts = 0;
    let allVideos: PostVideoCena[] = [];
    
    while (!scenesReady && attempts < 80) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      const vidsRes = await supabase.from('videos_cenas').select('*').eq('id_post', uuid);
      allVideos = (vidsRes.data || []) as PostVideoCena[];
      
      const itemVideos = allVideos.filter(v => v.video_url);
      scenesReady = scenes.every((scene: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) => itemVideos.some(v => Number(v.numero_cena) === Number(scene.numero)));
      attempts++;
    }

    if (!scenesReady) throw new Error(`Timeout aguardando N8N renderizar as cenas visuais para ${itemName}`);

    // 4. Compilação Final (Juntar Cenas)
    const videoUrls = allVideos
      .filter(v => v.video_url)
      .sort((a, b) => Number(a.numero_cena) - Number(b.numero_cena))
      .map(v => v.video_url)
      .filter(Boolean) as string[];

    await compileFinalVideo(uuid, videoUrls);

    // 5. Esperar Vídeo Final Compilado no Supabase
    let videoFinalReady = false;
    attempts = 0;
    let finalVideoUrl = '';

    while (!videoFinalReady && attempts < 60) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      const finalVidRes = await supabase.from('videos').select('*').eq('id_post', uuid).maybeSingle();
      
      if (finalVidRes.data && finalVidRes.data.video_final_url) {
        videoFinalReady = true;
        finalVideoUrl = finalVidRes.data.video_final_url;
      }
      attempts++;
    }

    if (!videoFinalReady) throw new Error(`Timeout aguardando vídeo final processado para ${itemName}`);

    return finalVideoUrl;
  };

  // --- STAGING AREA E FUNÇÕES GRANULARES ---

  const handleLoadStagingArea = async (testOnly: boolean = false, directListId?: string) => {
    let preset = activePreset || presets[0];
    if (!preset) {
       alert("Nenhum Preset disponível para inicializar.");
       return;
    }
    
    let account = selectedAccount;
    // We don't have access to clientAccounts directly here without state, but we can assume if it's missing, it'll fail at the API.
    if (!account) {
       alert("Nenhuma conta selecionada. Por favor, verifique as configurações (Left Sidebar).");
       return;
    }
    
    let items: ProductionItem[] = [];
    const targetListId = directListId || selectedListId;
    
    if (dataSource === 'products') {
      if (products.length === 0) return;
      items = products.map(p => ({
        uuid: crypto.randomUUID(),
        produto: p.Produto,
        slug: p.slug_imagem_real,
        status: 'Aguardando',
        images: [],
        audios: [],
        hasScript: false,
        scriptGeneratingStatus: 'idle',
        imagesGeneratingStatus: 'idle',
        audiosGeneratingStatus: 'idle',
        videoGeneratingStatus: 'idle'
      }));
    } else {
      const list = productionLists.find(l => l.id === targetListId);
      if (!list || !list.items || list.items.length === 0) return;
      items = list.items.map(item => ({
        uuid: crypto.randomUUID(),
        produto: item.tema,
        slug: 'ideation-list-item', // Mock slug since it's not a real product
        status: 'Aguardando',
        images: [],
        audios: [],
        customPrompt: item.prompt,
        tituloOtimizado: item.titulo_otimizado,
        captions: item.captions,
        hashtags: item.hashtags,
        hasScript: false,
        scriptGeneratingStatus: 'idle',
        imagesGeneratingStatus: 'idle',
        audiosGeneratingStatus: 'idle',
        videoGeneratingStatus: 'idle'
      }));
    }

    if (testOnly && items.length > 0) {
      items = [items[0]]; // Pegar apenas o primeiro item para testar
    }

    setIsLoading(true);
    setIsDashboardView(true);
    setStatus('initializing');
    setErrorMessage('');
    setProductionItems(items);

    try {
      // Pré-Reserva no Sheets
      const initRes = await fetch('/api/production', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'initialize',
          items,
          presetName: preset.name,
          id_conta: account.id_conta
        }),
      });

      if (!initRes.ok) {
        const errData = await initRes.json().catch(() => ({}));
        throw new Error(`Falha ao inicializar registros no banco: ${errData.error || initRes.statusText}`);
      }
      
      // Criar o Lote no Histórico (Controle de Batch)
      const batchName = `Lote de ${items.length} itens - ${new Date().toLocaleString('pt-BR')}`;
      const newBatch = await createProductionBatch({
        name: batchName,
        preset_id: preset.id,
        account_id: account.id_conta,
        items: items.map(i => ({ uuid: i.uuid, produto: i.produto, slug: i.slug }))
      });
      if (newBatch) {
        setProductionBatches(prev => [newBatch, ...prev]);
        router.push('/production/' + newBatch.id);
      }

      setStatus('success');
    } catch (error: unknown) {
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Erro desconhecido');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadExistingBatch = async (batch: ProductionBatch) => {
    setIsLoading(true);
    setIsDashboardView(true);
    setStatus('initializing');
    setErrorMessage('');
    
    // Recriar o state visual inicial
    let items: ProductionItem[] = batch.items.map(item => ({
      uuid: item.uuid,
      produto: item.produto,
      slug: item.slug,
      status: 'Aguardando',
      images: [],
      audios: [],
      hasScript: false,
      scriptGeneratingStatus: 'idle',
      imagesGeneratingStatus: 'idle',
      audiosGeneratingStatus: 'idle',
      videoGeneratingStatus: 'idle'
    }));

    // Inteligência de Sincronização: Perguntar ao Supabase o status real!
    try {
      const uuids = items.map(i => i.uuid);
      // 1. Puxar Posts
      const { data: posts } = await supabase.from('posts').select('id_post, roteiro_json, status, url_video_pronto').in('id_post', uuids);
      // 2. Puxar Imagens
      const { data: images } = await supabase.from('imagens').select('id_post, image_url').in('id_post', uuids);
      // 3. Puxar Áudios
      const { data: audios } = await supabase.from('audios').select('id_post, audio_url').in('id_post', uuids);

      items = items.map(item => {
        const post = posts?.find(p => p.id_post === item.uuid);
        const postImages = images?.filter(img => img.id_post === item.uuid) || [];
        const postAudios = audios?.filter(aud => aud.id_post === item.uuid) || [];

        let statusAtual: 'Aguardando' | 'Processando' | 'Pronto' | 'Erro' = 'Aguardando';
        if (post?.status === 'Concluído' || post?.url_video_pronto) {
           statusAtual = 'Pronto';
        } else if (post?.status === 'Produzir' || post?.status === 'Processando') {
           statusAtual = 'Processando';
        } else if (post?.status === 'Erro na Produção') {
           statusAtual = 'Erro';
        }

        return {
          ...item,
          status: statusAtual,
          hasScript: !!post?.roteiro_json,
          videoUrl: post?.url_video_pronto,
          images: postImages.map(img => img.image_url),
          audios: postAudios.map(aud => aud.audio_url)
        };
      });

    } catch (err) {
      console.error('Erro na sincronização inteligente do Batch', err);
    }

    setProductionItems(items);
    setIsLoading(false);
    setStatus('success');
  };

  const fetchScriptFromDb = async (uuid: string) => {
    const { data, error } = await supabase.from('posts').select('roteiro_gerado').eq('id_post', uuid).maybeSingle();
    if (error || !data || !data.roteiro_gerado) return null;
    const rawScript = typeof data.roteiro_gerado === 'string' ? JSON.parse(data.roteiro_gerado) : data.roteiro_gerado;
    return normalizeScript(rawScript);
  };

  const updateItemState = (uuid: string, updates: Partial<ProductionItem>) => {
    setProductionItems(prev => prev.map(i => i.uuid === uuid ? { ...i, ...updates } : i));
  };

  const handleGenerateScript = async (item: ProductionItem) => {
    if (!activePreset || !selectedAccount) return;
    
    updateItemState(item.uuid, { scriptGeneratingStatus: 'generating' });

    try {
      let newPrompt = item.customPrompt || activePreset.prompt;
      if (dataSource === 'products') {
        const productData = products.find(p => p.slug_imagem_real === item.slug);
        newPrompt = newPrompt.replace(/\[PRODUTO\]/gi, item.produto);
        newPrompt = newPrompt.replace(/\[SLUG\]/gi, item.slug);
        newPrompt = newPrompt.replace(/\[ID_POST\]/gi, item.uuid);
        newPrompt = newPrompt.replace(/\[UUID\]/gi, item.uuid);
        newPrompt = newPrompt.replace(/\[NOME DO PRODUTO\]/gi, item.produto);
        newPrompt = newPrompt.replace(/\[NOME\]/gi, item.produto);
        if (productData) {
          newPrompt = newPrompt.replace(/\[NARRATIVA\]/gi, productData.Restricao_Narrativa || 'Nenhuma');
          newPrompt = newPrompt.replace(/\[VISUAL\]/gi, productData.Restricao_Visual || 'Nenhuma');
        }
      }

      const response = await fetch('/api/chat/roteirista', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_prompt: newPrompt,
          system_message: consolidatedSystemMessage,
          config: {
            model: (activePreset as any /* eslint-disable-line @typescript-eslint/no-explicit-any */)?.config?.model || 'gpt-5.4',
            temperature: (activePreset as any /* eslint-disable-line @typescript-eslint/no-explicit-any */)?.config?.temperature || 0.7,
            prompt: (activePreset as any /* eslint-disable-line @typescript-eslint/no-explicit-any */)?.config?.prompt || newPrompt
          }
        }),
      });

      if (!response.ok) throw new Error(`Erro na geração de roteiro para ${item.produto}`);
      const { script: rawScript } = await response.json();
      const generatedScript = normalizeScript(rawScript);

      const initPostPayload: Record<string, any> = { 
        action: 'init_post',
        id_post: item.uuid,
        tema_post: generatedScript.tema || `Vídeo: ${item.produto}`,
        titulo_post: generatedScript.titulo_otimizado || item.tituloOtimizado || item.produto,
        roteiro_gerado: JSON.stringify(generatedScript),
        status: 'Aguardando Revisão',
        id_conta: selectedAccount.id_conta,
        captions: item.captions || generatedScript.captions || '',
        hashtags: item.hashtags || generatedScript.hashtags || ''
      };

      if (dataSource === 'lists' && selectedListId) {
        initPostPayload.production_list_id = selectedListId;
      }

      const prodRes = await fetch('/api/production', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(initPostPayload),
      });

      if (!prodRes.ok) throw new Error(`Erro ao salvar roteiro no banco`);

      updateItemState(item.uuid, { scriptGeneratingStatus: 'success', hasScript: true});
    } catch (err) {
      console.error(err);
      updateItemState(item.uuid, { scriptGeneratingStatus: 'error' });
      alert(`Falha ao gerar roteiro para ${item.produto}`);
    }
  };

  const handleGenerateImages = async (item: ProductionItem) => {
    updateItemState(item.uuid, { imagesGeneratingStatus: 'generating' });
    try {
      const script = await fetchScriptFromDb(item.uuid);
      if (!script) throw new Error('Roteiro não encontrado no banco. Gere o roteiro primeiro.');
      
      const promises = script.cenas.map((cena: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) => generateSceneImage(item.uuid, cena, undefined));
      await Promise.all(promises);
      
      updateItemState(item.uuid, { imagesGeneratingStatus: 'success'});
    } catch (err: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) {
      console.error(err);
      updateItemState(item.uuid, { imagesGeneratingStatus: 'error' });
      alert(`Erro nas imagens: ${err.message}`);
    }
  };

  const handleGenerateAudios = async (item: ProductionItem) => {
    updateItemState(item.uuid, { audiosGeneratingStatus: 'generating' });
    try {
      const script = await fetchScriptFromDb(item.uuid);
      if (!script) throw new Error('Roteiro não encontrado no banco. Gere o roteiro primeiro.');
      
      const promises = script.cenas.map((cena: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) => generateSceneAudio(item.uuid, cena, script.voice_settings));
      await Promise.all(promises);
      
      updateItemState(item.uuid, { audiosGeneratingStatus: 'success'});
    } catch (err: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) {
      console.error(err);
      updateItemState(item.uuid, { audiosGeneratingStatus: 'error' });
      alert(`Erro nos áudios: ${err.message}`);
    }
  };

  const handleGenerateVideo = async (item: ProductionItem) => {
    updateItemState(item.uuid, { videoGeneratingStatus: 'generating' });
    try {
      const script = await fetchScriptFromDb(item.uuid);
      if (!script) throw new Error('Roteiro não encontrado no banco. Gere o roteiro primeiro.');
      
      setProcessingItems(prev => new Set(prev).add(item.uuid));
      updateItemState(item.uuid, { videoGeneratingStatus: 'idle', status: 'Processando' });
      await supabase.from('posts').update({ status: 'Produzir' }).eq('id_post', item.uuid);
      
    } catch (err: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) {
      console.error(err);
      setProcessingItems(prev => {
        const next = new Set(prev);
        next.delete(item.uuid);
        return next;
      });
      updateItemState(item.uuid, { videoGeneratingStatus: 'error' });
      alert(`Erro no vídeo: ${err.message}`);
    }
  };

  const handleGenerateAll = async (item: ProductionItem) => {
    try {
      setProcessingItems(prev => new Set(prev).add(item.uuid));
      updateItemState(item.uuid, { status: 'Processando' });

      if (!item.hasScript) {
        await handleGenerateScript(item);
      }
      
      const { error } = await supabase
        .from('posts')
        .update({ status: 'Produzir' })
        .eq('id_post', item.uuid);
        
      if (error) {
         console.error("Erro ao enviar para o worker:", error);
         setProcessingItems(prev => {
           const next = new Set(prev);
           next.delete(item.uuid);
           return next;
         });
         updateItemState(item.uuid, { status: 'Aguardando' });
         alert("Erro ao enviar para a esteira do servidor.");
      }
    } catch (err) {
      console.error("Erro no fluxo completo:", err);
      setProcessingItems(prev => {
        const next = new Set(prev);
        next.delete(item.uuid);
        return next;
      });
      updateItemState(item.uuid, { status: 'Aguardando' });
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
          
          <button 
            onClick={() => setIsChatCollapsed(!isChatCollapsed)}
            className={clsx(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
              isChatCollapsed 
                ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20" 
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200"
            )}
            title="Ocultar Chat para expandir Staging Area"
          >
            <PenTool className="w-4 h-4" />
            {isChatCollapsed ? "Mostrar Chat" : "Ocultar Chat"}
          </button>
          
          {/* Lotes Salvos (Batches) */}
          {productionBatches.length > 0 && (
            <div className="flex items-center gap-2 ml-2">
              <div className="relative group">
                <select
                  className="appearance-none bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-xs font-bold text-zinc-600 dark:text-zinc-300 rounded-xl pl-8 pr-8 py-2.5 outline-none w-56 truncate cursor-pointer transition-all border border-zinc-200 dark:border-zinc-700"
                  onChange={(e) => {
                    if (e.target.value) {
                      const batch = productionBatches.find(b => b.id === e.target.value);
                      if (batch && confirm(`Deseja carregar o ${batch.name}? Seu lote atual será substituído na tela.`)) {
                        handleLoadExistingBatch(batch);
                      }
                      e.target.value = ""; // reset
                    }
                  }}
                >
                  <option value="">Recuperar Lote Salvo...</option>
                  {productionBatches.map(batch => (
                    <option key={batch.id} value={batch.id}>
                      {batch.name}
                    </option>
                  ))}
                </select>
                <Clock className="w-4 h-4 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <ChevronDown className="w-3.5 h-3.5 text-zinc-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          )}
          
          <div className="h-8 w-px bg-zinc-200 dark:border-zinc-800" />
          
          <div className="flex flex-col items-end">
             <span className="text-[10px] font-black text-zinc-400 uppercase">Status Global</span>
             <span className="text-xs font-bold text-zinc-600 dark:text-zinc-300">
               {dataSource === 'products' ? `${products.length} Ativos Carregados` : `${productionLists.find(l => l.id === selectedListId)?.items?.length || 0} Itens na Lista`}
             </span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        
        {/* BIG LIST SELECTOR OVERLAY */}
        {(!isDashboardView && dataSource === 'lists') && (
          <div className="absolute inset-0 z-50 bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-8 animate-in fade-in duration-500">
             <div className="max-w-4xl w-full space-y-8 text-center flex flex-col h-full max-h-[80vh]">
                <div>
                   <div className="w-20 h-20 bg-indigo-600/10 rounded-full flex items-center justify-center mx-auto mb-6">
                     <ListChecks className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
                   </div>
                   <h1 className="text-4xl font-black tracking-tight text-zinc-900 dark:text-white uppercase mb-4">Escolha a Fonte de Ideias</h1>
                   <p className="text-zinc-500 font-medium max-w-lg mx-auto">Para iniciar a Esteira de Produção Autônoma, selecione qual lista de ideação aprovada você deseja processar hoje.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-left overflow-y-auto flex-1 p-4 custom-scrollbar">
                  {productionLists.map(list => (
                     <button
                       key={list.id}
                       onClick={() => setTempSelectedListId(list.id)}
                       className={clsx(
                         "p-6 rounded-3xl border transition-all group flex flex-col items-start gap-4 text-left",
                         tempSelectedListId === list.id 
                           ? "bg-indigo-50 dark:bg-indigo-900/10 border-indigo-500 shadow-xl shadow-indigo-500/20 scale-[1.02]" 
                           : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-indigo-500 hover:shadow-xl hover:shadow-indigo-500/10"
                       )}
                     >
                        <div className={clsx(
                          "w-12 h-12 rounded-2xl flex items-center justify-center transition-transform shrink-0",
                          tempSelectedListId === list.id ? "bg-indigo-600 text-white" : "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 group-hover:scale-110"
                        )}>
                          <FolderKanban className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="text-sm font-black uppercase tracking-tight text-zinc-900 dark:text-white line-clamp-2 leading-tight">{list.name}</h3>
                          <p className="text-xs font-bold text-zinc-500 mt-2 bg-zinc-100 dark:bg-zinc-800 inline-block px-2 py-1 rounded-md">{list.items?.length || 0} Postagens</p>
                        </div>
                     </button>
                  ))}
                  {productionLists.length === 0 && (
                     <div className="col-span-full p-12 border-2 border-dashed border-zinc-300 dark:border-zinc-800 rounded-3xl text-zinc-500 text-center font-bold flex items-center justify-center">
                       Nenhuma lista disponível. Vá para o Mural de Ideias aprovar alguns posts.
                     </div>
                  )}
                </div>

                <div className="pt-6 border-t border-zinc-200 dark:border-zinc-800 flex justify-center">
                   <button
                     onClick={async () => {
                        if (tempSelectedListId) {
                           setSelectedListId(tempSelectedListId);
                           await handleLoadStagingArea(false, tempSelectedListId);
                        }
                     }}
                     disabled={!tempSelectedListId || isLoading}
                     className="px-10 py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-zinc-300 disabled:dark:bg-zinc-800 disabled:text-zinc-500 text-white rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl hover:-translate-y-1 transition-all flex items-center gap-2"
                   >
                     {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Package className="w-5 h-5" />}
                     {isLoading ? "Carregando..." : "Carregar Lista"}
                   </button>
                </div>
             </div>
          </div>
        )}

        {/* Left Sidebar: Controls & Session Editor */}
        <div className={clsx(
          "bg-zinc-50 dark:bg-zinc-900/50 border-r border-zinc-200 dark:border-zinc-800 flex flex-col overflow-hidden transition-all duration-500 ease-in-out z-10",
          isChatCollapsed ? "flex-1" : (showConfig ? "w-[500px]" : "w-[400px]")
        )}>
          <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
            
            {isDashboardView ? (
               /* REAL-TIME MONITORING DASHBOARD */
               <section className="space-y-6 animate-in fade-in slide-in-from-left-4">
                  <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-4">
                    <h2 className="text-sm font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                      <PlayCircle className="w-4 h-4" /> Monitor de Produção
                    </h2>
                    <button 
                      onClick={() => {
                        if (confirm('Deseja voltar para a seleção e interromper o monitoramento atual?')) {
                          router.push('/production');
                          setIsDashboardView(false);
                          setProductionItems([]);
                          setStatus('idle');
                          setSelectedListId('');
                          setTempSelectedListId(null);
                        }
                      }}  
                      className="text-[9px] font-black uppercase text-zinc-400 hover:text-indigo-500 transition-colors flex items-center gap-1"
                    >
                      <ChevronLeft className="w-3 h-3" /> Voltar para Seleção
                    </button>
                  </div>

                  {/* PAINEL DE AÇÕES GLOBAIS EM MASSA */}
                  {productionItems.some(item => item.status === 'Pronto') && (
                    <div className="p-4 rounded-2xl bg-zinc-900 text-white border border-zinc-800 space-y-4 shadow-xl animate-in zoom-in-95 duration-200">
                      <div className="flex items-center gap-2 pb-2 border-b border-zinc-800">
                        <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
                        <h3 className="text-xs font-black uppercase tracking-widest text-zinc-200">Ações em Massa (Lote)</h3>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <button 
                          onClick={handleDownloadAll}
                          className="px-3 py-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 shadow-md shadow-emerald-900/20"
                        >
                          <Download className="w-3.5 h-3.5" /> Baixar Tudo
                        </button>
                        <button 
                          onClick={handlePublishAll}
                          className="px-3 py-2 bg-gradient-to-r from-indigo-600 to-violet-700 hover:from-indigo-500 hover:to-violet-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 shadow-md shadow-indigo-900/20"
                        >
                          <Share2 className="w-3.5 h-3.5" /> Postar Todos
                        </button>
                      </div>

                      <div className="space-y-2 pt-2 border-t border-zinc-800">
                        <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-indigo-400" /> Agendamento Sequencial
                        </span>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex flex-col gap-1">
                            <label className="text-[8px] font-bold text-zinc-500 uppercase">Data de Início</label>
                            <input 
                              type="datetime-local" 
                              value={bulkStartDate}
                              onChange={(e) => setBulkStartDate(e.target.value)}
                              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-1.5 text-[9px] text-zinc-300 outline-none"
                            />
                          </div>
                          
                          <div className="flex flex-col gap-1">
                            <label className="text-[8px] font-bold text-zinc-500 uppercase">Intervalo (Horas)</label>
                            <select 
                              value={bulkInterval}
                              onChange={(e) => setBulkInterval(Number(e.target.value))}
                              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-1.5 text-[9px] text-zinc-300 outline-none text-zinc-400"
                            >
                              <option value={1}>A cada 1 hora</option>
                              <option value={2}>A cada 2 horas</option>
                              <option value={4}>A cada 4 horas</option>
                              <option value={6}>A cada 6 horas</option>
                              <option value={12}>A cada 12 horas</option>
                              <option value={24}>A cada 24 horas</option>
                              <option value={48}>A cada 48 horas</option>
                            </select>
                          </div>
                        </div>

                        <button 
                          onClick={handleBulkSchedule}
                          className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
                        >
                          Agendar em Massa Sequencial
                        </button>
                      </div>
                    </div>
                  )}

                  <div className={clsx(
                    "grid gap-4",
                    isChatCollapsed ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4" : "grid-cols-1 xl:grid-cols-2"
                  )}>
                    {productionItems.map((item) => {
                      const activeTab = activeCardTabs[item.uuid] || 'video';
                      const setCardTab = (tab: 'video' | 'caption' | 'publish' | 'schedule') => setActiveCardTabs(prev => ({ ...prev, [item.uuid]: tab }));
                      
                      // Progress calculation
                      let progress = 5;
                      if (item.hasScript) progress = 25;
                      if ((item.images?.length ?? 0) > 0) progress = 50;
                      if ((item.audios?.length ?? 0) > 0) progress = 75;
                      if (item.status === 'Pronto') progress = 100;

                      return (
                      <div key={item.uuid} className={clsx(
                        "rounded-3xl border transition-all shadow-xl overflow-hidden backdrop-blur-md",
                        item.status === 'Pronto' 
                          ? "bg-white/80 dark:bg-zinc-900/80 border-emerald-500/30 hover:shadow-emerald-500/10" 
                          : "bg-white/60 dark:bg-zinc-900/60 border-zinc-200/50 dark:border-zinc-800/50 hover:border-indigo-500/30"
                      )}>
                        {/* Progress Bar Top */}
                        <div className="w-full h-1 bg-zinc-100 dark:bg-zinc-800">
                          <div className={clsx("h-full transition-all duration-1000 ease-in-out", item.status === 'Pronto' ? "bg-emerald-500" : "bg-indigo-500")} style={{ width: `${progress}%` }} />
                        </div>
                        
                        <div className="p-5 space-y-5">
                          <div className="flex items-start justify-between">
                            <div className="flex gap-4 items-center">
                               <div className={clsx(
                                 "w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner transition-all bg-cover bg-center overflow-hidden shrink-0 border border-zinc-200/50 dark:border-zinc-800/50",
                                 (item.images?.length ?? 0) > 0 ? "" :
                                 item.status === 'Pronto' 
                                   ? "bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-emerald-500/30" 
                                   : "bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-900 text-zinc-500 dark:text-zinc-400"
                               )}
                               style={{
                                 backgroundImage: (item.images?.length ?? 0) > 0 ? `url(${item.images![0]})` : undefined
                               }}
                               >
                                  {(item.images?.length ?? 0) === 0 && (
                                    item.status === 'Pronto' ? <CheckCircle2 className="w-6 h-6" /> : <Package className="w-6 h-6" />
                                  )}
                               </div>
                               <div>
                                 <h4 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-tight leading-none mb-1">{item.produto}</h4>
                                 <p className="text-[10px] font-mono text-zinc-400 tracking-wider">ID: {item.uuid.substring(0,12)}</p>
                               </div>
                            </div>
                            
                            <span className={clsx(
                              "text-[9px] font-black uppercase px-3 py-1 rounded-full border shadow-sm backdrop-blur-sm",
                              item.status === 'Pronto'
                                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                                : item.status === 'Processando'
                                  ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-600 dark:text-indigo-400 animate-pulse"
                                  : "bg-zinc-500/10 border-zinc-500/20 text-zinc-500 dark:text-zinc-400"
                            )}>
                              {item.status}
                            </span>
                          </div>

                          {/* IF NOT READY: PIPELINE STEPS AND GENERATE BUTTONS */}
                          {item.status !== 'Pronto' && (
                            <div className="bg-zinc-50/50 dark:bg-zinc-950/50 rounded-2xl p-4 border border-zinc-100 dark:border-zinc-800/50 space-y-4">
                               {/* Pipeline Trackers */}
                               <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                     <div className={clsx("w-6 h-6 rounded-full flex items-center justify-center text-[10px]", item.hasScript ? "bg-emerald-500 text-white" : "bg-zinc-200 dark:bg-zinc-800 text-zinc-500")}><PenTool className="w-3 h-3"/></div>
                                     <div className={clsx("w-6 h-px", item.hasScript ? "bg-emerald-500" : "bg-zinc-200 dark:bg-zinc-800")} />
                                     <div className={clsx("w-6 h-6 rounded-full flex items-center justify-center text-[10px]", (item.images?.length ?? 0) > 0 ? "bg-emerald-500 text-white" : "bg-zinc-200 dark:bg-zinc-800 text-zinc-500")}><ImageIcon className="w-3 h-3"/></div>
                                     <div className={clsx("w-6 h-px", (item.images?.length ?? 0) > 0 ? "bg-emerald-500" : "bg-zinc-200 dark:bg-zinc-800")} />
                     <div className={clsx("w-6 h-6 rounded-full flex items-center justify-center text-[10px]", (item.audios?.length ?? 0) > 0 ? "bg-emerald-500 text-white" : "bg-zinc-200 dark:bg-zinc-800 text-zinc-500")}><Music className="w-3 h-3"/></div>
                                     <div className={clsx("w-6 h-px", (item.audios?.length ?? 0) > 0 ? "bg-emerald-500" : "bg-zinc-200 dark:bg-zinc-800")} />
                                     <div className={clsx("w-6 h-6 rounded-full flex items-center justify-center text-[10px]", item.videoGeneratingStatus === 'success' ? "bg-emerald-500 text-white" : "bg-zinc-200 dark:bg-zinc-800 text-zinc-500")}><Video className="w-3 h-3"/></div>
                                  </div>
                                  <span className="text-[9px] font-black uppercase text-zinc-400">{progress}% Completo</span>
                               </div>

                               <div className="grid grid-cols-2 gap-2">
                                  <button 
                                    onClick={() => handleGenerateAll(item)}
                                    disabled={item.status === 'Processando' || processingItems.has(item.uuid)}
                                    className={clsx(
                                      "col-span-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-2",
                                      (item.status === 'Processando' || processingItems.has(item.uuid)) ? "bg-zinc-200 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed" : 
                                      item.status === 'Erro' ? "bg-red-500/10 border border-red-500/30 text-red-500 hover:bg-red-500/20" :
                                      "bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white hover:scale-[1.02]"
                                    )}
                                  >
                                    {(item.status === 'Processando' || processingItems.has(item.uuid)) ? <Loader2 className="w-4 h-4 animate-spin" /> : 
                                     item.status === 'Erro' ? <AlertCircle className="w-4 h-4" /> :
                                     <Sparkles className="w-4 h-4" />}
                                    {(item.status === 'Processando' || processingItems.has(item.uuid)) ? 'Processando Automação...' : 
                                     item.status === 'Erro' ? 'Tentar Novamente (Reprocessar)' :
                                     'Gerar Vídeo Completo (Auto)'}
                                  </button>
                                  
                                  {item.hasScript ? (
                                    <a 
                                       href={`/conteudo/editor/${item.uuid}`}
                                       target="_blank"
                                       rel="noopener noreferrer"
                                       className="col-span-2 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border border-indigo-500/20 hover:border-indigo-500/50 text-indigo-500 dark:text-indigo-400 flex items-center justify-center gap-2 hover:bg-indigo-50 dark:hover:bg-indigo-500/10"
                                    >
                                       <ExternalLink className="w-3 h-3" /> Abrir no Estúdio
                                    </a>
                                  ) : (
                                    <button 
                                      onClick={() => handleGenerateScript(item)}
                                      disabled={item.scriptGeneratingStatus === 'generating'}
                                      className="col-span-2 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border border-zinc-500/20 hover:border-zinc-500/50 text-zinc-600 dark:text-zinc-400 flex items-center justify-center gap-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-50"
                                    >
                                      {item.scriptGeneratingStatus === 'generating' ? <Loader2 className="w-3 h-3 animate-spin"/> : <PenTool className="w-3 h-3" />} Gerar Roteiro
                                    </button>
                                  )}
                                  
                                  <details className="col-span-2 group">
                                     <summary className="text-[9px] font-bold uppercase text-zinc-400 hover:text-indigo-400 cursor-pointer flex items-center justify-center gap-1 mt-2">
                                       <MoreHorizontal className="w-3 h-3" /> Controles Avançados
                                     </summary>
                                     <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-800">
                                        <button onClick={() => handleGenerateScript(item)} disabled={item.scriptGeneratingStatus === 'generating' || item.hasScript} className="py-2 rounded-lg text-[9px] font-bold uppercase tracking-wider border bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 hover:border-indigo-400 disabled:opacity-50 flex items-center justify-center gap-1">
                                          {item.scriptGeneratingStatus === 'generating' ? <Loader2 className="w-3 h-3 animate-spin"/> : <PenTool className="w-3 h-3" />} Roteiro
                                        </button>
                                        <button onClick={() => handleGenerateImages(item)} disabled={!item.hasScript || item.imagesGeneratingStatus === 'generating'} className="py-2 rounded-lg text-[9px] font-bold uppercase tracking-wider border bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 hover:border-indigo-400 disabled:opacity-50 flex items-center justify-center gap-1">
                                          {item.imagesGeneratingStatus === 'generating' ? <Loader2 className="w-3 h-3 animate-spin"/> : <ImageIcon className="w-3 h-3" />} Imagens
                                        </button>
                                        <button onClick={() => handleGenerateAudios(item)} disabled={!item.hasScript || item.audiosGeneratingStatus === 'generating'} className="py-2 rounded-lg text-[9px] font-bold uppercase tracking-wider border bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 hover:border-indigo-400 disabled:opacity-50 flex items-center justify-center gap-1">
                                          {item.audiosGeneratingStatus === 'generating' ? <Loader2 className="w-3 h-3 animate-spin"/> : <Music className="w-3 h-3" />} Áudios
                                        </button>
                                        <button onClick={() => handleGenerateVideo(item)} disabled={!item.hasScript || item.videoGeneratingStatus === 'generating'} className="py-2 rounded-lg text-[9px] font-bold uppercase tracking-wider border bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 hover:border-indigo-400 disabled:opacity-50 flex items-center justify-center gap-1">
                                          {item.videoGeneratingStatus === 'generating' ? <Loader2 className="w-3 h-3 animate-spin"/> : <Video className="w-3 h-3" />} Vídeo
                                        </button>
                                     </div>
                                  </details>
                               </div>

                               {item.hasScript && (
                                 <a 
                                   href={`/conteudo/editor/${item.uuid}`} 
                                   target="_blank"
                                   rel="noopener noreferrer"
                                   className="w-full mt-2 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border flex items-center justify-center gap-1.5 bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 shadow-sm"
                                 >
                                   <ExternalLink className="w-3 h-3" /> Abrir no Estúdio Criativo
                                 </a>
                               )}
                            </div>
                          )}

                          {/* IF READY: COMPACT TABS */}
                          {item.status === 'Pronto' && item.videoUrl && (
                            <div className="bg-zinc-50 dark:bg-zinc-950/80 rounded-2xl border border-zinc-100 dark:border-zinc-800/80 overflow-hidden shadow-inner">
                               <div className="flex bg-zinc-100 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
                                  <button onClick={() => setCardTab('video')} className={clsx("flex-1 py-2 text-[9px] font-black uppercase flex items-center justify-center gap-1.5 transition-colors", activeTab === 'video' ? "bg-white dark:bg-zinc-950 text-emerald-600 dark:text-emerald-400 border-t-2 border-t-emerald-500" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300")}><Smartphone className="w-3 h-3"/> Mídia</button>
                                  <button onClick={() => setCardTab('caption')} className={clsx("flex-1 py-2 text-[9px] font-black uppercase flex items-center justify-center gap-1.5 transition-colors", activeTab === 'caption' ? "bg-white dark:bg-zinc-950 text-indigo-600 dark:text-indigo-400 border-t-2 border-t-indigo-500" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300")}><Type className="w-3 h-3"/> Legenda</button>
                                  <button onClick={() => setCardTab('publish')} className={clsx("flex-1 py-2 text-[9px] font-black uppercase flex items-center justify-center gap-1.5 transition-colors", activeTab === 'publish' ? "bg-white dark:bg-zinc-950 text-blue-600 dark:text-blue-400 border-t-2 border-t-blue-500" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300")}><Globe className="w-3 h-3"/> Postar</button>
                                  <button onClick={() => setCardTab('schedule')} className={clsx("flex-1 py-2 text-[9px] font-black uppercase flex items-center justify-center gap-1.5 transition-colors", activeTab === 'schedule' ? "bg-white dark:bg-zinc-950 text-purple-600 dark:text-purple-400 border-t-2 border-t-purple-500" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300")}><CalendarDays className="w-3 h-3"/> Agendar</button>
                               </div>

                               <div className="p-4">
                                  {activeTab === 'video' && (
                                     <div className="space-y-3 animate-in fade-in duration-300">
                                       <div className="rounded-xl overflow-hidden aspect-[9/16] max-h-60 mx-auto bg-black relative shadow-lg ring-1 ring-zinc-800">
                                         <video src={item.videoUrl} controls playsInline className="w-full h-full object-cover" />
                                       </div>
                                       <button onClick={() => downloadVideo(item.videoUrl!, `video-${item.slug || 'slug'}-${item.uuid.substring(0,8)}.mp4`)} className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-md flex items-center justify-center gap-1.5">
                                         <Download className="w-3.5 h-3.5" /> Baixar MP4 HD
                                       </button>
                                     </div>
                                  )}

                                  {activeTab === 'caption' && (
                                     <div className="space-y-3 animate-in fade-in duration-300">
                                       <div className="max-h-48 overflow-y-auto text-[10px] text-zinc-600 dark:text-zinc-300 font-medium whitespace-pre-wrap pr-2 custom-scrollbar">
                                         {item.captions ? (
                                           <>
                                             <p className="font-extrabold text-zinc-800 dark:text-zinc-100 mb-2">{item.tituloOtimizado}</p>
                                             <p>{item.captions}</p>
                                             <p className="mt-3 text-indigo-500 dark:text-indigo-400 font-mono text-[9px]">{item.hashtags}</p>
                                           </>
                                         ) : <span className="italic text-zinc-400">Nenhuma legenda gerada.</span>}
                                       </div>
                                       <button onClick={() => handleCopyText(`${item.captions || ''}\n\n${item.hashtags || ''}`, 'Conteúdo')} className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-sm flex items-center justify-center gap-1.5">
                                         <Copy className="w-3.5 h-3.5" /> Copiar Tudo
                                       </button>
                                     </div>
                                  )}

                                  {activeTab === 'publish' && (
                                     <div className="space-y-3 animate-in fade-in duration-300">
                                       <div className="grid grid-cols-1 gap-2">
                                          <button onClick={() => publishToPlatform(item.uuid, 'instagram')} disabled={publishingStatus[item.uuid]?.instagram === 'publishing' || publishingStatus[item.uuid]?.instagram === 'published'} className="w-full py-2 rounded-xl text-[9px] font-bold uppercase transition-all border flex items-center justify-between px-4 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 disabled:opacity-70">
                                            <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-pink-500"/> Instagram Reels</span>
                                            <span>{publishingStatus[item.uuid]?.instagram === 'published' ? '✓ ENVIADO' : publishingStatus[item.uuid]?.instagram === 'publishing' ? 'ENVIANDO...' : 'POSTAR'}</span>
                                          </button>
                                          <button onClick={() => publishToPlatform(item.uuid, 'youtube')} disabled={publishingStatus[item.uuid]?.youtube === 'publishing' || publishingStatus[item.uuid]?.youtube === 'published'} className="w-full py-2 rounded-xl text-[9px] font-bold uppercase transition-all border flex items-center justify-between px-4 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 disabled:opacity-70">
                                            <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-red-500"/> YouTube Shorts</span>
                                            <span>{publishingStatus[item.uuid]?.youtube === 'published' ? '✓ ENVIADO' : publishingStatus[item.uuid]?.youtube === 'publishing' ? 'ENVIANDO...' : 'POSTAR'}</span>
                                          </button>
                                          <button onClick={() => publishToPlatform(item.uuid, 'facebook')} disabled={publishingStatus[item.uuid]?.facebook === 'publishing' || publishingStatus[item.uuid]?.facebook === 'published'} className="w-full py-2 rounded-xl text-[9px] font-bold uppercase transition-all border flex items-center justify-between px-4 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 disabled:opacity-70">
                                            <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500"/> Facebook</span>
                                            <span>{publishingStatus[item.uuid]?.facebook === 'published' ? '✓ ENVIADO' : publishingStatus[item.uuid]?.facebook === 'publishing' ? 'ENVIANDO...' : 'POSTAR'}</span>
                                          </button>
                                       </div>
                                       <button onClick={() => publishToAllPlatforms(item.uuid)} className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-md flex items-center justify-center gap-1.5">
                                         <Share2 className="w-3.5 h-3.5" /> Disparar em Todos
                                       </button>
                                     </div>
                                  )}

                                  {activeTab === 'schedule' && (
                                     <div className="space-y-4 animate-in fade-in duration-300">
                                       <div className="flex flex-col gap-2">
                                         <label className="text-[9px] font-black uppercase text-zinc-500">Data e Hora (Buffer/Ayrshare)</label>
                                         <input type="datetime-local" id={`schedule-${item.uuid}`} defaultValue={item.data_agendamento ? new Date(item.data_agendamento).toISOString().substring(0, 16) : ""} className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs outline-none text-zinc-900 dark:text-zinc-100 shadow-inner" />
                                       </div>
                                       <button onClick={() => {
                                         const val = (document.getElementById(`schedule-${item.uuid}`) as HTMLInputElement)?.value;
                                         if (!val) { alert('Escolha uma data.'); return; }
                                         handleSchedulePost(item.uuid, val);
                                       }} className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-md flex items-center justify-center gap-1.5">
                                         <CalendarDays className="w-3.5 h-3.5" /> {item.status_agendamento === 'Agendado' ? 'Atualizar Agendamento' : 'Programar Publicação'}
                                       </button>
                                       {item.status_agendamento === 'Agendado' && (
                                         <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 p-2 rounded-xl flex items-center gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                            <span className="text-[9px] font-bold text-emerald-700 dark:text-emerald-400 uppercase">Agendado para {new Date(item.data_agendamento!).toLocaleString()}</span>
                                         </div>
                                       )}
                                     </div>
                                  )}
                               </div>
                            </div>
                          )}

                        </div>
                      </div>
                      );
                    })}
                    
                    {productionItems.length === 0 && (
                      <div className="text-center py-12">
                         <Clock className="w-10 h-10 text-zinc-200 mx-auto mb-3" />
                         <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Aguardando início...</p>
                      </div>
                    )}
                  </div>
               </section>
            ) : showConfig ? (
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
                   <div className="flex bg-zinc-100 dark:bg-zinc-900 rounded-lg p-1">
                     <button
                       onClick={() => setDataSource('products')}
                       className={clsx(
                         "flex-1 text-[10px] font-black uppercase tracking-widest py-2 rounded-md transition-all",
                         dataSource === 'products' ? "bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-sm" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                       )}
                     >
                       Produtos Reais
                     </button>
                     <button
                       onClick={() => setDataSource('lists')}
                       className={clsx(
                         "flex-1 text-[10px] font-black uppercase tracking-widest py-2 rounded-md transition-all",
                         dataSource === 'lists' ? "bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-sm" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                       )}
                     >
                       Listas de Ideação
                     </button>
                   </div>
                   
                   {dataSource === 'lists' && (
                     <div className="space-y-2 animate-in slide-in-from-top-2">
                       <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Selecione uma Lista</label>
                       <select
                         value={selectedListId}
                         onChange={(e) => setSelectedListId(e.target.value)}
                         className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 text-sm font-medium text-zinc-700 dark:text-zinc-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                       >
                         <option value="">-- Escolha uma lista gerada --</option>
                         {productionLists.map(list => (
                           <option key={list.id} value={list.id}>
                             {list.name} ({list.items?.length || 0} itens)
                           </option>
                         ))}
                       </select>
                     </div>
                   )}

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
          {!isDashboardView && (
            <div className="p-6 bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 flex flex-col gap-3">
              <button
                onClick={() => handleLoadStagingArea(false)}
                disabled={
                  isLoading || 
                  !activePreset || 
                  !selectedAccount || 
                  (dataSource === 'products' && products.length === 0) ||
                  (dataSource === 'lists' && !selectedListId)
                }
                className={`w-full relative group overflow-hidden px-6 py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-2xl transition-all flex items-center justify-center gap-3 ${
                  isLoading 
                    ? 'bg-zinc-400 dark:bg-zinc-700 cursor-not-allowed' 
                    : !activePreset || !selectedAccount || (dataSource === 'products' && products.length === 0) || (dataSource === 'lists' && !selectedListId)
                      ? 'bg-zinc-100 text-zinc-400 cursor-not-allowed'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white hover:-translate-y-1 hover:shadow-indigo-500/40'
                }`}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Carregando...
                  </>
                ) : (
                  <>
                    <Package className="w-5 h-5" />
                    Carregar Lote na Staging Area
                  </>
                )}
              </button>

              {!isLoading && activePreset && selectedAccount && ((dataSource === 'products' && products.length > 0) || (dataSource === 'lists' && selectedListId)) && (
                <button
                  onClick={() => handleLoadStagingArea(true)}
                  className="w-full px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest border border-indigo-200 text-indigo-600 hover:bg-indigo-50 dark:border-indigo-800/30 dark:text-indigo-500 dark:hover:bg-indigo-900/20 transition-all flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  Carregar apenas 1º item para teste
                </button>
              )}

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
          )}
        </div>

        {/* Main Content: Chat Sandbox */}
        <div className={clsx(
          "bg-white dark:bg-zinc-950 flex flex-col overflow-hidden relative transition-all duration-500",
          isChatCollapsed ? "w-0 opacity-0 overflow-hidden pointer-events-none" : "flex-1"
        )}>
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

                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <ProductSelector 
                        products={products} 
                        onSelect={handleProductSelect} 
                      />
                    </div>
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
                       <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-tighter">* O Chat abaixo está configurado com este ID de Post.</p>
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
                  systemMessage={`${consolidatedSystemMessage}\n\n[CONTEXTO DE PUBLICAÇÃO]\nID Post: ${currentSandboxUuid}\nID Conta: ${selectedAccount?.id_conta}\nChat ID: ${selectedClient?.chat_id}`}
                  initialPrompt={activePreset.prompt}
                  inputValue={chatInput}
                  sessionId={currentSandboxUuid || undefined}
                  onInputChange={setChatInput}
                  onToolSuccess={handleSandboxToolSuccess}
                />
               </div>
            </div>
          )}
        </div>

      </div>
    </main>
  );
}
