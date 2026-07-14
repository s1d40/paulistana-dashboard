'use client';
export const dynamic = 'force-dynamic';

import { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { usePresetStore, SystemMessageSession } from '@/store/presetStore';
import { useProductionQueue } from '@/store/production-queue';
import { 
  PlayCircle, AlertCircle, Loader2, CheckCircle2, 
  PenTool, Sparkles, Package, Clock, Settings2, 
  Lock, Unlock, ChevronRight, ChevronDown, ChevronLeft, ShieldCheck,
  Music, Image as ImageIcon, Video, Maximize,
  Copy, Download, Share2, Calendar, ExternalLink,
  Layers, Globe, CalendarDays, MoreHorizontal, Type, Smartphone, ListChecks, FolderKanban, Trash2, Edit3
} from 'lucide-react';
import ChatPanel from '@/components/chat-panel';
import ArchitectChat from '@/components/floating-architect-chat';
import PresetSelector from '@/components/preset-selector';
import PromptEditor from '@/components/prompt-editor';
import GlobalMediaConfig from '@/components/global-media-config';
import AccountSelector from '@/components/account-selector';
import ProductSelector from '@/components/product-selector';
// import FloatingArchitectChat from '@/components/floating-architect-chat';
import { fetchProducts, fetchProductionLists, fetchProductionBatches, createProductionBatch, fetchContentPosts, fetchTable, fetchAccounts, fetchClients, GID_VIDEOS, GID_IMAGENS, GID_AUDIOS, Product, ProductionList, ProductionBatch, Account, Client, PostImage, PostAudio, PostVideo, PostVideoCena, updatePostInSupabase, clearMediaFromSupabase } from '@/services/supabase-service';
import clsx from 'clsx';
import { supabase } from '@/lib/supabase';
import ProductionCard from '../components/ProductionCard';
import PresetEditorModal from '@/components/preset-editor-modal';
import ImageModelSelector from '@/components/image-model-selector';
import { DEFAULT_IMAGE_MODEL, modelIdToUrl } from '@/lib/image-models';
import DateTimePicker from '@/components/date-time-picker';

export interface ProductionItem {
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
  statusDetalhe?: string;
  
  // Staging Area Flags
  hasScript?: boolean;
  scriptGeneratingStatus?: 'idle' | 'generating' | 'success' | 'error';
  captionsGeneratingStatus?: 'idle' | 'generating' | 'success' | 'error';
  imagesGeneratingStatus?: 'idle' | 'generating' | 'success' | 'error';
  audiosGeneratingStatus?: 'idle' | 'generating' | 'success' | 'error';
  videoGeneratingStatus?: 'idle' | 'generating' | 'success' | 'error';

  // Strategy overrides
  imageStrategy?: 'ai' | 'produto' | 'embalagem' | 'ambos';
  imageModelOverride?: string;
}

import { useParams, useRouter } from 'next/navigation';

export default function ProductionStudioPage() {
  const params = useParams();
  const router = useRouter();
  const routeId = params?.id?.[0] || null;
  
  const { presets, activePresetId, updatePreset, setActivePreset, initializePresets, createDraftPreset, refreshPreset, isLoading: isPresetLoading } = usePresetStore();
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
  const [isSandboxOpen, setIsSandboxOpen] = useState(false);
  const [currentSandboxProduct, setCurrentSandboxProduct] = useState<any>(null);
  const [currentSandboxUuid, setCurrentSandboxUuid] = useState<string | null>(null);
  const [isSingleLoading, setIsSingleLoading] = useState(false);

  // Fila para auto-produção após roteiro assíncrono
  const [autoProduceQueue, setAutoProduceQueue] = useState<Set<string>>(new Set());

  // Refs para controle de polling
  const isFetchingRef = useRef(false);

  // UI States
  const [showConfig, setShowConfig] = useState(false);
  const [isChatCollapsed, setIsChatCollapsed] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);

  // Publishing Context
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isEditorModalOpen, setIsEditorModalOpen] = useState(false);
  const [batchImageModel, setBatchImageModel] = useState<string>('');

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

  useEffect(() => {
    console.log("🚀 PRODUCTION PAGE MOUNTED! ACTIVE PRESET:", activePreset?.id);
  }, [activePreset?.id]);

  useEffect(() => {
    if (presets.length === 0) {
      console.log("🚀 PRODUCTION PAGE: No presets found in store. Initializing...");
      initializePresets();
    }
  }, [presets.length, initializePresets]);

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
             createDraftPreset('general', foundBatch.preset_id).then(() => {
                setActivePreset(foundBatch.preset_id || null);
             });
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
    // Immediately mark all platforms as publishing for visual feedback
    setPublishingStatus(prev => ({
      ...prev,
      [postId]: {
        ...(prev[postId] || {}),
        instagram: 'publishing',
        youtube: 'publishing',
        facebook: 'publishing',
        all: 'publishing'
      }
    }));

    try {
      const res = await fetch('/api/content/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId,
          accountId: selectedAccount?.id_conta,
          platform: 'all'
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erro desconhecido');
      }

      setPublishingStatus(prev => ({
        ...prev,
        [postId]: {
          instagram: 'published',
          youtube: 'published',
          facebook: 'published',
          all: 'published'
        }
      }));
    } catch (err: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) {
      console.error('Erro ao publicar em todos:', err);
      setPublishingStatus(prev => ({
        ...prev,
        [postId]: {
          ...(prev[postId] || {}),
          instagram: 'error',
          youtube: 'error',
          facebook: 'error',
          all: 'error'
        }
      }));
      alert(`Erro ao disparar publicação: ${err.message}`);
    }
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

  const handlePublishAll = async (platform: string) => {
    const readyItems = productionItems.filter(item => item.status === 'Pronto');
    if (readyItems.length === 0) {
      alert('Nenhum vídeo pronto para publicar.');
      return;
    }
    
    let platformName = 'todas as redes';
    if (platform === 'youtube') platformName = 'o YouTube';
    if (platform === 'instagram') platformName = 'o Instagram';
    if (platform === 'facebook') platformName = 'o Facebook';

    if (confirm(`Deseja publicar em massa ${readyItems.length} posts para ${platformName}?`)) {
      for (const item of readyItems) {
        await publishToPlatform(item.uuid, platform);
      }
    }
  };

  const handleSchedulePost = async (postId: string, dateStr: string) => {
    if (!selectedAccount) {
      alert('Selecione uma conta para agendar.');
      return;
    }
    try {
      // 1. Dispara Webhook primeiro (Se falhar, não salva no banco)
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

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Webhook falhou');
      }

      // 2. Atualiza banco apenas se o webhook deu certo
      await supabase.from('posts').update({
        data_agendamento: new Date(dateStr).toISOString(),
        status_agendamento: 'agendado'
      }).eq('id_post', postId);

      setProductionItems(prev => prev.map(item => {
        if (item.uuid === postId) {
          return {
            ...item,
            status_agendamento: 'agendado',
            data_agendamento: new Date(dateStr).toISOString()
          };
        }
        return item;
      }));

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

    if (confirm(`Deseja agendar sequencialmente ${readyItems.length} posts a cada ${bulkInterval} horas a partir de ${new Date(bulkStartDate).toLocaleDateString('pt-BR')} às ${new Date(bulkStartDate).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}?`)) {
      const currentStart = new Date(bulkStartDate);
      let successCount = 0;
      
      for (let i = 0; i < readyItems.length; i++) {
        const item = readyItems[i];
        const scheduleTime = new Date(currentStart.getTime() + i * bulkInterval * 60 * 60 * 1000);
        
        try {
          await supabase.from('posts').update({
            data_agendamento: scheduleTime.toISOString(),
            status_agendamento: 'agendado'
          }).eq('id_post', item.uuid);

          setProductionItems(prev => prev.map(pi => pi.uuid === item.uuid ? {
            ...pi,
            status_agendamento: 'agendado',
            data_agendamento: scheduleTime.toISOString()
          } : pi));
          
          successCount++;
        } catch (e) {
          console.error(`Falha no agendamento do post ${item.uuid}`, e);
        }
      }
      
      alert(`Agendamento em massa concluído! ${successCount}/${readyItems.length} salvos no banco. O n8n verificará e fará a postagem automaticamente.`);
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
    setChatInput(newPrompt);
  };

  const uuidsRef = useRef<string[]>([]);
  const autoProduceQueueRef = useRef<Set<string>>(autoProduceQueue);

  useEffect(() => {
    uuidsRef.current = productionItems.map(i => i.uuid);
  }, [productionItems]);

  useEffect(() => {
    autoProduceQueueRef.current = autoProduceQueue;
  }, [autoProduceQueue]);

  // --- REAL-TIME POLLING LOGIC ---
  const fetchUpdatedState = useCallback(async (payload?: any) => {
      try {
        const uuids = uuidsRef.current;
        if (uuids.length === 0) return;
        
        // Se foi um evento do realtime para um post específico, checa se ele está na nossa tela
        if (payload && payload.new && payload.new.id_post) {
           if (!uuids.includes(payload.new.id_post)) return;
        }

          const [
            { data: allPosts },
            { data: allImages },
            { data: allAudios },
            { data: allVideos }
          ] = await Promise.all([
            supabase.from('posts').select('id_post, status, roteiro_gerado, titulo_post, captions, hashtags, status_agendamento, data_agendamento').in('id_post', uuids),
            supabase.from('imagens').select('id_post, image_url, url_imagem_fundo').in('id_post', uuids),
            supabase.from('audios').select('id_post, audio_url').in('id_post', uuids),
            supabase.from('videos').select('id_post, video_final_url').in('id_post', uuids)
          ]);

          const posts = allPosts || [];
          const images = allImages || [];
          const audios = allAudios || [];
          const videos = allVideos || [];

          setProcessingItems(prev => {
             const next = new Set(prev);
             let changed = false;
             posts.forEach(p => {
               if (p.status === 'Concluído' || p.status === 'Erro na Produção') {
                  if (next.has(p.id_post)) {
                     next.delete(p.id_post);
                     changed = true;
                  }
               }
             });
             videos.forEach(v => {
               if (v.video_final_url) {
                  if (next.has(v.id_post)) {
                     next.delete(v.id_post);
                     changed = true;
                  }
               }
             });
             return changed ? next : prev;
          });

          setProductionItems(prevItems => prevItems.map(item => {
            const livePost = posts.find(p => p.id_post === item.uuid);
            const liveImages = images.filter(img => img.id_post === item.uuid && (img.image_url || img.url_imagem_fundo));
            const liveAudios = audios.filter(audio => audio.id_post === item.uuid && audio.audio_url);
            const liveVideo = videos.find(v => v.id_post === item.uuid && v.video_final_url);

            let newStatus: ProductionItem['status'] = item.status;
            const dbStatus = livePost?.status || '';
            
            if (dbStatus === 'Concluído' || dbStatus.startsWith('Concluído') || liveVideo?.video_final_url) {
              newStatus = 'Pronto';
            } else if (dbStatus === 'Erro na Produção') {
              newStatus = 'Erro';
            } else if (dbStatus === 'Produzir' || dbStatus === 'Processando' || dbStatus.startsWith('Processando') || dbStatus.startsWith('Compilando') || dbStatus.startsWith('Fazendo upload') || dbStatus.startsWith('Gerando')) {
              newStatus = 'Processando';
            } else if (livePost) {
              newStatus = 'Aguardando';
            }

            const hasValidScript = livePost?.roteiro_gerado && 
                                   (typeof livePost.roteiro_gerado === 'string' 
                                      ? livePost.roteiro_gerado !== '{"status":"Gerando..."}' && !livePost.roteiro_gerado.includes('"status": "Gerando..."')
                                      : !livePost.roteiro_gerado.status);

            const newScriptGeneratingStatus = hasValidScript ? 'success' : (dbStatus === 'Processando Roteiro' || dbStatus.startsWith('Processando') ? 'generating' : (dbStatus === 'Erro na Produção' ? 'error' : item.scriptGeneratingStatus));

            // Auto-produce logic: se o script acabou de ficar pronto e estava na fila de auto-produção
            if (hasValidScript && !item.hasScript && autoProduceQueueRef.current.has(item.uuid)) {
              supabase.from('posts').update({ status: 'Produzir' }).eq('id_post', item.uuid).then(({ error }) => {
                if (!error) {
                  setAutoProduceQueue(prev => {
                    const next = new Set(prev);
                    next.delete(item.uuid);
                    return next;
                  });
                }
              });
              // Para a interface não piscar em 'Aguardando', já forçamos visualmente para Processando
              newStatus = 'Processando';
            }

            const hasValidCaptions = livePost?.captions && livePost.captions.length > 0;
            const newCaptionsGeneratingStatus = hasValidCaptions ? 'success' : item.captionsGeneratingStatus;

            return { 
              ...item, 
              status: newStatus,
              statusDetalhe: (newStatus === 'Processando' && dbStatus !== 'Produzir' && dbStatus !== 'Processando') ? dbStatus : undefined,
              videoUrl: liveVideo?.video_final_url,
              images: liveImages.map(img => img.image_url || img.url_imagem_fundo || ''),
              audios: liveAudios.map(audio => audio.audio_url || ''),
              tituloOtimizado: livePost?.titulo_post || item.tituloOtimizado,
              captions: livePost?.captions || item.captions,
              hashtags: livePost?.hashtags || item.hashtags,
              status_agendamento: livePost?.status_agendamento || item.status_agendamento,
              data_agendamento: livePost?.data_agendamento || item.data_agendamento,
              hasScript: hasValidScript ? true : item.hasScript,
              scriptGeneratingStatus: newScriptGeneratingStatus,
              captionsGeneratingStatus: newCaptionsGeneratingStatus
            };
          }));
        } catch (err) {
          console.error('Erro na atualização realtime:', err);
        }
    }, []);

  useEffect(() => {
    // Busca a mídia dos posts recém carregados
    if (productionItems.length > 0) {
      fetchUpdatedState();
    }
  }, [productionItems.length, fetchUpdatedState]);

  useEffect(() => {
    const channel = supabase.channel('production_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, fetchUpdatedState)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'videos' }, fetchUpdatedState)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'imagens' }, fetchUpdatedState)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'audios' }, fetchUpdatedState)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'production_lists' }, () => {
        fetchProductionLists().then(setProductionLists);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'production_batches' }, () => {
        fetchProductionBatches().then(setProductionBatches);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchUpdatedState]); // Canal é recriado de forma segura apenas se o callback mudar (o que não acontece pois está memoizado)

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
  // Cascade: itemOverride → batchImageModel → preset.config.image_model → DEFAULT
  const normalizeScript = (rawScript: any /* eslint-disable-line @typescript-eslint/no-explicit-any */, itemImageModelOverride?: string) => {
    const script = { ...rawScript };
    const presetImageModel = (activePreset as any)?.config?.image_model || DEFAULT_IMAGE_MODEL;
    // Resolve cascade: most specific wins
    const resolvedImageModel = itemImageModelOverride || batchImageModel || presetImageModel;
    const globalVoiceSettings = (activePreset as any)?.config?.voice_settings || {
      voice_id: 'EXAVITQu4vr4xnSDxMaL',
      model_id: "eleven_multilingual_v2",
      stability: 0.7,
      similarity_boost: 0.75,
      style: 0.15,
      use_speaker_boost: true,
      speed: 1.10
    };

    if (script.cenas && Array.isArray(script.cenas)) {
      script.cenas = script.cenas.map((cena: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) => {
        const updatedCena = { 
          ...cena,
          id_cena: cena.id_cena || crypto.randomUUID()
        };
        if (!updatedCena.replicate) {
          const isLandscape = script.formato_video === 'landscape' || !script.formato_video;
          updatedCena.replicate = {
            model_url: modelIdToUrl(resolvedImageModel),
            input: {
              prompt: updatedCena.prompt_visual,
              negative_prompt: updatedCena.prompt_negativo,
              aspect_ratio: isLandscape ? '16:9' : '9:16',
              output_format: 'jpg'
            }
          };
        } else {
          // Even if replicate already exists, update model_url with the cascade resolution
          updatedCena.replicate = {
            ...updatedCena.replicate,
            model_url: modelIdToUrl(resolvedImageModel),
          };
        }
        return updatedCena;
      });
    }
    
    if (!script.voice_settings) {
      script.voice_settings = globalVoiceSettings;
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
    const targetListId = directListId || selectedListId;
    
    let listObj = productionLists.find(l => l.id === targetListId);
    
    let preset = activePreset;
    let draftIdDebug = null;
    let freshPresetsDebug = 0;
    
    if (dataSource === 'lists' && listObj && listObj.preset_id) {
       // Cria um draft efêmero clonado do preset original para que a IA não altere o preset global da loja
       // O ID da lista é usado como ID do draft, para que o mesmo draft seja reutilizado ao recarregar a lista
       const draftId = await createDraftPreset(listObj.preset_id.includes('historico') ? 'general' : 'general', listObj.id, listObj.preset_id);
       draftIdDebug = draftId;
       const freshPresets = usePresetStore.getState().presets;
       freshPresetsDebug = freshPresets.length;
       if (draftId) {
         preset = freshPresets.find(p => p.id === draftId) || activePreset || freshPresets[0];
         setActivePreset(draftId);
       } else {
         preset = freshPresets.find(p => p.id === listObj.preset_id) || activePreset || freshPresets[0];
         if (preset && preset.id !== activePreset?.id) setActivePreset(preset.id);
       }
    } else {
       preset = activePreset || usePresetStore.getState().presets[0];
       freshPresetsDebug = usePresetStore.getState().presets.length;
    }

    if (!preset) {
       alert(`Nenhum Preset disponível para inicializar.\nDEBUG INFO:\ndataSource: ${dataSource}\nlistObj found: ${!!listObj}\npreset_id: ${listObj?.preset_id}\ndraftId: ${draftIdDebug}\nfreshPresets length: ${freshPresetsDebug}`);
       return;
    }
    
    let account = selectedAccount;
    // We don't have access to clientAccounts directly here without state, but we can assume if it's missing, it'll fail at the API.
    if (!account) {
       alert("Nenhuma conta selecionada. Por favor, verifique as configurações (Left Sidebar).");
       return;
    }
    
    let items: ProductionItem[] = [];
    
    
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
      const { data: posts } = await supabase.from('posts').select('id_post, roteiro_gerado, status').in('id_post', uuids);
      // 2. Puxar Imagens
      const { data: images } = await supabase.from('imagens').select('id_post, image_url').in('id_post', uuids);
      // 3. Puxar Áudios
      const { data: audios } = await supabase.from('audios').select('id_post, audio_url').in('id_post', uuids);
      // 4. Puxar Videos
      const { data: videos } = await supabase.from('videos').select('id_post, video_final_url').in('id_post', uuids);

      items = items.map(item => {
        const post = posts?.find(p => p.id_post === item.uuid);
        const postImages = images?.filter(img => img.id_post === item.uuid) || [];
        const postAudios = audios?.filter(aud => aud.id_post === item.uuid) || [];
        const postVideo = videos?.find(vid => vid.id_post === item.uuid);

        let statusAtual: 'Aguardando' | 'Processando' | 'Pronto' | 'Erro' = 'Aguardando';
        if (post?.status === 'Concluído' || postVideo?.video_final_url) {
           statusAtual = 'Pronto';
        } else if (post?.status === 'Produzir' || post?.status === 'Processando') {
           statusAtual = 'Processando';
        } else if (post?.status === 'Erro na Produção') {
           statusAtual = 'Erro';
        }

        return {
          ...item,
          status: statusAtual,
          hasScript: !!post?.roteiro_gerado,
          videoUrl: postVideo?.video_final_url,
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

  const getAssetUrl = (folder: string, slug: string | null) => {
    if (!slug) return null;
    const fileName = slug.includes('.') ? slug : `${slug}.png`;
    return `https://tvszuzokdrcyemwsvtfs.supabase.co/storage/v1/object/public/images/${folder}/${fileName}`;
  };

  const handleGenerateScript = async (item: ProductionItem) => {
    if (!activePreset || !selectedAccount) return;
    
    updateItemState(item.uuid, { scriptGeneratingStatus: 'generating' });

    try {
      let newPrompt = activePreset.prompt;
      let imgRealUrl: string | undefined;
      let imgEmbalagemUrl: string | undefined;
      
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
          if (productData.slug_imagem_real) {
            imgRealUrl = getAssetUrl('produtos_reais', productData.slug_imagem_real) || undefined;
          }
          if (productData.slug_embalagem) {
            imgEmbalagemUrl = getAssetUrl('embalagens', productData.slug_embalagem) || undefined;
          }
        }
      }

      const initPostPayload: Record<string, any> = { 
        action: 'init_post',
        id_post: item.uuid,
        tema_post: item.produto,
        titulo_post: item.tituloOtimizado || item.produto,
        roteiro_gerado: '{"status":"Gerando..."}',
        status: 'Processando Roteiro',
        id_conta: selectedAccount.id_conta,
        captions: item.captions || '',
        hashtags: item.hashtags || ''
      };

      if (dataSource === 'lists' && selectedListId) {
        initPostPayload.production_list_id = selectedListId;
      }

      const prodRes = await fetch('/api/production', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(initPostPayload),
      });

      if (!prodRes.ok) throw new Error(`Erro ao inicializar post no banco`);

      const response = await fetch('/api/chat/roteirista', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_post: item.uuid,
          user_prompt: item.customPrompt ? `${item.customPrompt}\nTema do vídeo: ${item.produto}` : `Por favor, crie o roteiro baseando-se no tema: "${item.produto}".`,
          system_message: consolidatedSystemMessage,
          image_url: imgRealUrl,
          image_url_packaging: imgEmbalagemUrl,
          image_strategy: item.imageStrategy || 'ai',
          config: {
            model: (activePreset as any)?.config?.model || 'gpt-4o',
            temperature: (activePreset as any)?.config?.temperature || 0.7,
            image_model: item.imageModelOverride || batchImageModel || (activePreset as any)?.config?.image_model || DEFAULT_IMAGE_MODEL,
            voice_settings: (activePreset as any)?.config?.voice_settings || undefined,
            prompt: newPrompt
          }
        }),
      });

      if (!response.ok) throw new Error(`Erro ao disparar webhook do roteirista para ${item.produto}`);

      // We DO NOT await the script parsing here because n8n is async and will return 200 OK immediately
      // The polling loop will update hasScript and scriptGeneratingStatus when n8n updates Supabase!

      // -- NOVA INTEGRAÇÃO: Dispara a geração de Legendas e Hashtags em background --
      updateItemState(item.uuid, { captionsGeneratingStatus: 'generating' });
      fetch('/api/chat/legenda', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_post: item.uuid,
          tema_post: item.produto,
          user_prompt: item.customPrompt,
          system_message: consolidatedSystemMessage
        })
      })
      .then(res => res.json())
      .then(async data => {
        if (data.success && data.data) {
          const captions = data.data.captions || '';
          const hashtags = data.data.hashtags || '';
          
          if (captions || hashtags) {
            // Se respondeu de forma síncrona (com os dados), atualizamos imediatamente.
            // Update local state and supabase!
            updateItemState(item.uuid, { captions, hashtags, captionsGeneratingStatus: 'success' });
            await updatePostInSupabase(item.uuid, { captions, hashtags });
          }
          // Se não veio, assumimos que o n8n vai atualizar de forma assíncrona (SQL Node).
          // O fetchUpdatedState (Supabase Realtime) vai cuidar de jogar pra success.
        } else {
           updateItemState(item.uuid, { captionsGeneratingStatus: 'error' });
        }
      })
      .catch(err => {
         console.error('Falha ao gerar legenda background:', err);
         updateItemState(item.uuid, { captionsGeneratingStatus: 'error' });
      });
      

    } catch (err) {
      console.error(err);
      updateItemState(item.uuid, { scriptGeneratingStatus: 'error' });
      alert(`Falha ao gerar roteiro para ${item.produto}`);
    }
  };

  const handleDiscardItem = async (uuid: string) => {
    if (!window.confirm('Deseja realmente descartar este conteúdo? O roteiro e os arquivos de mídia gerados não poderão ser recuperados.')) return;
    
    updateItemState(uuid, {
      status: 'Aguardando',
      hasScript: false,
      videoUrl: undefined,
      images: [],
      audios: [],
      scriptGeneratingStatus: 'idle',
      imagesGeneratingStatus: 'idle',
      audiosGeneratingStatus: 'idle',
      videoGeneratingStatus: 'idle',
      captions: undefined,
      hashtags: undefined
    });

    try {
      await updatePostInSupabase(uuid, {
        status: 'Aguardando Revisão',
        roteiro_gerado: null as any,
        captions: null as any,
        hashtags: null as any,
        images_status: 'Pendente',
        audio_status: 'Pendente',
        video_status: 'Pendente'
      });
      await clearMediaFromSupabase(uuid);
    } catch (err) {
      console.error('Erro ao descartar item:', err);
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
        setAutoProduceQueue(prev => new Set(prev).add(item.uuid));
        if (item.scriptGeneratingStatus !== 'generating') {
          await handleGenerateScript(item);
        }
        return; // Interrompe aqui. O Polling de 5s vai acionar o 'Produzir' automaticamente quando o webhook finalizar.
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
          
          {/* 🚀 GERAR TODOS Button */}
          {isDashboardView && productionItems.length > 0 && (() => {
            const pendingItems = productionItems.filter(i => i.status !== 'Pronto' && i.status !== 'Processando' && i.status !== 'Erro');
            const processingCount = productionItems.filter(i => i.status === 'Processando').length;
            const isAllDone = pendingItems.length === 0 && processingCount === 0;
            const isGenerating = processingCount > 0;
            return (
              <button
                onClick={async () => {
                  if (!confirm(`Deseja iniciar a produção de ${pendingItems.length} vídeo(s) simultaneamente?`)) return;
                  for (const item of pendingItems) {
                    handleGenerateAll(item);
                    // Small delay to avoid hammering the API
                    await new Promise(r => setTimeout(r, 500));
                  }
                }}
                disabled={pendingItems.length === 0}
                className={clsx(
                  "flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg",
                  isAllDone
                    ? "bg-emerald-600 text-white cursor-default"
                    : isGenerating && pendingItems.length === 0
                    ? "bg-zinc-200 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white hover:scale-105 shadow-purple-600/20"
                )}
              >
                {isAllDone ? (
                  <><CheckCircle2 className="w-4 h-4" /> Todos Prontos</>
                ) : isGenerating && pendingItems.length === 0 ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> {processingCount} Processando...</>
                ) : (
                  <><Sparkles className="w-4 h-4" /> Gerar Todos ({pendingItems.length})</>
                )}
              </button>
            );
          })()}

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

                <div className="pt-6 border-t border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-6">
                   <div className="w-full sm:w-80 text-left bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3">
                     <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-2">Conta de Publicação</label>
                     <AccountSelector onSelect={handleAccountSelect} placement="top" />
                   </div>
                   <div className="w-full sm:w-80 text-left bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3">
                     <ImageModelSelector 
                       value={batchImageModel || (activePreset as any)?.config?.image_model || DEFAULT_IMAGE_MODEL}
                       onChange={setBatchImageModel}
                       label="Modelo de Imagem (Lote)"
                       showDescription={false}
                     />
                   </div>
                   <button
                     onClick={async () => {
                        if (tempSelectedListId) {
                           setSelectedListId(tempSelectedListId);
                           await handleLoadStagingArea(false, tempSelectedListId);
                        }
                     }}
                     disabled={!tempSelectedListId || isLoading || isPresetLoading || !selectedAccount}
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
                          className="px-3 py-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 shadow-md shadow-emerald-900/20 col-span-2"
                        >
                          <Download className="w-3.5 h-3.5" /> Baixar Tudo
                        </button>
                        
                        <div className="col-span-2 space-y-2 pt-2 pb-2">
                          <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-1">
                            <Share2 className="w-3 h-3 text-indigo-400" /> Disparar Imediatamente
                          </span>
                          <div className="grid grid-cols-2 gap-2">
                            <button 
                              onClick={() => handlePublishAll('instagram')}
                              className="px-2 py-2 bg-[#E1306C] hover:bg-[#C13584] text-white rounded-xl text-[8px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1 shadow-md shadow-pink-900/20"
                            >
                              Postar Todos: Instagram
                            </button>
                            <button 
                              onClick={() => handlePublishAll('facebook')}
                              className="px-2 py-2 bg-[#1877F2] hover:bg-[#0C63D4] text-white rounded-xl text-[8px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1 shadow-md shadow-blue-900/20"
                            >
                              Postar Todos: Facebook
                            </button>
                            <button 
                              onClick={() => handlePublishAll('youtube')}
                              className="px-2 py-2 bg-[#FF0000] hover:bg-[#CC0000] text-white rounded-xl text-[8px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1 shadow-md shadow-red-900/20"
                            >
                              Postar Todos: YouTube
                            </button>
                            <button 
                              onClick={() => handlePublishAll('all')}
                              className="px-2 py-2 bg-gradient-to-r from-indigo-600 to-violet-700 hover:from-indigo-500 hover:to-violet-600 text-white rounded-xl text-[8px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1 shadow-md shadow-indigo-900/20"
                            >
                              Postar Todos: (Todas)
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2 pt-2 border-t border-zinc-800">
                        <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-indigo-400" /> Agendamento Sequencial
                        </span>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex flex-col gap-1">
                            <label className="text-[8px] font-bold text-zinc-500 uppercase">Data de Início</label>
                            <DateTimePicker
                              value={bulkStartDate}
                              onChange={setBulkStartDate}
                              dark={true}
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
                      
                      let progress = 5;
                      if (item.hasScript) progress = 25;
                      if ((item.images?.length ?? 0) > 0) progress = 50;
                      if ((item.audios?.length ?? 0) > 0) progress = 75;
                      if (item.status === 'Pronto') progress = 100;

                      return (
                        <ProductionCard
                          key={item.uuid}
                          item={item}
                          activeTab={activeTab}
                          setCardTab={setCardTab}
                          progress={progress}
                          publishingStatus={publishingStatus}
                          onDiscard={handleDiscardItem}
                          onGenerateAll={handleGenerateAll}
                          onGenerateScript={handleGenerateScript}
                          onGenerateImages={handleGenerateImages}
                          onGenerateAudios={handleGenerateAudios}
                          onGenerateVideo={handleGenerateVideo}
                          onUpdateState={updateItemState}
                          onDownload={downloadVideo}
                          onCopyText={handleCopyText}
                          onPublishPlatform={publishToPlatform}
                          onPublishAll={publishToAllPlatforms}
                          onSchedule={handleSchedulePost}
                          activeImageModel={batchImageModel || (activePreset as any)?.config?.image_model || DEFAULT_IMAGE_MODEL}
                        />
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

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block">Preset</label>
                    {activePresetId && (
                      <button 
                        onClick={() => setIsEditorModalOpen(true)}
                        className="flex items-center gap-1.5 px-2 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-md text-[9px] font-bold uppercase hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
                      >
                        <Edit3 className="w-3 h-3" /> Editar Arquiteto
                      </button>
                    )}
                  </div>
                  <PresetSelector />
                </div>
                
                <GlobalMediaConfig />

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
                   
                   <div className="space-y-2">
                     <div className="flex items-center justify-between">
                       <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block">Preset</label>
                       {activePresetId && (
                         <button 
                           onClick={() => setIsEditorModalOpen(true)}
                           className="flex items-center gap-1.5 px-2 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-md text-[9px] font-bold uppercase hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
                         >
                           <Edit3 className="w-3 h-3" /> Editar Arquiteto
                         </button>
                       )}
                     </div>
                     <PresetSelector />
                     
                     {/* Resumo visual do Preset (Mini-Cards) na Esteira */}
                     {activePreset && activePreset.sessions && activePreset.sessions.length > 0 && (
                       <div className="flex flex-wrap gap-1.5 mt-2">
                         {activePreset.sessions.slice(0, 3).map(s => (
                           <span key={s.id} className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/50 text-zinc-500 dark:text-zinc-400 text-[9px] font-black uppercase rounded">
                             {s.title}
                           </span>
                         ))}
                         {activePreset.sessions.length > 3 && (
                           <span className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/50 text-zinc-500 dark:text-zinc-400 text-[9px] font-black uppercase rounded">
                             +{activePreset.sessions.length - 3}
                           </span>
                         )}
                       </div>
                     )}
                   </div>

                   <PromptEditor />
                </section>

                {/* Progress Tracker (Visible after starting) */}
                {productionItems.length > 0 && (
                  <section className="space-y-4 animate-in slide-in-from-left-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                          Progresso da Campanha
                        </label>
                        <span className="text-[10px] font-bold text-zinc-400">{productionItems.length} itens</span>
                      </div>
                      <button 
                        onClick={async () => {
                          const pendingUuids = productionItems
                            .filter(i => i.scriptGeneratingStatus === 'success' && i.status !== 'Pronto' && i.status !== 'Processando')
                            .map(i => i.uuid);
                          if (pendingUuids.length > 0) {
                            await supabase.from('posts').update({ status: 'Produzir' }).in('id_post', pendingUuids);
                          }
                        }}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 shadow-sm"
                      >
                        <Sparkles className="w-3 h-3" />
                        Produzir Vídeos Pendentes
                      </button>
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
                  isPresetLoading ||
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
                  architectComponent={
                    <ArchitectChat 
                      activePresetId={activePreset?.id} 
                      onRefreshPreset={() => {
                         if (activePreset?.id) {
                           console.log("Architect Chat triggered a preset refresh for:", activePreset.id);
                           refreshPreset(activePreset.id);
                         }
                      }}
                    />
                  }
                />
               </div>
            </div>
          )}
        </div>

      </div>
      
      {isEditorModalOpen && (
        <PresetEditorModal presetId={activePresetId} onClose={() => setIsEditorModalOpen(false)} />
      )}
    </main>
  );
}
